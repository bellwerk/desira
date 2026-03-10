import { NextResponse } from "next/server";
import { z } from "zod";
import { POST as createStripeCheckoutSession } from "@/app/api/stripe/checkout/route";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

const BodySchema = z
  .object({
    token: z.string().min(10),
    contribution_cents: z.number().int().positive().optional(),
    fee_cents: z.number().int().nonnegative().optional(),
    total_cents: z.number().int().positive().optional(),
    amount_cents: z.number().int().positive().optional(),
    contributor_name: z.string().max(80).nullable().optional(),
    message: z.string().max(300).nullable().optional(),
    is_anonymous: z.boolean().optional(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext): Promise<NextResponse> {
  const routeParams = RouteParamsSchema.safeParse(await context.params);
  if (!routeParams.success) {
    return NextResponse.json({ error: "Invalid gift ID" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proxiedBody = {
    ...parsed.data,
    item_id: routeParams.data.id,
  };

  const proxiedReq = new Request(req.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: req.headers.get("origin") ?? "",
      cookie: req.headers.get("cookie") ?? "",
      "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
      "x-real-ip": req.headers.get("x-real-ip") ?? "",
    },
    body: JSON.stringify(proxiedBody),
  });

  return createStripeCheckoutSession(proxiedReq);
}

