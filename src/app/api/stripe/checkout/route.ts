import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
const RESERVATION_DURATION_HOURS = 24;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

// fee rule (must match UI): 5% with $1 minimum
function feeCentsForContribution(contributionCents: number) {
  return Math.max(100, Math.round(contributionCents * 0.05));
}
function getAppOrigin(): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    "http://localhost:3000";

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return "http://localhost:3000";
  }
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

type ReservationRow = {
  id: string;
  status: string;
  created_at?: string | null;
  reserved_until?: string | null;
  reserved_by_token_hash?: string | null;
  device_token_hash?: string | null;
  cancel_token_hash?: string | null;
};

function getReservationOwnerHash(
  reservation: Pick<ReservationRow, "reserved_by_token_hash" | "device_token_hash">
): string | null {
  return reservation.reserved_by_token_hash ?? reservation.device_token_hash ?? null;
}

function getReservationExpiryIso(
  reservation: Pick<ReservationRow, "reserved_until" | "created_at">
): string | null {
  if (reservation.reserved_until) {
    return reservation.reserved_until;
  }
  if (!reservation.created_at) {
    return null;
  }
  const createdAtMs = new Date(reservation.created_at).getTime();
  if (Number.isNaN(createdAtMs)) {
    return null;
  }
  return new Date(createdAtMs + RESERVATION_DURATION_HOURS * 60 * 60 * 1000).toISOString();
}

function isLegacyPurchasedLock(reservation: ReservationRow): boolean {
  if (reservation.status !== "reserved") {
    return false;
  }
  const ownerHash = getReservationOwnerHash(reservation);
  return !reservation.reserved_until && !ownerHash && !reservation.cancel_token_hash;
}

export async function POST(req: Request) {
  const stripe = getStripe();

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
    // Block contributions if reserved/purchased
    supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("item_id", item.id)
      .neq("status", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Get funding status if there's a target
    targetCents
      ? supabaseAdmin
          .from("contributions")
          .select("amount_cents, payment_status")
          .eq("item_id", item.id)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data: rsv, error: rsvErr } = rsvResult;
  const { data: contribs, error: sumErr } = contribsResult;

  if (rsvErr) {
    return NextResponse.json({ error: "Failed to load reservation state." }, { status: 500 });
  }

  const reservation = (rsv ?? null) as ReservationRow | null;
  if (reservation && (reservation.status === "purchased" || isLegacyPurchasedLock(reservation))) {
    return NextResponse.json({ error: "Item is already purchased." }, { status: 409 });
  }

  if (reservation?.status === "reserved") {
    const expiryIso = getReservationExpiryIso(reservation);
    const isExpired = expiryIso ? new Date(expiryIso).getTime() <= Date.now() : false;

    if (!isExpired) {
      return NextResponse.json({ error: "Item is already marked as bought." }, { status: 409 });
    }

    await supabaseAdmin
      .from("reservations")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)
      .eq("status", "reserved");
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

  // If cached flags indicate account not ready, refresh from Stripe before blocking
  let chargesEnabled = acct?.charges_enabled ?? false;
  let payoutsEnabled = acct?.payouts_enabled ?? false;
  let detailsSubmitted = acct?.details_submitted ?? false;
  const providerAccountId = acct?.provider_account_id ?? null;

  if (providerAccountId && (!chargesEnabled || !payoutsEnabled || !detailsSubmitted)) {
    // Refresh account status from Stripe (owner may have completed onboarding)
    try {
      const stripeAcct = await stripe.accounts.retrieve(providerAccountId);
      chargesEnabled = Boolean(stripeAcct.charges_enabled);
      payoutsEnabled = Boolean(stripeAcct.payouts_enabled);
      detailsSubmitted = Boolean(stripeAcct.details_submitted);

      // Update cached values if they've changed
      if (
        chargesEnabled !== (acct?.charges_enabled ?? false) ||
        payoutsEnabled !== (acct?.payouts_enabled ?? false) ||
        detailsSubmitted !== (acct?.details_submitted ?? false)
      ) {
        await supabaseAdmin
          .from("payment_accounts")
          .update({
            charges_enabled: chargesEnabled,
            payouts_enabled: payoutsEnabled,
            details_submitted: detailsSubmitted,
          })
          .eq("owner_id", list.owner_id);
      }
    } catch {
      // If Stripe call fails, fall through to use cached values
    }
  }

  if (!providerAccountId || !chargesEnabled || !payoutsEnabled || !detailsSubmitted) {
    return NextResponse.json(
      { error: "Recipient account not ready for charges (finish onboarding)" },
      { status: 409 }
    );
  }

  const origin = getAppOrigin();
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
      transfer_data: { destination: providerAccountId },
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

  void logAuditEvent({
    eventType: AuditEventType.CONTRIBUTION_CREATED,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "item",
    resourceId: item.id,
    metadata: {
      list_id: list.id,
      checkout_session_id: session.id,
      contribution_cents: contributionCents,
      fee_cents: feeCents,
      total_cents: totalCents,
      source: "shared_page",
    },
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({ ok: true, url: session.url });
}
