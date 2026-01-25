import { NextResponse } from "next/server";
import { z } from "zod";
import dns from "dns/promises";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeUrl,
  extractDomain,
  validateUrlForSsrf,
  isPrivateIp,
} from "@/lib/url";

export const runtime = "nodejs";

// Request timeout in milliseconds
const FETCH_TIMEOUT_MS = 8000;

// Max response size in bytes (2MB)
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024;

// Max redirects to follow
const MAX_REDIRECTS = 5;

// Cache TTL
const DEFAULT_TTL_DAYS = 7;
const PRICE_TTL_HOURS = 24;

// Error codes
type ErrorCode = "INVALID_URL" | "FETCH_BLOCKED" | "TIMEOUT" | "NO_METADATA" | "FETCH_ERROR";

// Request schema
const RequestSchema = z.object({
  url: z.string().min(1).max(2048),
  force: z.boolean().optional().default(false),
});

// Response types
interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  price: { amount: number; currency: string } | null;
  favicon: string | null;
}

interface SuccessResponse {
  ok: true;
  normalizedUrl: string;
  domain: string;
  cached: boolean;
  data: LinkPreviewData;
}

interface ErrorResponse {
  ok: false;
  error: { code: ErrorCode; message: string };
}

type LinkPreviewResponse = SuccessResponse | ErrorResponse;

/**
 * DNS lookup with SSRF protection
 * Resolves the hostname and checks if any resolved IPs (IPv4 and IPv6) are private
 */
async function safeDnsLookup(hostname: string): Promise<{ ok: true; ip: string } | { ok: false; error: string }> {
  const allAddresses: string[] = [];

  // Resolve IPv4 (A records)
  try {
    const ipv4Addresses = await dns.resolve4(hostname);
    allAddresses.push(...ipv4Addresses);
  } catch {
    // No A records, continue to check AAAA
  }

  // Resolve IPv6 (AAAA records)
  try {
    const ipv6Addresses = await dns.resolve6(hostname);
    allAddresses.push(...ipv6Addresses);
  } catch {
    // No AAAA records
  }

  // If no addresses resolved at all, fail
  if (allAddresses.length === 0) {
    return { ok: false, error: "DNS resolution failed: no A or AAAA records found" };
  }

  // Check ALL resolved IPs (both IPv4 and IPv6) for private/reserved ranges
  for (const ip of allAddresses) {
    if (isPrivateIp(ip)) {
      return { ok: false, error: "URL resolves to a private IP address" };
    }
  }

  return { ok: true, ip: allAddresses[0] };
}

/**
 * Fetch HTML with SSRF protection, timeout, and size limit
 */
async function safeFetch(
  urlString: string,
  redirectCount = 0
): Promise<{ ok: true; html: string; finalUrl: string } | { ok: false; error: string; code: ErrorCode }> {
  if (redirectCount > MAX_REDIRECTS) {
    return { ok: false, error: "Too many redirects", code: "FETCH_BLOCKED" };
  }

  const url = new URL(urlString);

  // DNS lookup with SSRF check
  const dnsResult = await safeDnsLookup(url.hostname);
  if (!dnsResult.ok) {
    return { ok: false, error: dnsResult.error, code: "FETCH_BLOCKED" };
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(urlString, {
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "User-Agent": "Desira/1.0 LinkPreview (+https://desira.io)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    clearTimeout(timeoutId);

    // Handle redirects manually to check each hop for SSRF
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, error: "Redirect without location", code: "FETCH_ERROR" };
      }

      // Resolve relative URLs
      const redirectUrl = new URL(location, urlString);
      
      // Validate redirect target
      const redirectValidation = validateUrlForSsrf(redirectUrl.toString());
      if (!redirectValidation.ok) {
        return { ok: false, error: redirectValidation.error, code: "FETCH_BLOCKED" };
      }

      return safeFetch(redirectUrl.toString(), redirectCount + 1);
    }

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}`, code: "FETCH_ERROR" };
    }

    // Check content length
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return { ok: false, error: "Response too large", code: "FETCH_ERROR" };
    }

    // Read body with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return { ok: false, error: "No response body", code: "FETCH_ERROR" };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.length;
      if (totalSize > MAX_RESPONSE_SIZE) {
        reader.cancel();
        return { ok: false, error: "Response too large", code: "FETCH_ERROR" };
      }

      chunks.push(value);
    }

    const html = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array())
    );

    return { ok: true, html, finalUrl: urlString };
  } catch (err) {
    clearTimeout(timeoutId);
    
    if ((err as Error).name === "AbortError") {
      return { ok: false, error: "Request timeout", code: "TIMEOUT" };
    }
    
    return { ok: false, error: (err as Error).message, code: "FETCH_ERROR" };
  }
}

/**
 * Extract meta tag content from HTML
 */
function extractMetaContent(html: string, property: string): string | null {
  // Try property attribute (OG/Twitter)
  const propertyMatch = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  ).exec(html);
  if (propertyMatch) return propertyMatch[1];

  // Try content first, then property (alternate order)
  const contentFirstMatch = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  ).exec(html);
  if (contentFirstMatch) return contentFirstMatch[1];

  return null;
}

/**
 * Extract <title> tag content
 */
function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match ? match[1].trim() : null;
}

/**
 * Extract JSON-LD data from HTML
 */
function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Handle both single objects and arrays
      if (Array.isArray(data)) {
        results.push(...data);
      } else {
        results.push(data);
      }
    } catch {
      // Ignore invalid JSON-LD
    }
  }

  return results;
}

/**
 * Find Product data in JSON-LD
 */
function findProductInJsonLd(jsonLdItems: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const item of jsonLdItems) {
    // Direct Product type
    if (item["@type"] === "Product") {
      return item;
    }
    
    // Check @graph array
    const graph = item["@graph"];
    if (Array.isArray(graph)) {
      for (const graphItem of graph) {
        if ((graphItem as Record<string, unknown>)["@type"] === "Product") {
          return graphItem as Record<string, unknown>;
        }
      }
    }
  }
  return null;
}

/**
 * Extract price from Product JSON-LD
 */
function extractPriceFromProduct(product: Record<string, unknown>): { amount: number; currency: string } | null {
  const offers = product.offers;
  
  if (!offers) return null;

  // Single offer
  if (typeof offers === "object" && !Array.isArray(offers)) {
    const offer = offers as Record<string, unknown>;
    const price = offer.price ?? offer.lowPrice;
    const currency = offer.priceCurrency;
    
    if (price !== undefined && currency) {
      const amount = typeof price === "string" ? parseFloat(price) : Number(price);
      if (!isNaN(amount)) {
        return { amount, currency: String(currency) };
      }
    }
  }

  // Array of offers - take first valid one
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const offerObj = offer as Record<string, unknown>;
      const price = offerObj.price ?? offerObj.lowPrice;
      const currency = offerObj.priceCurrency;
      
      if (price !== undefined && currency) {
        const amount = typeof price === "string" ? parseFloat(price) : Number(price);
        if (!isNaN(amount)) {
          return { amount, currency: String(currency) };
        }
      }
    }
  }

  return null;
}

/**
 * Extract favicon URL from HTML
 * Priority: apple-touch-icon → icon → shortcut icon
 */
function extractFavicon(html: string, baseUrl: string): string | null {
  // Try various link rel patterns
  const patterns = [
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i,
    /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
    /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']shortcut icon["']/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      const faviconUrl = match[1];
      // Resolve relative URLs
      try {
        return new URL(faviconUrl, baseUrl).toString();
      } catch {
        return faviconUrl;
      }
    }
  }

  return null;
}

/**
 * Get favicon URL with fallback to Google's favicon service
 */
function getFaviconWithFallback(extractedFavicon: string | null, domain: string): string {
  if (extractedFavicon) {
    return extractedFavicon;
  }
  // Use Google's favicon service as a reliable fallback
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

/**
 * Parse HTML and extract metadata
 */
function parseHtml(html: string, finalUrl: string): LinkPreviewData {
  // Extract JSON-LD first
  const jsonLdItems = extractJsonLd(html);
  const product = findProductInJsonLd(jsonLdItems);

  // Title priority: og:title → twitter:title → JSON-LD name → <title>
  const title =
    extractMetaContent(html, "og:title") ??
    extractMetaContent(html, "twitter:title") ??
    (product?.name as string | undefined) ??
    extractTitle(html);

  // Description priority: og:description → twitter:description → JSON-LD description → meta description
  const description =
    extractMetaContent(html, "og:description") ??
    extractMetaContent(html, "twitter:description") ??
    (product?.description as string | undefined) ??
    extractMetaContent(html, "description");

  // Image priority: og:image → twitter:image → JSON-LD image → link[rel=image_src]
  let image =
    extractMetaContent(html, "og:image") ??
    extractMetaContent(html, "twitter:image");
  
  if (!image && product?.image) {
    const productImage = product.image;
    if (typeof productImage === "string") {
      image = productImage;
    } else if (Array.isArray(productImage) && productImage.length > 0) {
      image = typeof productImage[0] === "string" ? productImage[0] : (productImage[0] as Record<string, unknown>)?.url as string;
    } else if (typeof productImage === "object" && productImage !== null) {
      image = (productImage as Record<string, unknown>).url as string;
    }
  }

  // Collect all images
  const images: string[] = [];
  if (image) images.push(image);
  
  // Additional og:image entries
  const ogImageRegex = /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  let match;
  while ((match = ogImageRegex.exec(html)) !== null) {
    if (match[1] && !images.includes(match[1])) {
      images.push(match[1]);
    }
  }

  // Price priority: JSON-LD Product offers → og:product:price
  let price: { amount: number; currency: string } | null = null;
  
  if (product) {
    price = extractPriceFromProduct(product);
  }

  if (!price) {
    const ogPrice = extractMetaContent(html, "product:price:amount");
    const ogCurrency = extractMetaContent(html, "product:price:currency");
    
    if (ogPrice && ogCurrency) {
      const amount = parseFloat(ogPrice);
      if (!isNaN(amount)) {
        price = { amount, currency: ogCurrency };
      }
    }
  }

  // Extract favicon
  const domain = extractDomain(finalUrl);
  const extractedFavicon = extractFavicon(html, finalUrl);
  const favicon = getFaviconWithFallback(extractedFavicon, domain);

  return {
    title: title ? decodeHtmlEntities(title) : null,
    description: description ? decodeHtmlEntities(description) : null,
    image,
    images,
    price,
    favicon,
  };
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Check cache for existing preview
 */
async function getCachedPreview(normalizedUrl: string, force: boolean): Promise<LinkPreviewData | null> {
  if (force) return null;

  const { data } = await supabaseAdmin
    .from("link_previews")
    .select("title, description, image, images, price_amount, price_currency, favicon, status, expires_at")
    .eq("normalized_url", normalizedUrl)
    .single();

  if (!data) return null;

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Don't return cached errors
  if (data.status !== "ok") return null;

  // Get domain for fallback favicon
  const domain = extractDomain(normalizedUrl);

  return {
    title: data.title,
    description: data.description,
    image: data.image,
    images: (data.images as string[]) ?? [],
    price: data.price_amount !== null && data.price_currency
      ? { amount: Number(data.price_amount), currency: data.price_currency }
      : null,
    favicon: data.favicon ?? getFaviconWithFallback(null, domain),
  };
}

/**
 * Save preview to cache
 */
async function cachePreview(
  normalizedUrl: string,
  data: LinkPreviewData,
  status: "ok" | "error",
  httpStatus?: number,
  errorCode?: string
): Promise<void> {
  // TTL: 24 hours if price exists, 7 days otherwise
  const ttlHours = data.price ? PRICE_TTL_HOURS : DEFAULT_TTL_DAYS * 24;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("link_previews")
    .upsert({
      normalized_url: normalizedUrl,
      title: data.title,
      description: data.description,
      image: data.image,
      images: data.images,
      price_amount: data.price?.amount ?? null,
      price_currency: data.price?.currency ?? null,
      favicon: data.favicon,
      status,
      http_status: httpStatus ?? null,
      error_code: errorCode ?? null,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, {
      onConflict: "normalized_url",
    });
}

/**
 * POST /api/link-preview
 * Fetch and parse URL metadata with caching
 */
export async function POST(req: Request): Promise<NextResponse<LinkPreviewResponse>> {
  const json = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: "Invalid request" } },
      { status: 400 }
    );
  }

  const { url: rawUrl, force } = parsed.data;

  // Validate URL format and SSRF
  const ssrfCheck = validateUrlForSsrf(rawUrl);
  if (!ssrfCheck.ok) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: ssrfCheck.error } },
      { status: 400 }
    );
  }

  // Normalize URL
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(rawUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: "Could not normalize URL" } },
      { status: 400 }
    );
  }

  const domain = extractDomain(normalizedUrl);

  // Check cache
  const cached = await getCachedPreview(normalizedUrl, force);
  if (cached) {
    return NextResponse.json({
      ok: true,
      normalizedUrl,
      domain,
      cached: true,
      data: cached,
    });
  }

  // Fetch and parse
  const fetchResult = await safeFetch(normalizedUrl);
  
  if (!fetchResult.ok) {
    // Cache the error
    await cachePreview(
      normalizedUrl,
      { title: null, description: null, image: null, images: [], price: null, favicon: null },
      "error",
      undefined,
      fetchResult.code
    );

    return NextResponse.json(
      { ok: false, error: { code: fetchResult.code, message: fetchResult.error } },
      { status: 422 }
    );
  }

  const data = parseHtml(fetchResult.html, fetchResult.finalUrl);

  // Check if we got any useful metadata
  if (!data.title && !data.description && !data.image) {
    await cachePreview(normalizedUrl, data, "error", 200, "NO_METADATA");
    
    return NextResponse.json(
      { ok: false, error: { code: "NO_METADATA" as const, message: "No metadata found on page" } },
      { status: 422 }
    );
  }

  // Cache success
  await cachePreview(normalizedUrl, data, "ok", 200);

  return NextResponse.json({
    ok: true,
    normalizedUrl,
    domain,
    cached: false,
    data,
  });
}

