import { createHash } from "crypto";

import { tryGetSupabaseAdmin } from "@/lib/supabase/admin";

const IP_HEADER_CANDIDATES = [
  "cf-connecting-ip",
  "x-vercel-forwarded-for",
  "true-client-ip",
] as const;
const TRUST_PROXY_IP_HEADERS = process.env.TRUST_PROXY_IP_HEADERS === "true";
const ALLOW_LOCAL_RATE_LIMIT_FALLBACK =
  process.env.ALLOW_LOCAL_RATE_LIMIT_FALLBACK === "true" ||
  process.env.NODE_ENV !== "production";

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

type LocalRateLimitBucket = {
  requestCount: number;
  resetAtMs: number;
};

const localRateLimitBuckets = new Map<string, LocalRateLimitBucket>();

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function takeLocalRateLimit({
  scope,
  key,
  maxRequests,
  windowSeconds,
}: TakeRateLimitOptions): RateLimitDecision {
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const resetAtMs = windowStartMs + windowMs;
  const bucketKey = `${scope}:${hashKey(key)}:${windowStartMs}`;

  for (const [existingKey, bucket] of localRateLimitBuckets) {
    if (bucket.resetAtMs <= nowMs) {
      localRateLimitBuckets.delete(existingKey);
    }
  }

  const bucket = localRateLimitBuckets.get(bucketKey);
  if (!bucket) {
    localRateLimitBuckets.set(bucketKey, {
      requestCount: 1,
      resetAtMs,
    });

    return {
      allowed: true,
      remaining: Math.max(maxRequests - 1, 0),
      resetAt: new Date(resetAtMs).toISOString(),
      retryAfterSeconds: 0,
    };
  }

  if (bucket.requestCount >= maxRequests) {
    const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAtMs - nowMs) / 1000), 1);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(bucket.resetAtMs).toISOString(),
      retryAfterSeconds,
    };
  }

  bucket.requestCount += 1;
  localRateLimitBuckets.set(bucketKey, bucket);
  return {
    allowed: true,
    remaining: Math.max(maxRequests - bucket.requestCount, 0),
    resetAt: new Date(bucket.resetAtMs).toISOString(),
    retryAfterSeconds: 0,
  };
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
    if (ALLOW_LOCAL_RATE_LIMIT_FALLBACK) {
      return takeLocalRateLimit({ scope, key, maxRequests, windowSeconds });
    }
    throw new RateLimitUnavailableError(`Rate limit client unavailable for ${scope}`, {
      shouldBypass: false,
    });
  }

  const keyHash = hashKey(key);
  const { data, error } = await supabase.rpc("take_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    const shouldFallback =
      /take_rate_limit/i.test(error.message) &&
      /(could not find|does not exist|not found)/i.test(error.message);

    if (shouldFallback) {
      if (ALLOW_LOCAL_RATE_LIMIT_FALLBACK) {
        return takeLocalRateLimit({ scope, key, maxRequests, windowSeconds });
      }
      throw new RateLimitUnavailableError(
        `Rate limit RPC unavailable for ${scope}: ${error.message}`,
        { shouldBypass: false }
      );
    }

    throw new RateLimitUnavailableError(`Rate limit RPC failed for ${scope}: ${error.message}`, {
      shouldBypass: false,
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
