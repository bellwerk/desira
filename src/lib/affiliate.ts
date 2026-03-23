/**
 * Affiliate link utilities.
 *
 * Strategy:
 * - Amazon links: direct Amazon Associates tag (Option B)
 * - Non-Amazon links: Skimlinks redirect wrapping
 */

/**
 * Skimlinks Publisher ID from environment
 * Required for affiliate link monetization
 */
import {
  canonicalizeAmazonRetailUrl,
  isAmazonRetailUrl,
} from "@/lib/amazon-url";

let hasWarnedMissingAmazonAssociatesConfig = false;

/**
 * Skimlinks redirect base URL
 */
const SKIMLINKS_REDIRECT_BASE = "https://go.redirectingat.com/";
const WRAPPED_URL_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const WRAPPED_URL_CACHE_MAX_ENTRIES = 500;

type WrappedUrlCacheEntry = {
  wrappedBaseUrl: string;
  expiresAtMs: number;
};

const wrappedUrlCache = new Map<string, WrappedUrlCacheEntry>();

export type AffiliateProvider = "none" | "skimlinks" | "amazon_associates";

function getSkimlinksPublisherId(): string {
  return process.env.SKIMLINKS_PUBLISHER_ID?.trim() ?? "";
}

function getAmazonAssociatesTag(): string {
  return (
    process.env.AMAZON_ASSOCIATES_TAG?.trim() ??
    process.env.AMAZON_PAAPI_PARTNER_TAG?.trim() ??
    ""
  );
}

function getSkimlinksSref(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://desira.io";
}

function pruneWrappedUrlCache(nowMs: number): void {
  for (const [key, entry] of wrappedUrlCache) {
    if (entry.expiresAtMs <= nowMs) {
      wrappedUrlCache.delete(key);
    }
  }

  while (wrappedUrlCache.size > WRAPPED_URL_CACHE_MAX_ENTRIES) {
    const oldestKey = wrappedUrlCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    wrappedUrlCache.delete(oldestKey);
  }
}

function buildBaseAffiliateUrl(originalUrl: string): string {
  const params = new URLSearchParams({
    id: getSkimlinksPublisherId(),
    url: originalUrl,
    sref: getSkimlinksSref(),
  });

  return `${SKIMLINKS_REDIRECT_BASE}?${params.toString()}`;
}

export function canonicalizeProductUrlForStorage(originalUrl: string): string {
  return canonicalizeAmazonRetailUrl(originalUrl) ?? originalUrl;
}

export function resolveProductUrlForStorage(
  rawProductUrl?: string | null,
  normalizedProductUrl?: string | null
): string | null {
  const preferredUrl = normalizedProductUrl?.trim() || rawProductUrl?.trim() || "";
  if (!preferredUrl) {
    return null;
  }

  return canonicalizeProductUrlForStorage(preferredUrl);
}

function buildAmazonAssociatesUrl(originalUrl: string): string {
  const associatesTag = getAmazonAssociatesTag();
  if (!associatesTag) {
    return originalUrl;
  }

  try {
    const canonicalUrl = canonicalizeProductUrlForStorage(originalUrl);
    const parsed = new URL(canonicalUrl);
    if (!isAmazonRetailUrl(parsed.toString())) {
      return originalUrl;
    }

    parsed.searchParams.set("tag", associatesTag);
    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

function getCachedBaseAffiliateUrl(originalUrl: string): string {
  const nowMs = Date.now();
  const cached = wrappedUrlCache.get(originalUrl);

  if (cached && cached.expiresAtMs > nowMs) {
    return cached.wrappedBaseUrl;
  }

  const wrappedBaseUrl = buildBaseAffiliateUrl(originalUrl);
  wrappedUrlCache.set(originalUrl, {
    wrappedBaseUrl,
    expiresAtMs: nowMs + WRAPPED_URL_CACHE_TTL_MS,
  });
  pruneWrappedUrlCache(nowMs);
  return wrappedBaseUrl;
}

/**
 * Check if Skimlinks integration is enabled
 */
export function isSkimlinksEnabled(): boolean {
  return getSkimlinksPublisherId().length > 0;
}

export function isAmazonAssociatesEnabled(): boolean {
  return getAmazonAssociatesTag().length > 0;
}

export function getAffiliateProvider(originalUrl: string): AffiliateProvider {
  if (isAmazonRetailUrl(originalUrl)) {
    return isAmazonAssociatesEnabled() ? "amazon_associates" : "none";
  }
  if (isSkimlinksEnabled()) {
    return "skimlinks";
  }
  return "none";
}

/**
 * Generate a Skimlinks affiliate URL
 *
 * @param originalUrl - The original product URL to wrap
 * @param xcust - Custom tracking parameter (e.g., "itemId:listToken")
 * @returns The Skimlinks-wrapped URL, or original URL if Skimlinks is not configured
 */
export function generateAffiliateUrl(
  originalUrl: string,
  xcust?: string
): string {
  const canonicalUrl = canonicalizeProductUrlForStorage(originalUrl);
  const provider = getAffiliateProvider(originalUrl);

  if (provider === "amazon_associates") {
    return buildAmazonAssociatesUrl(canonicalUrl);
  }

  // If no provider is configured, pass through original URL.
  if (provider === "none") {
    return canonicalUrl;
  }

  // Validate URL
  try {
    new URL(canonicalUrl);
  } catch {
    return canonicalUrl;
  }

  const wrappedBaseUrl = getCachedBaseAffiliateUrl(canonicalUrl);
  if (!xcust) {
    return wrappedBaseUrl;
  }

  // Keep xcust per-click so item-level tracking remains accurate.
  const wrappedUrl = new URL(wrappedBaseUrl);
  wrappedUrl.searchParams.set("xcust", xcust);
  return wrappedUrl.toString();
}

/**
 * Build internal redirect path for an item
 * This route handles affiliate wrapping server-side and logs clicks
 *
 * @param itemId - The item ID
 * @returns The internal redirect path (e.g., "/api/go/abc123")
 */
export function getItemRedirectPath(itemId: string): string {
  return `/api/go/${itemId}`;
}

export function warnIfAmazonAffiliateConfigMissing(originalUrl: string): void {
  if (
    hasWarnedMissingAmazonAssociatesConfig ||
    !isAmazonRetailUrl(originalUrl) ||
    isAmazonAssociatesEnabled()
  ) {
    return;
  }

  hasWarnedMissingAmazonAssociatesConfig = true;
  console.warn(
    "[affiliate] Amazon retail URL detected but AMAZON_ASSOCIATES_TAG/AMAZON_PAAPI_PARTNER_TAG is not configured. Amazon clicks will pass through without attribution."
  );
}
