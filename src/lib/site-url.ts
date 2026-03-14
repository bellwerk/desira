import { headers } from "next/headers";

/**
 * Production-safe site URL for OAuth/email redirects.
 * Hosted production still requires a real public origin.
 * Local production smoke tests may fall back to the loopback request origin.
 */
export async function getSiteURL(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProd = process.env.NODE_ENV === "production";

  function normalize(url: string): string {
    return url.replace(/\/$/, "");
  }

  function isHttpUrl(url: string): boolean {
    return url.startsWith("http://") || url.startsWith("https://");
  }

  function isLoopbackHost(hostname: string): boolean {
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  }

  function isLoopbackUrl(url: string): boolean {
    try {
      return isLoopbackHost(new URL(url).hostname);
    } catch {
      return false;
    }
  }

  async function getRequestOrigin(): Promise<string | null> {
    try {
      const requestHeaders = await headers();
      const origin = requestHeaders.get("origin");
      if (origin && isHttpUrl(origin)) {
        return normalize(origin);
      }

      const forwardedHost =
        requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
      if (!forwardedHost) {
        return null;
      }

      const host = forwardedHost.split(",")[0]?.trim();
      if (!host) {
        return null;
      }

      const protoHeader = requestHeaders.get("x-forwarded-proto");
      const proto =
        protoHeader?.split(",")[0]?.trim() ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");

      return normalize(`${proto}://${host}`);
    } catch {
      return null;
    }
  }

  if (envUrl) {
    if (!isHttpUrl(envUrl)) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must include protocol (https://...)"
      );
    }

    if (!isProd || !isLoopbackUrl(envUrl)) {
      return normalize(envUrl);
    }
  }

  const requestOrigin = await getRequestOrigin();

  if (isProd) {
    if (requestOrigin && isLoopbackUrl(requestOrigin)) {
      return requestOrigin;
    }

    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set to the production URL (e.g. https://app.desira.gift) in production."
    );
  }

  if (requestOrigin) {
    return requestOrigin;
  }

  return "http://localhost:3000";
}
