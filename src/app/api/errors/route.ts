import { NextResponse } from "next/server";
import { z } from "zod";
import { trackServerError } from "@/lib/error-tracking";
import { RateLimitUnavailableError, getRateLimitClientKey, takeRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const ErrorPayloadSchema = z.object({
  source: z.literal("client"),
  scope: z.string().min(1).max(120),
  message: z.string().min(1).max(5000),
  name: z.string().max(200).optional(),
  stack: z.string().max(20000).optional(),
  digest: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const rateLimit = await takeRateLimit({
      scope: "client-errors",
      key: getRateLimitClientKey(req.headers, user?.id ?? null),
      maxRequests: 30,
      windowSeconds: 60 * 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many error reports. Please retry shortly.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Error reporting is temporarily unavailable.",
          },
        },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }
    throw error;
  }

  const json = await req.json().catch(() => null);
  const parsed = ErrorPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_PAYLOAD",
          message: "Invalid error payload",
        },
      },
      { status: 400 }
    );
  }

  const clientPayload = parsed.data;

  await trackServerError(new Error(clientPayload.message), {
    scope: `client:${clientPayload.scope}`,
    digest: clientPayload.digest,
    metadata: {
      client_payload: {
        source: clientPayload.source,
        name: clientPayload.name ?? null,
        stack: clientPayload.stack ?? null,
        timestamp: clientPayload.timestamp ?? null,
        metadata: clientPayload.metadata ?? {},
      },
    },
  });

  return NextResponse.json({ ok: true });
}
