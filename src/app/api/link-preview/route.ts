import { NextResponse } from "next/server";
import { z } from "zod";
import { lookup } from "dns/promises";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchAmazonPreview, parseAmazonProductUrl } from "@/lib/amazon-paapi";
import {
  getRateLimitClientKey,
  RateLimitUnavailableError,
  takeRateLimit,
} from "@/lib/rate-limit";
import {
  normalizeUrl,
  extractDomain,
  validateUrlForSsrf,
  isPrivateIp,
} from "@/lib/url";
import { buildMerchantFailureLog } from "@/lib/link-preview/merchant-support";

// Use Node.js runtime to allow setting Host header for pinned-IP SSRF protection.
// Edge runtime forbids the Host header per Web Fetch spec, which breaks TLS/SNI
// when connecting to a resolved IP while maintaining virtual hosting.
export const runtime = "nodejs";

// Use a modern browser-like UA to reduce bot blocks on major retailers.
const PREVIEW_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
const PREVIEW_ACCEPT_LANGUAGE = "en-CA,en-US;q=0.9,en;q=0.8";

// Request timeout in milliseconds
const FETCH_TIMEOUT_MS = 8000;

// DoH lookup timeout in milliseconds
const DOH_TIMEOUT_MS = 5000;

// Max response size in bytes (2MB)
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024;
// Max bytes to read when only extracting metadata from very large pages.
const METADATA_READ_LIMIT = 512 * 1024;

// Max redirects to follow
const MAX_REDIRECTS = 5;

// Cache TTL
const DEFAULT_TTL_DAYS = 7;
const PRICE_TTL_HOURS = 24;
const LINK_PREVIEW_WINDOW_SECONDS = 10 * 60;
const LINK_PREVIEW_MAX_MISSES_PER_IP = 20;
const LINK_PREVIEW_MAX_MISSES_PER_IP_DOMAIN = 8;

// Error codes
type ErrorCode =
  | "INVALID_URL"
  | "FETCH_BLOCKED"
  | "TIMEOUT"
  | "NO_METADATA"
  | "FETCH_ERROR"
  | "RATE_LIMITED"
  | "PREVIEW_UNAVAILABLE";

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

type LinkPreviewMetricStatus =
  | "success"
  | "unauthorized"
  | "invalid_request"
  | "invalid_url"
  | "rate_limited"
  | "preview_unavailable"
  | "error";

type LinkPreviewSource = "cache" | "paapi" | "paapi_fallback" | "html" | "html_plus_paapi" | "none";

/**
 * DNS-over-HTTPS response types from Cloudflare
 */
interface DoHAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DoHResponse {
  Status: number;
  Answer?: DoHAnswer[];
}

/**
 * DNS lookup with SSRF protection using DNS-over-HTTPS (Cloudflare)
 * Resolves the hostname and checks if any resolved IPs (IPv4 and IPv6) are private
 * Works in both Node.js and Cloudflare Workers environments
 */
async function safeDnsLookup(hostname: string): Promise<{ ok: true; ip: string } | { ok: false; error: string }> {
  const allAddresses: string[] = [];

  // Resolve IPv4 (A records) and IPv6 (AAAA records) in parallel via DoH
  const [ipv4Result, ipv6Result] = await Promise.allSettled([
    fetchDoHRecords(hostname, "A"),
    fetchDoHRecords(hostname, "AAAA"),
  ]);

  if (ipv4Result.status === "fulfilled" && ipv4Result.value.length > 0) {
    allAddresses.push(...ipv4Result.value);
  }

  if (ipv6Result.status === "fulfilled" && ipv6Result.value.length > 0) {
    allAddresses.push(...ipv6Result.value);
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
 * Fetch DNS records via Cloudflare DNS-over-HTTPS
 * Includes timeout handling to prevent stalling if DoH is slow/unreachable
 */
async function fetchDoHRecords(hostname: string, type: "A" | "AAAA"): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/dns-json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DoHResponse;
    
    // Status 0 means NOERROR
    if (data.Status !== 0 || !data.Answer) {
      return [];
    }

    // Type 1 = A, Type 28 = AAAA
    const expectedType = type === "A" ? 1 : 28;
    return data.Answer
      .filter((record) => record.type === expectedType)
      .map((record) => record.data);
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Verify system DNS also resolves to safe (non-private) IPs
 * This catches split-horizon DNS or hosts file overrides that could bypass DoH validation
 */
async function verifySystemDns(hostname: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const results = await lookup(hostname, { all: true });
    
    for (const entry of results) {
      if (isPrivateIp(entry.address)) {
        return { ok: false, error: "System DNS resolves to a private IP address" };
      }
    }
    
    return { ok: true };
  } catch {
    // If system DNS fails completely, block the request as we can't guarantee safety
    return { ok: false, error: "System DNS resolution failed" };
  }
}

/**
 * Fetch HTML with SSRF protection, timeout, and size limit
 * Pins requests to resolved IP to prevent DNS rebinding attacks
 */
async function safeFetch(
  urlString: string,
  redirectCount = 0
): Promise<{ ok: true; html: string; finalUrl: string } | { ok: false; error: string; code: ErrorCode }> {
  if (redirectCount > MAX_REDIRECTS) {
    return { ok: false, error: "Too many redirects", code: "FETCH_BLOCKED" };
  }

  const url = new URL(urlString);
  const originalHostname = url.hostname;

  // DNS lookup with SSRF check via DoH - returns a verified safe IP
  const dnsResult = await safeDnsLookup(url.hostname);
  if (!dnsResult.ok) {
    return { ok: false, error: dnsResult.error, code: "FETCH_BLOCKED" };
  }

  const isHttps = url.protocol === "https:";
  const resolvedIp = dnsResult.ip;

  // Build the fetch URL and headers
  let fetchUrl: string;
  const headers: Record<string, string> = {
    "User-Agent": PREVIEW_USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": PREVIEW_ACCEPT_LANGUAGE,
  };

  if (isHttps) {
    // For HTTPS, we can't easily pin to the resolved IP because:
    // 1. Node's native fetch uses the system resolver
    // 2. TLS/SNI requires the original hostname for cert validation
    //
    // To prevent SSRF when DoH and system DNS disagree (split-horizon DNS,
    // hosts file overrides, etc.), we verify the system resolver also
    // returns safe (non-private) IPs before proceeding.
    const systemDnsCheck = await verifySystemDns(originalHostname);
    if (!systemDnsCheck.ok) {
      return { ok: false, error: systemDnsCheck.error, code: "FETCH_BLOCKED" };
    }
    fetchUrl = urlString;
  } else {
    // HTTP: Pin to resolved IP to prevent DNS rebinding
    const pinnedUrl = new URL(urlString);
    // Don't manually add brackets for IPv6 - URL API handles serialization
    pinnedUrl.hostname = resolvedIp;
    fetchUrl = pinnedUrl.toString();
    // Set Host header for virtual hosting
    headers["Host"] = originalHostname;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      redirect: "manual",
      headers,
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

    const contentLength = response.headers.get("content-length");
    const parsedContentLength = contentLength ? parseInt(contentLength, 10) : NaN;
    const readMetadataOnly = Number.isFinite(parsedContentLength) && parsedContentLength > MAX_RESPONSE_SIZE;

    // Read body with size limit (or partial read for oversized pages)
    const reader = response.body?.getReader();
    if (!reader) {
      return { ok: false, error: "No response body", code: "FETCH_ERROR" };
    }

    const decoder = new TextDecoder();
    let html = "";
    let totalSize = 0;
    let metadataSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.length;

      if (!readMetadataOnly && totalSize > MAX_RESPONSE_SIZE) {
        // Response is bigger than allowed; stop reading and parse what we already captured.
        await reader.cancel();
        break;
      }

      if (readMetadataOnly) {
        const remaining = METADATA_READ_LIMIT - metadataSize;
        if (remaining <= 0) {
          await reader.cancel();
          break;
        }

        const chunkToDecode = value.length > remaining ? value.subarray(0, remaining) : value;
        html += decoder.decode(chunkToDecode, { stream: true });
        metadataSize += chunkToDecode.length;

        // Most metadata lives in <head>; stop early once we have it.
        if (metadataSize >= METADATA_READ_LIMIT || /<\/head>/i.test(html)) {
          await reader.cancel();
          break;
        }
      } else {
        html += decoder.decode(value, { stream: true });
      }
    }

    html += decoder.decode();

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

function isAmazonDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return (
    normalized === "amazon.com" ||
    normalized === "amazon.ca" ||
    normalized.endsWith(".amazon.com") ||
    normalized.endsWith(".amazon.ca")
  );
}

function decodeEscapedScriptString(value: string): string {
  return value
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function isLikelyImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://")
  ) && (
    lower.includes("m.media-amazon.com/images/") ||
    /\.(jpg|jpeg|png|webp)(?:$|\?)/.test(lower)
  );
}

function extractAmount(value: string): number | null {
  const compact = value.replace(/\s+/g, "");
  const numeric = compact.replace(/[^0-9.,]/g, "");
  if (!numeric) return null;

  let normalized = numeric;
  const lastDot = normalized.lastIndexOf(".");
  const lastComma = normalized.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastDot > lastComma) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
  } else if (lastComma !== -1 && lastDot === -1) {
    const decimalDigits = normalized.length - lastComma - 1;
    normalized = decimalDigits === 2 ? normalized.replace(",", ".") : normalized.replace(/,/g, "");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return null;
  }
  return amount;
}

function looksLikePriceRange(value: string): boolean {
  const normalized = value.replace(/\s+/g, " ").trim();
  return /\d\s*[-–—]\s*[$€£]?\s*\d/.test(normalized);
}

function inferCurrency(value: string, fallbackCurrency: string): string {
  const upper = value.toUpperCase();
  if (upper.includes("CAD") || upper.includes("CDN$") || upper.includes("CA$") || upper.includes("C$")) {
    return "CAD";
  }
  if (upper.includes("USD") || upper.includes("US$")) {
    return "USD";
  }
  if (upper.includes("EUR") || upper.includes("€")) {
    return "EUR";
  }
  if (upper.includes("GBP") || upper.includes("£")) {
    return "GBP";
  }
  return fallbackCurrency;
}

function extractAmazonFallbackData(
  html: string,
  finalUrl: string
): Pick<LinkPreviewData, "image" | "images" | "price"> {
  const domain = extractDomain(finalUrl);
  const fallbackCurrency = domain.endsWith(".ca") ? "CAD" : "USD";

  const imageCandidates = new Set<string>();
  const imagePatterns = [
    /"(?:hiRes|large|mainUrl|variantHiRes|thumbUrl|imageUrl)"\s*:\s*"([^"]+)"/gi,
    /(https?:\\\/\\\/m\.media-amazon\.com\\\/images\\\/I\\\/[^"'\\\s]+)/gi,
    /(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s<]+)/gi,
  ];

  for (const pattern of imagePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const decoded = decodeEscapedScriptString(match[1]);
      if (isLikelyImageUrl(decoded)) {
        imageCandidates.add(decoded);
      }
    }
  }

  let bestPrice: { amount: number; currency: string } | null = null;
  const structuredPricePatterns: Array<{ pattern: RegExp; amountIndex: number; currencyIndex?: number }> = [
    {
      pattern: /"priceToPay"\s*:\s*\{[\s\S]{0,180}?"amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)[\s\S]{0,180}?"currencyCode"\s*:\s*"([A-Z]{3})"/gi,
      amountIndex: 1,
      currencyIndex: 2,
    },
    {
      pattern: /"priceAmount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/gi,
      amountIndex: 1,
    },
    {
      pattern: /"displayPrice"\s*:\s*"([^"]+)"/gi,
      amountIndex: 1,
    },
  ];

  for (const { pattern, amountIndex, currencyIndex } of structuredPricePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const rawAmount = decodeEscapedScriptString(match[amountIndex] ?? "");
      if (!currencyIndex && looksLikePriceRange(rawAmount)) {
        continue;
      }
      const amount = extractAmount(rawAmount);
      if (!amount) continue;

      const rawCurrency = currencyIndex ? decodeEscapedScriptString(match[currencyIndex] ?? "") : rawAmount;
      const currency = inferCurrency(rawCurrency, fallbackCurrency);
      bestPrice = { amount, currency };
      break;
    }
    if (bestPrice) break;
  }

  if (!bestPrice) {
    const visiblePricePattern =
      /<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>([^<]+)<\/span>/gi;
    let match: RegExpExecArray | null;
    while ((match = visiblePricePattern.exec(html)) !== null) {
      const rawText = decodeEscapedScriptString(match[1] ?? "").trim();
      const amount = extractAmount(rawText);
      if (!amount) continue;

      bestPrice = {
        amount,
        currency: inferCurrency(rawText, fallbackCurrency),
      };
      break;
    }
  }

  const images = Array.from(imageCandidates).slice(0, 6);
  return {
    image: images[0] ?? null,
    images,
    price: bestPrice,
  };
}

function mergeWithAmazonFallback(
  baseData: LinkPreviewData,
  fallbackData: Pick<LinkPreviewData, "image" | "images" | "price">
): LinkPreviewData {
  const mergedImages = [...baseData.images];
  for (const image of fallbackData.images) {
    if (!mergedImages.includes(image)) {
      mergedImages.push(image);
    }
  }

  const image = baseData.image ?? fallbackData.image ?? mergedImages[0] ?? null;
  return {
    ...baseData,
    image,
    images: mergedImages,
    price: baseData.price ?? fallbackData.price ?? null,
  };
}

/**
 * Parse HTML and extract metadata
 */
export function parseHtml(html: string, finalUrl: string): LinkPreviewData {
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
  const startedAt = Date.now();
  let metricDomain: string | null = null;
  const logPreviewMetric = (
    status: LinkPreviewMetricStatus,
    options: {
      source?: LinkPreviewSource;
      cached?: boolean;
      domain?: string | null;
      reason?: string;
      errorCode?: string;
    } = {}
  ): void => {
    console.info(
      "[link-preview][metric]",
      JSON.stringify({
        status,
        source: options.source ?? "none",
        cached: options.cached ?? false,
        domain: options.domain ?? metricDomain,
        reason: options.reason ?? null,
        error_code: options.errorCode ?? null,
        duration_ms: Date.now() - startedAt,
      })
    );
  };
  const logMerchantFailure = (
    errorCode: ErrorCode,
    rawReason: string,
    phase: "fetch" | "parse"
  ): void => {
    const domainForLog = metricDomain ?? "unknown";
    const failureLog = buildMerchantFailureLog({
      domain: domainForLog,
      errorCode,
      rawReason,
    });

    console.warn(
      "[link-preview][merchant-failure]",
      JSON.stringify({
        phase,
        domain: domainForLog,
        error_code: errorCode,
        raw_reason: rawReason,
        merchant: failureLog.merchant,
        behavior_class: failureLog.behaviorClass,
        sample_url: failureLog.sampleUrl,
        fetch_result: failureLog.fetchResult,
        parser_result: failureLog.parserResult,
        failure_reason: failureLog.failureReason,
        fallback_requirement: failureLog.fallbackRequirement,
      })
    );
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logPreviewMetric("unauthorized", { errorCode: "PREVIEW_UNAVAILABLE" });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PREVIEW_UNAVAILABLE",
          message: "Please sign in to fetch link previews.",
        },
      },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(json);

  if (!parsed.success) {
    logPreviewMetric("invalid_request", { errorCode: "INVALID_URL" });
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: "Invalid request" } },
      { status: 400 }
    );
  }

  const { url: rawUrl, force } = parsed.data;

  // Validate URL format and SSRF
  const ssrfCheck = validateUrlForSsrf(rawUrl);
  if (!ssrfCheck.ok) {
    logPreviewMetric("invalid_url", { errorCode: "INVALID_URL", reason: ssrfCheck.error });
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: ssrfCheck.error } },
      { status: 400 }
    );
  }

  // Parse Amazon links early so we can use canonical /dp/{ASIN} URLs for cache keys.
  let amazonProduct = parseAmazonProductUrl(rawUrl);

  // Normalize URL
  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(amazonProduct?.canonicalUrl ?? rawUrl);
  } catch {
    logPreviewMetric("invalid_url", { errorCode: "INVALID_URL", reason: "normalize_failed" });
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_URL" as const, message: "Could not normalize URL" } },
      { status: 400 }
    );
  }

  let domain = extractDomain(normalizedUrl);
  metricDomain = domain;
  let amazonPaapiData: LinkPreviewData | null = null;
  const clientKey = getRateLimitClientKey(req.headers, user.id);

  // Check cache
  const cached = await getCachedPreview(normalizedUrl, force);
  if (cached) {
    logPreviewMetric("success", { source: "cache", cached: true });
    return NextResponse.json({
      ok: true,
      normalizedUrl,
      domain,
      cached: true,
      data: cached,
    });
  }

  const missRateLimitResponse = await applyMissRateLimit();
  if (missRateLimitResponse) {
    return missRateLimitResponse;
  }

  async function applyMissRateLimit(): Promise<NextResponse<LinkPreviewResponse> | null> {
    try {
      const routeLimit = await takeRateLimit({
        scope: "link-preview",
        key: clientKey,
        maxRequests: LINK_PREVIEW_MAX_MISSES_PER_IP,
        windowSeconds: LINK_PREVIEW_WINDOW_SECONDS,
      });

      if (!routeLimit.allowed) {
        logPreviewMetric("rate_limited", {
          errorCode: "RATE_LIMITED",
          reason: "route_limit",
        });
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many preview requests. Please wait a few minutes and try again.",
            },
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(routeLimit.retryAfterSeconds),
            },
          }
        );
      }

      const domainLimit = await takeRateLimit({
        scope: "link-preview-domain",
        key: `${clientKey}|domain:${domain}`,
        maxRequests: LINK_PREVIEW_MAX_MISSES_PER_IP_DOMAIN,
        windowSeconds: LINK_PREVIEW_WINDOW_SECONDS,
      });

      if (!domainLimit.allowed) {
        logPreviewMetric("rate_limited", {
          errorCode: "RATE_LIMITED",
          reason: "domain_limit",
        });
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many preview requests. Please wait a few minutes and try again.",
            },
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(domainLimit.retryAfterSeconds),
            },
          }
        );
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        // Link previews are a best-effort feature. If rate-limit infrastructure is
        // temporarily unavailable, continue fetching metadata instead of turning
        // every preview request into a hard outage.
        console.warn("[link-preview] Continuing without rate limit:", error.message);
        return null;
      }

      throw error;
    }

    return null;
  }

  // Amazon pages frequently block generic metadata fetches. Use PA-API first when possible.
  if (amazonProduct) {
    const amazonPreview = await fetchAmazonPreview(amazonProduct);
    if (amazonPreview.ok) {
      const amazonData: LinkPreviewData = {
        ...amazonPreview.data,
        favicon: getFaviconWithFallback(null, domain),
      };

      if (amazonData.title || amazonData.description || amazonData.image || amazonData.price) {
        amazonPaapiData = amazonData;

        // If PA-API already has the key preview fields, return early.
        if (amazonData.image && amazonData.price) {
          await cachePreview(normalizedUrl, amazonData, "ok", 200);
          logPreviewMetric("success", { source: "paapi" });

          return NextResponse.json({
            ok: true,
            normalizedUrl,
            domain,
            cached: false,
            data: amazonData,
          });
        }
      }
    }
  }

  // Fetch and parse
  const fetchResult = await safeFetch(normalizedUrl);
  
  if (!fetchResult.ok) {
    if (amazonPaapiData) {
      await cachePreview(normalizedUrl, amazonPaapiData, "ok", 200);
      logPreviewMetric("success", { source: "paapi_fallback" });

      return NextResponse.json({
        ok: true,
        normalizedUrl,
        domain,
        cached: false,
        data: amazonPaapiData,
      });
    }

    // Cache the error
    await cachePreview(
      normalizedUrl,
      { title: null, description: null, image: null, images: [], price: null, favicon: null },
      "error",
      undefined,
      fetchResult.code
    );
    logPreviewMetric("error", {
      source: "none",
      reason: fetchResult.error,
      errorCode: fetchResult.code,
    });
    logMerchantFailure(fetchResult.code, fetchResult.error, "fetch");

    return NextResponse.json(
      { ok: false, error: { code: fetchResult.code, message: fetchResult.error } },
      { status: 422 }
    );
  }

  const redirectedAmazonProduct = amazonProduct ?? parseAmazonProductUrl(fetchResult.finalUrl);
  if (!amazonProduct && redirectedAmazonProduct) {
    amazonProduct = redirectedAmazonProduct;
    normalizedUrl = normalizeUrl(amazonProduct.canonicalUrl);
    domain = extractDomain(normalizedUrl);
    metricDomain = domain;

    const canonicalCached = await getCachedPreview(normalizedUrl, force);
    if (canonicalCached) {
      logPreviewMetric("success", { source: "cache", cached: true, reason: "canonicalized" });
      return NextResponse.json({
        ok: true,
        normalizedUrl,
        domain,
        cached: true,
        data: canonicalCached,
      });
    }
  }

  if (amazonProduct && !amazonPaapiData) {
    const amazonPreview = await fetchAmazonPreview(amazonProduct);
    if (amazonPreview.ok) {
      const amazonData: LinkPreviewData = {
        ...amazonPreview.data,
        favicon: getFaviconWithFallback(null, domain),
      };

      if (amazonData.title || amazonData.description || amazonData.image || amazonData.price) {
        amazonPaapiData = amazonData;
      }
    }
  }

  let data = parseHtml(fetchResult.html, fetchResult.finalUrl);

  if (amazonProduct && isAmazonDomain(extractDomain(fetchResult.finalUrl))) {
    if (!data.image || !data.price) {
      const amazonFallback = extractAmazonFallbackData(fetchResult.html, fetchResult.finalUrl);
      data = mergeWithAmazonFallback(data, amazonFallback);
    }

    if (amazonPaapiData) {
      const mergedImages = [...amazonPaapiData.images];
      for (const image of data.images) {
        if (!mergedImages.includes(image)) {
          mergedImages.push(image);
        }
      }

      data = {
        ...data,
        title: amazonPaapiData.title ?? data.title,
        description: amazonPaapiData.description ?? data.description,
        image: amazonPaapiData.image ?? data.image ?? mergedImages[0] ?? null,
        images: mergedImages,
        price: amazonPaapiData.price ?? data.price,
        favicon: amazonPaapiData.favicon ?? data.favicon,
      };
    }
  }

  // Check if we got any useful metadata
  if (!data.title && !data.description && !data.image && !data.price) {
    await cachePreview(normalizedUrl, data, "error", 200, "NO_METADATA");
    logPreviewMetric("error", { source: "html", errorCode: "NO_METADATA" });
    logMerchantFailure("NO_METADATA", "No metadata found on page", "parse");
    
    return NextResponse.json(
      { ok: false, error: { code: "NO_METADATA" as const, message: "No metadata found on page" } },
      { status: 422 }
    );
  }

  // Cache success
  await cachePreview(normalizedUrl, data, "ok", 200);
  logPreviewMetric("success", {
    source: amazonPaapiData ? "html_plus_paapi" : "html",
  });

  return NextResponse.json({
    ok: true,
    normalizedUrl,
    domain,
    cached: false,
    data,
  });
}

