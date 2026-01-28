import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export const runtime = "nodejs";

// GET /api/seed
// Creates a demo auth user + profile + unlisted list + a few items.
// Requires ALLOW_SEED=true env var to be explicitly set.
export async function GET(): Promise<NextResponse> {
  // Only allow if explicitly enabled via env var (never set this in production)
  if (process.env.ALLOW_SEED !== "true") {
    return NextResponse.json(
      { error: "Seed endpoint is disabled. Set ALLOW_SEED=true to enable." },
      { status: 403 }
    );
  }
  // 1) Create demo auth user
  const stamp = Date.now();
  const email = `demo+${stamp}@example.com`;
  const password = crypto.randomBytes(9).toString("base64url"); // ~12 chars

  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: "Failed to create demo user", details: createErr },
      { status: 500 }
    );
  }

  const userId = created.user.id;

  // 2) Create profile
  const handle = `demo_${stamp}`;
  const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    handle,
    display_name: "Demo Owner",
    avatar_url: null,
  });

  if (profileErr) {
    return NextResponse.json(
      { error: "Failed to create profile", details: profileErr },
      { status: 500 }
    );
  }

  // 3) Create list (unlisted by default)
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .insert({
      owner_id: userId,
      title: "Desira Demo List",
      recipient_type: "person",
      visibility: "unlisted",
      allow_reservations: true,
      allow_contributions: true,
      allow_anonymous: true,
      currency: "CAD",
    })
    .select("id, share_token")
    .single();

  if (listErr || !list) {
    return NextResponse.json(
      { error: "Failed to create list", details: listErr },
      { status: 500 }
    );
  }

  // 4) Create items
  const items = [
    {
      list_id: list.id,
      title: "MAAP Jersey (Black)",
      product_url: "https://example.com/maap-jersey",
      image_url: "https://picsum.photos/seed/maap/600/600",
      merchant: "Example",
      price_cents: 16500,
      target_amount_cents: 16500,
      note_public: "Size M preferred",
      note_private: "If out of stock, any minimalist jersey works",
      status: "active",
      sort_order: 1,
    },
    {
      list_id: list.id,
      title: "Gift card: Local coffee roaster",
      product_url: "https://example.com/coffee-card",
      image_url: "https://picsum.photos/seed/coffee/600/600",
      merchant: "Example",
      price_cents: 5000,
      target_amount_cents: 5000,
      note_public: "Light roast please",
      note_private: "",
      status: "active",
      sort_order: 2,
    },
    {
      list_id: list.id,
      title: "Cycling socks (white, tall)",
      product_url: "https://example.com/socks",
      image_url: "https://picsum.photos/seed/socks/600/600",
      merchant: "Example",
      price_cents: 2200,
      target_amount_cents: 2200,
      note_public: "One pair is enough",
      note_private: "",
      status: "active",
      sort_order: 3,
    },
  ];

  const { error: itemsErr } = await supabaseAdmin.from("items").insert(items);

  if (itemsErr) {
    return NextResponse.json(
      { error: "Failed to create items", details: itemsErr },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    share_token: list.share_token,
    public_url: `http://localhost:3000/u/${list.share_token}`,
    demo_owner: { email, password },
  });
}
