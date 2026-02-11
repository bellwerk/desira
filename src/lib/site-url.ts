/**
 * Production-safe site URL for OAuth/email redirects.
 * In production: requires NEXT_PUBLIC_SITE_URL to be a valid https/http URL (no localhost).
 * In dev: allows localhost fallback.
 */
export function getSiteURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const isProd = process.env.NODE_ENV === "production";

  function normalize(url: string): string {
    return url.replace(/\/$/, "");
  }

  if (isProd) {
    if (!envUrl) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be set to the production URL (e.g. https://app.desira.gift) in production."
      );
    }
    if (envUrl.includes("localhost")) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be set to the production URL (e.g. https://app.desira.gift) in production."
      );
    }
    if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must include protocol (https://...)"
      );
    }
    return normalize(envUrl);
  }

  // Non-production
  if (envUrl) {
    return normalize(envUrl);
  }
  if (typeof window !== "undefined") {
    return normalize(window.location.origin);
  }
  return "http://localhost:3000";
}
