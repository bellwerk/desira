import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// fee rule (must match UI): 5% with $1 minimum
function feeCentsForContribution(contributionCents: number) {
  return Math.max(100, Math.round(contributionCents * 0.05));
}

// Accept BOTH old and new shapes (so we don’t break during iteration)
const BodySchema = z
  .object({
    token: z.string().min(10),
    item_id: z.string().uuid(),

    // new names
    contribution_cents: z.number().int().positive().optional(),
    fee_cents: z.number().int().nonnegative().optional(),
    total_cents: z.number().int().positive().optional(),

    // old name (if any)
    amount_cents: z.number().int().positive().optional(),

    contributor_name: z.string().max(80).nullable().optional(),
    message: z.string().max(300).nullable().optional(),
    is_anonymous: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // normalize contribution_cents
  const contributionCents =
    body.contribution_cents ?? body.amount_cents ?? undefined;

  if (!contributionCents || !Number.isFinite(contributionCents)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (contributionCents < 100) {
    return NextResponse.json({ error: "Minimum contribution is $1." }, { status: 400 });
  }

  // Compute fee/total SERVER-side (don’t trust client)
  const feeCents = feeCentsForContribution(contributionCents);
  const totalCents = contributionCents + feeCents;

  // Load list by share token
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select(
      `id, owner_id, currency, visibility, allow_contributions`
    )
    .eq("share_token", body.token)
    .maybeSingle();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const allowContributions = (list.allow_contributions ?? true) as boolean;
  if (!allowContributions) {
    return NextResponse.json({ error: "Contributions are disabled." }, { status: 403 });
  }

  if (list.visibility === "private") {
    return NextResponse.json({ error: "List is private." }, { status: 403 });
  }

  // Parallel fetch: item, user auth, and payment account (reduces waterfall)
  const supabase = await createClient();
  const [itemResult, userResult, acctResult] = await Promise.all([
    // Load item and ensure it belongs to list
    supabaseAdmin
      .from("items")
      .select(`id, list_id, title, target_amount_cents, price_cents, status`)
      .eq("id", body.item_id)
      .maybeSingle(),
    // Self-gifting prevention: check if authenticated user is the list owner
    supabase.auth.getUser(),
    // Recipient must have a connected Stripe account
    supabaseAdmin
      .from("payment_accounts")
      .select("provider_account_id, charges_enabled, payouts_enabled, details_submitted")
      .eq("owner_id", list.owner_id)
      .maybeSingle(),
  ]);

  const { data: item, error: itemErr } = itemResult;
  const { data: { user } } = userResult;
  const { data: acct } = acctResult;

  // Self-gifting check
  if (user && list.owner_id === user.id) {
    return NextResponse.json(
      { error: "Cannot contribute to your own list items" },
      { status: 403 }
    );
  }

  if (itemErr || !item || item.list_id !== list.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "active") {
    return NextResponse.json({ error: "Item is not available." }, { status: 409 });
  }

  // Parallel fetch: reservations and contributions (reduces waterfall)
  const targetCents = item.target_amount_cents ?? item.price_cents ?? null;

  const [rsvResult, contribsResult] = await Promise.all([
    // Block contributions if reserved
    supabaseAdmin
      .from("reservations")
      .select("id")
      .eq("item_id", item.id)
      .eq("status", "reserved")
      .maybeSingle(),
    // Get funding status if there's a target
    targetCents
      ? supabaseAdmin
          .from("contributions")
          .select("amount_cents, payment_status")
          .eq("item_id", item.id)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data: rsv } = rsvResult;
  const { data: contribs, error: sumErr } = contribsResult;

  if (rsv) {
    return NextResponse.json({ error: "Item is reserved." }, { status: 409 });
  }

  if (targetCents) {
    if (sumErr) {
      return NextResponse.json({ error: "Failed to compute funding." }, { status: 500 });
    }

    const funded = (contribs ?? [])
      .filter((c) => c.payment_status === "succeeded")
      .reduce((acc, c) => acc + (c.amount_cents ?? 0), 0);

    const left = Math.max(targetCents - funded, 0);

    if (left <= 0) {
      return NextResponse.json({ error: "This item is already fully funded." }, { status: 409 });
    }

    if (contributionCents > left) {
      return NextResponse.json(
        { error: `Max contribution is ${Math.round(left / 100)}.` },
        { status: 400 }
      );
    }
  }

  if (
    !acct?.provider_account_id ||
    !acct.charges_enabled ||
    !acct.payouts_enabled ||
    !acct.details_submitted
  ) {
    return NextResponse.json(
      { error: "Recipient account not ready for charges (finish onboarding)" },
      { status: 409 }
    );
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const currency = String(list.currency ?? "CAD").toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/u/${body.token}/thanks?item=${item.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/u/${body.token}/contribute?item=${item.id}`,
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: `Contribution: ${item.title}` },
          unit_amount: contributionCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency,
          product_data: { name: "Desira service fee" },
          unit_amount: feeCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: acct.provider_account_id },
      metadata: {
        item_id: item.id,
        contribution_cents: String(contributionCents),
        fee_cents: String(feeCents),
        total_cents: String(totalCents),
        contributor_name: body.contributor_name ?? "",
        message: body.message ?? "",
        is_anonymous: body.is_anonymous ? "1" : "0",
      },
    },
    metadata: {
      item_id: item.id,
      contribution_cents: String(contributionCents),
      fee_cents: String(feeCents),
      total_cents: String(totalCents),
      contributor_name: body.contributor_name ?? "",
      message: body.message ?? "",
      is_anonymous: body.is_anonymous ? "1" : "0",
    },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
