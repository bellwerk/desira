import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export const runtime = "nodejs";

const CreateSchema = z.object({
  item_id: z.string().uuid(),
  reserved_by_name: z.string().trim().max(80).optional(),
  reserved_by_email: z.string().trim().email().max(120).optional(),
});

const CancelSchema = z.object({
  reservation_id: z.string().uuid(),
  cancel_token: z.string().min(10).max(200),
});

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
export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CancelSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reservation_id, cancel_token } = parsed.data;
  const hash = sha256(cancel_token);

  const { data: r, error: rErr } = await supabaseAdmin
    .from("reservations")
    .select("id,status,cancel_token_hash")
    .eq("id", reservation_id)
    .single();

  if (rErr || !r) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (r.status !== "reserved") {
    return NextResponse.json({ error: "Not cancelable" }, { status: 409 });
  }

  if (!r.cancel_token_hash || r.cancel_token_hash !== hash) {
    return NextResponse.json({ error: "Invalid cancel token" }, { status: 403 });
  }

  const { data: updated, error: upErr } = await supabaseAdmin
    .from("reservations")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", reservation_id)
    .select("id,status")
    .single();

  if (upErr || !updated) {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reservation: updated });
}
