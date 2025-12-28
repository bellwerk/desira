import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BodySchema = z.object({
  session_id: z.string().min(10),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { session_id } = parsed.data;

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Session not paid yet", payment_status: session.payment_status },
      { status: 409 }
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const currency = session.currency?.toUpperCase() ?? null;

  const itemId = session.metadata?.item_id ?? null;

  const contributionCents = Number(session.metadata?.contribution_cents ?? "NaN");
  let feeCents = Number(session.metadata?.fee_cents ?? "NaN");
  let totalCents = Number(session.metadata?.total_cents ?? "NaN");

  const amountTotal = session.amount_total ?? null;

  if (!paymentIntentId || !currency || !itemId) {
    return NextResponse.json(
      { error: "Missing required metadata", metadata: session.metadata ?? {} },
      { status: 400 }
    );
  }

  if (!Number.isFinite(contributionCents) || contributionCents <= 0) {
    return NextResponse.json(
      { error: "Invalid contribution metadata", metadata: session.metadata ?? {} },
      { status: 400 }
    );
  }

  // Fallbacks (shouldn’t be needed, but safe)
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    if (amountTotal != null) totalCents = amountTotal;
  }
  if (!Number.isFinite(feeCents) || feeCents < 0) {
    if (Number.isFinite(totalCents) && totalCents > 0) {
      feeCents = Math.max(totalCents - contributionCents, 0);
    } else {
      feeCents = 0;
    }
  }

  // Insert idempotently
  const { error: insErr } = await supabaseAdmin.from("contributions").insert({
    item_id: itemId,

    // recipient amount (drives progress)
    amount_cents: Math.round(contributionCents),

    // ✅ new columns
    fee_cents: Math.round(feeCents),
    total_cents: Math.round(totalCents),

    currency,
    contributor_name: session.metadata?.contributor_name || null,
    message: session.metadata?.message || null,
    is_anonymous: session.metadata?.is_anonymous === "1",
    payment_status: "succeeded",
    provider: "stripe",
    provider_payment_intent_id: paymentIntentId,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json({
        ok: true,
        already_recorded: true,
        currency,
        item_id: itemId,
        contribution_cents: contributionCents,
        fee_cents: feeCents,
        total_cents: totalCents,
        payment_intent: paymentIntentId,
      });
    }

    return NextResponse.json(
      { error: "DB insert failed", details: insErr },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    currency,
    item_id: itemId,
    contribution_cents: contributionCents,
    fee_cents: feeCents,
    total_cents: totalCents,
    payment_intent: paymentIntentId,
  });
}
