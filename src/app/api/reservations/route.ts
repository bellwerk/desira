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
  share_token: z.string().min(1).max(200).optional(),
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

  const { item_id, reserved_by_name, reserved_by_email, share_token } = parsed.data;

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

  // Fetch list with owner_id and share_token to enable self-gifting prevention and access validation
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("owner_id,allow_reservations,visibility,share_token")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (!list.allow_reservations) {
    return NextResponse.json(
      { error: "Reservations disabled" },
      { status: 403 }
    );
  }

  // Get authenticated user (if any) for access validation and self-gifting prevention
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Helper: check if user is an authenticated list member
  const checkMembership = async (): Promise<boolean> => {
    if (!user) return false;
    const { data: membership } = await supabaseAdmin
      .from("list_members")
      .select("id")
      .eq("list_id", item.list_id)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    return Boolean(membership);
  };

  // For private lists, require authenticated membership
  if (list.visibility === "private") {
    const isMember = await checkMembership();
    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
  }

  // For unlisted lists, validate share token access or authenticated membership
  if (list.visibility === "unlisted") {
    const hasValidToken = share_token && list.share_token === share_token;
    const isMember = await checkMembership();
    if (!hasValidToken && !isMember) {
      return NextResponse.json(
        { error: "Invalid or missing share token" },
        { status: 403 }
      );
    }
  }

  // Self-gifting prevention: check if authenticated user is the list owner
  if (user && list.owner_id === user.id) {
    return NextResponse.json(
      { error: "Cannot reserve your own list items" },
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
    reservation_id: created.id,
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
