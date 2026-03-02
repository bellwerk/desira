/**
 * Affiliate link utilities for Skimlinks integration
 *
 * Skimlinks automatically monetizes outbound product links by wrapping them
 * through their redirect service. This module provides helpers to generate
 * affiliate-wrapped URLs.
 *
 * @see https://skimlinks.com
 */

/**
 * Skimlinks Publisher ID from environment
 * Required for affiliate link monetization
 */
const SKIMLINKS_PUBLISHER_ID = process.env.SKIMLINKS_PUBLISHER_ID ?? "";

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
  // If Skimlinks is not configured, return original URL
  if (!isSkimlinksEnabled()) {
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


