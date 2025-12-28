import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BodySchema = z.object({
  token: z.string().min(10),
  item_id: z.string().uuid(),

  // Contribution amount (what recipient receives)
  amount_cents: z.number().int().positive(),

  // Fee from client (we verify against server rule)
  fee_cents: z.number().int().positive(),

  contributor_name: z.string().max(80).nullable().optional(),
  message: z.string().max(500).nullable().optional(),
  is_anonymous: z.boolean().optional(),
});

// Fee rule: 5% with $1 minimum
function feeCentsForContribution(contributionCents: number) {
  return Math.max(100, Math.round(contributionCents * 0.05));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // 0) Recompute fee server-side (prevents tampering)
  const expectedFee = feeCentsForContribution(body.amount_cents);
  if (body.fee_cents !== expectedFee) {
    return NextResponse.json(
      {
        error: "Fee mismatch (client out of date)",
        expected_fee_cents: expectedFee,
      },
      { status: 409 }
    );
  }

  const contributionCents = body.amount_cents;
  const feeCents = expectedFee;
  const totalChargeCents = contributionCents + feeCents;

  // 1) Load list by token
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,owner_id,currency,allow_contributions,visibility")
    .eq("share_token", body.token)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (!list.allow_contributions || list.visibility === "private") {
    return NextResponse.json({ error: "Contributions disabled" }, { status: 403 });
  }

  // 2) Load item (must belong to list)
  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,title,target_amount_cents,price_cents,status,list_id")
    .eq("id", body.item_id)
    .single();

  if (itemErr || !item || item.list_id !== list.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "active") {
    return NextResponse.json({ error: "Item not fundable" }, { status: 409 });
  }

  // 3) Server-side cap (no overfunding in MVP)
  const target = item.target_amount_cents ?? item.price_cents ?? null;

  if (target != null) {
    const { data: total } = await supabaseAdmin
      .from("public_contribution_totals")
      .select("funded_amount_cents")
      .eq("item_id", item.id)
      .maybeSingle();

    const funded = total?.funded_amount_cents ?? 0;
    const left = Math.max(target - funded, 0);

    if (left <= 0) {
      return NextResponse.json({ error: "Already fully funded" }, { status: 409 });
    }

    // Cap contribution (recipient amount)
    if (contributionCents > left) {
      return NextResponse.json(
        { error: "Amount exceeds remaining", max_cents: left },
        { status: 409 }
      );
    }
  }

  // 4) Find connected Stripe account for owner
  const { data: pay, error: payErr } = await supabaseAdmin
    .from("payment_accounts")
    .select("provider_account_id,charges_enabled,payouts_enabled,details_submitted")
    .eq("owner_id", list.owner_id)
    .maybeSingle();

  if (payErr || !pay?.provider_account_id) {
    return NextResponse.json(
      { error: "Recipient payouts not enabled (owner not connected)" },
      { status: 409 }
    );
  }

  // 4b) Refresh account status from Stripe (after onboarding)
  const acct = await stripe.accounts.retrieve(pay.provider_account_id);

  await supabaseAdmin.from("payment_accounts").upsert({
    owner_id: list.owner_id,
    provider: "stripe",
    provider_account_id: pay.provider_account_id,
    charges_enabled: acct.charges_enabled,
    payouts_enabled: acct.payouts_enabled,
    details_submitted: acct.details_submitted,
  });

  if (!acct.charges_enabled) {
    return NextResponse.json(
      { error: "Recipient account not ready for charges (finish onboarding)" },
      { status: 409 }
    );
  }

  // 5) Create Checkout Session (destination charge + application fee)
  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  // Stripe requires application_fee_amount < amount
  if (feeCents >= totalChargeCents) {
    return NextResponse.json({ error: "Invalid fee" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/u/${body.token}/thanks?item=${body.item_id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/u/${body.token}/pay?item=${body.item_id}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: list.currency.toLowerCase(),
          unit_amount: totalChargeCents,
          product_data: { name: `Contribution: ${item.title}` },
        },
      },
    ],
    metadata: {
      list_id: list.id,
      item_id: item.id,
      token: body.token,
      contributor_name: body.contributor_name ?? "",
      message: body.message ?? "",
      is_anonymous: body.is_anonymous ? "1" : "0",

      // important for webhook
      contribution_cents: String(contributionCents),
      fee_cents: String(feeCents),
      total_cents: String(totalChargeCents),
    },
    payment_intent_data: {
      transfer_data: { destination: pay.provider_account_id },
      application_fee_amount: feeCents,
    },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
