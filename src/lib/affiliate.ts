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
const SKIMLINKS_PUBLISHER_ID = process.env.SKIMLINKS_PUBLISHER_ID ?? "";
const AMAZON_ASSOCIATES_TAG =
  process.env.AMAZON_ASSOCIATES_TAG ??
  process.env.AMAZON_PAAPI_PARTNER_TAG ??
  "";

/**
 * Skimlinks redirect base URL
 */
const SKIMLINKS_REDIRECT_BASE = "https://go.redirectingat.com/";
const SKIMLINKS_SREF = process.env.NEXT_PUBLIC_APP_URL ?? "https://desira.io";
const WRAPPED_URL_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const WRAPPED_URL_CACHE_MAX_ENTRIES = 500;

type WrappedUrlCacheEntry = {
  wrappedBaseUrl: string;
  expiresAtMs: number;
};

const wrappedUrlCache = new Map<string, WrappedUrlCacheEntry>();

export type AffiliateProvider = "none" | "skimlinks" | "amazon_associates";

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
    id: SKIMLINKS_PUBLISHER_ID,
    url: originalUrl,
    sref: SKIMLINKS_SREF,
  });

  return `${SKIMLINKS_REDIRECT_BASE}?${params.toString()}`;
}

function getAmazonBaseDomain(hostname: string): "amazon.com" | "amazon.ca" | null {
  const normalized = hostname.toLowerCase();
  if (normalized === "amazon.com" || normalized.endsWith(".amazon.com")) {
    return "amazon.com";
  }
  if (normalized === "amazon.ca" || normalized.endsWith(".amazon.ca")) {
    return "amazon.ca";
  }
  return null;
}

function isAmazonMerchantUrl(originalUrl: string): boolean {
  try {
    const parsed = new URL(originalUrl);
    return getAmazonBaseDomain(parsed.hostname) !== null;
  } catch {
    return false;
  }
}

function buildAmazonAssociatesUrl(originalUrl: string): string {
  if (!isAmazonAssociatesEnabled()) {
    return originalUrl;
  }

  try {
    const parsed = new URL(originalUrl);
    if (!getAmazonBaseDomain(parsed.hostname)) {
      return originalUrl;
    }

    parsed.searchParams.set("tag", AMAZON_ASSOCIATES_TAG);
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
  return SKIMLINKS_PUBLISHER_ID.length > 0;
}

export function isAmazonAssociatesEnabled(): boolean {
  return AMAZON_ASSOCIATES_TAG.length > 0;
}

export function getAffiliateProvider(originalUrl: string): AffiliateProvider {
  if (isAmazonMerchantUrl(originalUrl) && isAmazonAssociatesEnabled()) {
    return "amazon_associates";
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
  const provider = getAffiliateProvider(originalUrl);

  if (provider === "amazon_associates") {
    return buildAmazonAssociatesUrl(originalUrl);
  }

  // If no provider is configured, pass through original URL.
  if (provider === "none") {
    return originalUrl;
  }

  // Validate URL
  try {
    new URL(originalUrl);
  } catch {
    return originalUrl;
  }

  const wrappedBaseUrl = getCachedBaseAffiliateUrl(originalUrl);
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


