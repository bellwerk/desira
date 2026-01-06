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

  // Build Skimlinks redirect URL
  const params = new URLSearchParams({
    id: SKIMLINKS_PUBLISHER_ID,
    url: originalUrl,
    sref: process.env.NEXT_PUBLIC_APP_URL ?? "https://desira.io",
  });

  // Add custom tracking if provided
  if (xcust) {
    params.set("xcust", xcust);
  }

  return `${SKIMLINKS_REDIRECT_BASE}?${params.toString()}`;
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


