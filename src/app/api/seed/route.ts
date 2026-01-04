import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export const runtime = "nodejs";

// GET /api/seed
// Creates a demo auth user + profile + unlisted list + items with varied states.
// Disable or protect this endpoint before production launch.
export async function GET() {
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
      title: "Birthday Wishlist 🎂",
      recipient_type: "person",
      visibility: "unlisted",
      occasion: "Birthday",
      event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
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

  // 4) Create items with varied states
  const items = [
    {
      list_id: list.id,
      title: "Sony WH-1000XM5 Wireless Headphones",
      product_url: "https://www.amazon.ca/dp/B09XS7JWHH",
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      merchant: "Amazon",
      price_cents: 39999,
      target_amount_cents: 39999,
      note_public: "Black color preferred",
      note_private: "Check Best Buy for price matching",
      status: "active",
      sort_order: 1,
    },
    {
      list_id: list.id,
      title: "Kindle Paperwhite (16GB)",
      product_url: "https://www.amazon.ca/dp/B08KTZ8249",
      image_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
      merchant: "Amazon",
      price_cents: 16999,
      target_amount_cents: 16999,
      note_public: "Latest generation, any color",
      note_private: "",
      status: "active",
      sort_order: 2,
    },
    {
      list_id: list.id,
      title: "Patagonia Better Sweater Jacket",
      product_url: "https://www.patagonia.ca/product/mens-better-sweater-fleece-jacket/25528.html",
      image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
      merchant: "Patagonia",
      price_cents: 17900,
      target_amount_cents: 17900,
      note_public: "Size Medium, New Navy color",
      note_private: "Check for sales on Boxing Day",
      status: "active",
      sort_order: 3,
    },
    {
      list_id: list.id,
      title: "Local Coffee Subscription (3 months)",
      product_url: "https://example.com/coffee-subscription",
      image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
      merchant: "Phil & Sebastian",
      price_cents: 7500,
      target_amount_cents: 7500,
      note_public: "Light roast, whole bean",
      note_private: "",
      status: "active",
      sort_order: 4,
    },
    {
      list_id: list.id,
      title: "Nintendo Switch Game: Zelda TotK",
      product_url: "https://www.nintendo.com/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/",
      image_url: "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=600&q=80",
      merchant: "Nintendo",
      price_cents: 8999,
      target_amount_cents: 8999,
      note_public: "Physical copy preferred",
      note_private: "",
      status: "active",
      sort_order: 5,
    },
    {
      list_id: list.id,
      title: "Cooking Class Experience",
      product_url: null,
      image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
      merchant: null,
      price_cents: 12500,
      target_amount_cents: 12500,
      note_public: "Italian or Thai cuisine class in Calgary area",
      note_private: "Check Craftsy or local culinary schools",
      status: "active",
      sort_order: 6,
    },
  ];

  const { data: insertedItems, error: itemsErr } = await supabaseAdmin
    .from("items")
    .insert(items)
    .select("id, title");

  if (itemsErr || !insertedItems) {
    return NextResponse.json(
      { error: "Failed to create items", details: itemsErr },
      { status: 500 }
    );
  }

  // 5) Create a sample reservation on the 3rd item (Patagonia jacket)
  const patagoniaItem = insertedItems.find((i) => i.title.includes("Patagonia"));
  if (patagoniaItem) {
    await supabaseAdmin.from("reservations").insert({
      item_id: patagoniaItem.id,
      status: "reserved",
      reserved_by_name: "Secret Santa",
      reserved_by_email: null,
      cancel_token_hash: crypto.createHash("sha256").update("demo-cancel-token").digest("hex"),
    });
  }

  // 6) Create a sample contribution on the 4th item (Coffee subscription)
  const coffeeItem = insertedItems.find((i) => i.title.includes("Coffee"));
  if (coffeeItem) {
    await supabaseAdmin.from("contributions").insert({
      item_id: coffeeItem.id,
      amount_cents: 2500,
      fee_cents: 125,
      total_cents: 2625,
      currency: "CAD",
      contributor_name: "Aunt Martha",
      message: "Happy birthday! Enjoy your morning coffee ☕",
      is_anonymous: false,
      payment_status: "succeeded",
      provider: "stripe",
      provider_payment_intent_id: `pi_demo_${stamp}_coffee`,
    });
  }

  // 7) Create a fully funded item (Cooking Class)
  const cookingItem = insertedItems.find((i) => i.title.includes("Cooking"));
  if (cookingItem) {
    // Add contributions that fully fund the item
    await supabaseAdmin.from("contributions").insert([
      {
        item_id: cookingItem.id,
        amount_cents: 5000,
        fee_cents: 250,
        total_cents: 5250,
        currency: "CAD",
        contributor_name: "Uncle Bob",
        message: "Learn to cook something amazing!",
        is_anonymous: false,
        payment_status: "succeeded",
        provider: "stripe",
        provider_payment_intent_id: `pi_demo_${stamp}_cooking1`,
      },
      {
        item_id: cookingItem.id,
        amount_cents: 5000,
        fee_cents: 250,
        total_cents: 5250,
        currency: "CAD",
        contributor_name: "Grandma",
        message: "From grandma with love 💕",
        is_anonymous: false,
        payment_status: "succeeded",
        provider: "stripe",
        provider_payment_intent_id: `pi_demo_${stamp}_cooking2`,
      },
      {
        item_id: cookingItem.id,
        amount_cents: 2500,
        fee_cents: 125,
        total_cents: 2625,
        currency: "CAD",
        contributor_name: null,
        message: null,
        is_anonymous: true,
        payment_status: "succeeded",
        provider: "stripe",
        provider_payment_intent_id: `pi_demo_${stamp}_cooking3`,
      },
    ]);

    // Update item status to funded
    await supabaseAdmin
      .from("items")
      .update({ status: "funded" })
      .eq("id", cookingItem.id);
  }

  return NextResponse.json({
    ok: true,
    share_token: list.share_token,
    public_url: `http://localhost:3000/u/${list.share_token}`,
    demo_owner: { email, password },
    summary: {
      items_created: insertedItems.length,
      reserved_item: patagoniaItem?.title ?? null,
      partially_funded_item: coffeeItem?.title ?? null,
      fully_funded_item: cookingItem?.title ?? null,
    },
  });
}
