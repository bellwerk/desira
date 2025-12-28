import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const BodySchema = z.object({
  token: z.string().min(10),
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

  const { token } = parsed.data;

  // 1) Load list owner
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,owner_id,visibility")
    .eq("share_token", token)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Dev-only: allow even for unlisted/public. (In prod: require owner auth.)
  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  // 2) Check if payment account exists
  const { data: existing } = await supabaseAdmin
    .from("payment_accounts")
    .select("provider_account_id")
    .eq("owner_id", list.owner_id)
    .maybeSingle();

  let accountId = existing?.provider_account_id;

  // 3) Create connected account if missing (Express)
  if (!accountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { owner_id: list.owner_id },
    });

    accountId = acct.id;

    await supabaseAdmin.from("payment_accounts").upsert({
      owner_id: list.owner_id,
      provider: "stripe",
      provider_account_id: accountId,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      details_submitted: acct.details_submitted,
    });
  }

  // 4) Create account onboarding link
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/u/${token}`,
    return_url: `${origin}/u/${token}`,
    type: "account_onboarding",
  });

  return NextResponse.json({ ok: true, url: link.url });
}
