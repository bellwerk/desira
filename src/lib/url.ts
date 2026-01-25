/**
 * URL utilities for link preview feature (M3)
 * - URL normalization (strip tracking params)
 * - SSRF protection (block private IPs, localhost)
 * - Domain extraction
 */

// Tracking parameters to strip during normalization
const TRACKING_PARAMS = new Set([
  // UTM parameters
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  // Facebook
  "fbclid",
  "fb_action_ids",
  "fb_action_types",
  "fb_source",
  "fb_ref",
  // Google
  "gclid",
  "gclsrc",
  "dclid",
  // Microsoft/Bing
  "msclkid",
  // Twitter
  "twclid",
  // Pinterest
  "epik",
  // Mailchimp
  "mc_cid",
  "mc_eid",
  // HubSpot
  "hsa_acc",
  "hsa_cam",
  "hsa_grp",
  "hsa_ad",
  "hsa_src",
  "hsa_tgt",
  "hsa_kw",
  "hsa_mt",
  "hsa_net",
  "hsa_ver",
  // Other common tracking
  "ref",
  "affiliate_id",
  "campaign_id",
  "source",
  "_ga",
  "_gl",
  "spm",
  "scm",
  "clickid",
  "trk",
  "zanpid",
]);

/**
 * Normalize a URL by:
 * - Converting to lowercase hostname
 * - Removing tracking parameters
 * - Removing trailing slashes
 * - Removing default ports
 * - Sorting remaining query params for consistency
 */
export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Only allow http/https
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports
    if (
      (url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")
    ) {
      url.port = "";
    }

    // Remove tracking parameters
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        params.append(key, value);
      }
    }

    // Sort remaining params for consistency
    params.sort();
    url.search = params.toString();

    // Remove trailing slash from pathname (except root)
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // Remove hash/fragment
    url.hash = "";

    return url.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}

/**
 * Extract the display domain from a URL (e.g., "amazon.com")
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Remove www. prefix for cleaner display
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Private/reserved IP ranges that must be blocked for SSRF protection
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^127\./,                           // Loopback
  /^10\./,                            // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Class B private
  /^192\.168\./,                      // Class C private
  /^169\.254\./,                      // Link-local
  /^0\./,                             // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9]|127)\./, // Carrier-grade NAT
  /^192\.0\.0\./,                     // IETF Protocol Assignments
  /^192\.0\.2\./,                     // Documentation (TEST-NET-1)
  /^198\.51\.100\./,                  // Documentation (TEST-NET-2)
  /^203\.0\.113\./,                   // Documentation (TEST-NET-3)
  /^192\.88\.99\./,                   // IPv6 to IPv4 relay
  /^198\.1[8-9]\./,                   // Benchmark testing
  /^224\./,                           // Multicast
  /^240\./,                           // Reserved (future use)
  /^255\.255\.255\.255$/,             // Broadcast
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "local",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "[::]",
  "ip6-localhost",
  "ip6-loopback",
]);

/**
 * Check if an IP address is private/reserved
 */
export function isPrivateIp(ip: string): boolean {
  // IPv6 localhost
  if (ip === "::1" || ip === "::") {
    return true;
  }

  // IPv6 private ranges (simplified check)
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }

  // Check IPv4 ranges
  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a hostname is blocked for SSRF protection
 */
export function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.has(lower)) {
    return true;
  }

  // Check if it looks like an IP and is private
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return isPrivateIp(lower);
  }

  // Check for IPv6 literals
  if (lower.startsWith("[") && lower.endsWith("]")) {
    const ipv6 = lower.slice(1, -1);
    return isPrivateIp(ipv6);
  }

  return false;
}

export type SsrfValidationResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

/**
 * Validate a URL for SSRF protection
 * - Must be http/https
 * - Must not be localhost or private IP
 */
export function validateUrlForSsrf(urlString: string): SsrfValidationResult {
  try {
    const url = new URL(urlString);

    // Only allow http/https
    if (!["http:", "https:"].includes(url.protocol)) {
      return { ok: false, error: "Only HTTP/HTTPS URLs are allowed" };
    }

    // Check for blocked hostnames
    if (isBlockedHostname(url.hostname)) {
      return { ok: false, error: "URL points to a blocked address" };
    }

    return { ok: true, url };
  } catch {
    return { ok: false, error: "Invalid URL format" };
  }
}

/**
 * Validate resolved IP address(es) for SSRF protection
 * Call this after DNS resolution before making the actual request
 */
export function validateResolvedIps(ips: string[]): { ok: true } | { ok: false; error: string } {
  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      return { ok: false, error: "URL resolves to a private IP address" };
    }
  }
  return { ok: true };
}

