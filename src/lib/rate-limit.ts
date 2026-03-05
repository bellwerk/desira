import { createHash } from "crypto";

import { tryGetSupabaseAdmin } from "@/lib/supabase/admin";

const IP_HEADER_CANDIDATES = [
  "cf-connecting-ip",
  "x-vercel-forwarded-for",
  "true-client-ip",
] as const;
const TRUST_PROXY_IP_HEADERS = process.env.TRUST_PROXY_IP_HEADERS === "true";

interface TakeRateLimitOptions {
  scope: string;
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
}

export class RateLimitUnavailableError extends Error {
  readonly shouldBypass: boolean;

  constructor(message: string, options?: { shouldBypass?: boolean }) {
    super(message);
    this.name = "RateLimitUnavailableError";
    this.shouldBypass = options?.shouldBypass ?? false;
  }
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}

function firstForwardedIp(value: string): string {
  return value.split(",")[0]?.trim() ?? "";
}

export function getClientIp(headers: Headers): string | null {
  // These headers are only safe when an upstream proxy strips/sets them.
  if (!TRUST_PROXY_IP_HEADERS) {
    return null;
  }

  for (const headerName of IP_HEADER_CANDIDATES) {
    const value = headers.get(headerName);
    if (!value) {
      continue;
    }

    const candidate = firstForwardedIp(value);

    if (candidate) {
      return normalizeIp(candidate);
    }
  }

  return null;
}

export function getRateLimitClientKey(headers: Headers, trustedSubject?: string | null): string {
  const normalizedSubject = trustedSubject?.trim();
  if (normalizedSubject) {
    return `user:${normalizedSubject}`;
  }

  const ip = getClientIp(headers);

  if (ip) {
    return `ip:${ip}`;
  }

  // Fallback to a coarse fingerprint so we avoid global throttling when
  // trusted proxy IP headers are unavailable.
  const userAgent = headers.get("user-agent")?.trim().slice(0, 200) ?? "unknown";
  const acceptLanguage = headers.get("accept-language")?.trim().slice(0, 120) ?? "unknown";
  return `ua:${hashKey(`${userAgent}|${acceptLanguage}`).slice(0, 24)}`;
}

export async function takeRateLimit({
  scope,
  key,
  maxRequests,
  windowSeconds,
}: TakeRateLimitOptions): Promise<RateLimitDecision> {
  const supabase = tryGetSupabaseAdmin();
  if (!supabase) {
    throw new RateLimitUnavailableError(`Rate limit client unavailable for ${scope}`, {
      shouldBypass: true,
    });
  }

  const { data, error } = await supabase.rpc("take_rate_limit", {
    p_scope: scope,
    p_key_hash: hashKey(key),
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    const shouldBypass =
      /take_rate_limit/i.test(error.message) &&
      /(could not find|does not exist|not found)/i.test(error.message);

    throw new RateLimitUnavailableError(`Rate limit RPC failed for ${scope}: ${error.message}`, {
      shouldBypass,
    });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new RateLimitUnavailableError(`Rate limit RPC returned no result for ${scope}`);
  }

  return {
    allowed: Boolean(row.allowed),
    remaining: Number(row.remaining ?? 0),
    resetAt: String(row.reset_at),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
  };
}
