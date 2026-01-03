import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";

const CreateSchema = z.object({
  item_id: z.string().uuid(),
  reserved_by_name: z.string().trim().max(80).optional(),
  reserved_by_email: z.string().trim().email().max(120).optional(),
});

// New format: { reservation_id, cancel_token }
// Legacy format: { cancel_token } only (lookup by hash)
const CancelSchema = z.union([
  z.object({
    reservation_id: z.string().uuid(),
    cancel_token: z.string().min(10).max(200),
  }),
  z.object({
    cancel_token: z.string().min(10).max(200),
  }),
]);

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// POST /api/reservations -> create reservation
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { item_id, reserved_by_name, reserved_by_email } = parsed.data;

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,status,list_id")
    .eq("id", item_id)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "active") {
    return NextResponse.json(
      { error: "Item is not reservable" },
      { status: 409 }
    );
  }

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("allow_reservations,visibility")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (!list.allow_reservations || list.visibility === "private") {
    return NextResponse.json(
      { error: "Reservations disabled" },
      { status: 403 }
    );
  }

  // Block reservation if item already has contributions (mutual exclusivity)
  const { data: contribs } = await supabaseAdmin
    .from("contributions")
    .select("id")
    .eq("item_id", item_id)
    .eq("payment_status", "succeeded")
    .limit(1);

  if (contribs && contribs.length > 0) {
    return NextResponse.json(
      { error: "Cannot reserve: item already has contributions" },
      { status: 409 }
    );
  }

  // Self-gifting prevention: check if authenticated user is the list owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if this user is the list owner
    const { data: listWithOwner } = await supabaseAdmin
      .from("lists")
      .select("owner_id")
      .eq("id", item.list_id)
      .single();

    if (listWithOwner && listWithOwner.owner_id === user.id) {
      return NextResponse.json(
        { error: "Cannot reserve your own list items" },
        { status: 403 }
      );
    }
  }

  const cancelToken = crypto.randomBytes(24).toString("base64url");
  const cancelTokenHash = sha256(cancelToken);

  const { data: created, error: createErr } = await supabaseAdmin
    .from("reservations")
    .insert({
      item_id,
      status: "reserved",
      reserved_by_name: reserved_by_name ?? null,
      reserved_by_email: reserved_by_email ?? null,
      cancel_token_hash: cancelTokenHash,
    })
    .select("id,item_id,status,created_at")
    .single();

  if (createErr) {
    return NextResponse.json(
      { error: "Already reserved", details: createErr.message },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    reservation: created,
    cancel_token: cancelToken,
  });
}

// PATCH /api/reservations -> cancel reservation (requires cancel token)
export async function PATCH(req: Request): Promise<NextResponse> {
  const json = await req.json().catch(() => null);
  const parsed = CancelSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { cancel_token } = parsed.data;
  const hash = sha256(cancel_token);

  // Check if reservation_id was provided (new format) or if we need to lookup (legacy)
  const hasReservationId = "reservation_id" in parsed.data;

  let reservation: { id: string; status: string; cancel_token_hash: string | null } | null = null;

  if (hasReservationId) {
    // New format: lookup by reservation_id
    const reservation_id = (parsed.data as { reservation_id: string }).reservation_id;
    const { data: r, error: rErr } = await supabaseAdmin
      .from("reservations")
      .select("id,status,cancel_token_hash")
      .eq("id", reservation_id)
      .single();

    if (rErr || !r) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    reservation = r;
  } else {
    // Legacy format: lookup by cancel_token_hash
    const { data: r, error: rErr } = await supabaseAdmin
      .from("reservations")
      .select("id,status,cancel_token_hash")
      .eq("cancel_token_hash", hash)
      .eq("status", "reserved")
      .single();

    if (rErr || !r) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    reservation = r;
  }

  if (reservation.status !== "reserved") {
    return NextResponse.json({ error: "Not cancelable" }, { status: 409 });
  }

  if (!reservation.cancel_token_hash || reservation.cancel_token_hash !== hash) {
    return NextResponse.json({ error: "Invalid cancel token" }, { status: 403 });
  }

  const { data: updated, error: upErr } = await supabaseAdmin
    .from("reservations")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", reservation.id)
    .select("id,status")
    .single();

  if (upErr || !updated) {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reservation: updated });
}
