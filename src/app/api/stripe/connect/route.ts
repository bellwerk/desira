import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key);
}

const BodySchema = z.object({
  token: z.string().min(10),
});

export async function POST(req: Request) {
  const stripe = getStripe();

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token } = parsed.data;

  const { data: list } = await supabaseAdmin
    .from("lists")
    .select("id, owner_id")
    .eq("share_token", token)
    .maybeSingle();

  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Ensure payment account row exists
  const { data: existing } = await supabaseAdmin
    .from("payment_accounts")
    .select("provider_account_id, charges_enabled, payouts_enabled, details_submitted")
    .eq("owner_id", list.owner_id)
    .maybeSingle();

  let providerAccountId = existing?.provider_account_id ?? null;

  if (!providerAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    providerAccountId = acct.id;

    await supabaseAdmin.from("payment_accounts").upsert({
      owner_id: list.owner_id,
      provider: "stripe",
      provider_account_id: providerAccountId,
      charges_enabled: Boolean(acct.charges_enabled),
      payouts_enabled: Boolean(acct.payouts_enabled),
      details_submitted: Boolean(acct.details_submitted),
    });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const link = await stripe.accountLinks.create({
    account: providerAccountId,
    refresh_url: `${origin}/u/${token}`,
    return_url: `${origin}/u/${token}`,
    type: "account_onboarding",
  });

  return NextResponse.json({
    ok: true,
    url: link.url,
  });
}
