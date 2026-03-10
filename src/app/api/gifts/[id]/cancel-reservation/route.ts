import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";
import { clearFallbackReservation } from "@/lib/reservation-fallback";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

const CancelReservationSchema = z.object({
  deviceToken: z.string().uuid(),
  cancelToken: z.string().min(10).max(200).optional(),
  share_token: z.string().trim().min(1).max(200).optional(),
});

type Visibility = "public" | "unlisted" | "private";
const RESERVATION_DURATION_HOURS = 24;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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

function isReservationExpired(
  reservation: Pick<ReservationRow, "reserved_until" | "created_at">
): boolean {
  const expiryIso = getReservationExpiryIso(reservation);
  if (!expiryIso) {
    return false;
  }
  return new Date(expiryIso).getTime() <= Date.now();
}

function isLegacyPurchasedLock(reservation: ReservationRow): boolean {
  if (reservation.status !== "reserved") {
    return false;
  }
  const ownerHash = getReservationOwnerHash(reservation);
  return !reservation.reserved_until && !ownerHash && !reservation.cancel_token_hash;
}

async function isAcceptedMember(listId: string, userId: string): Promise<boolean> {
  const { data: membership } = await supabaseAdmin
    .from("list_members")
    .select("id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  return Boolean(membership);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext): Promise<NextResponse> {
  const routeParams = RouteParamsSchema.safeParse(await context.params);
  if (!routeParams.success) {
    return NextResponse.json({ error: "Invalid gift ID" }, { status: 400 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CancelReservationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const itemId = routeParams.data.id;
  const { deviceToken, cancelToken, share_token } = parsed.data;
  const tokenHash = sha256(deviceToken);

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,list_id")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,visibility,share_token")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const visibility = (list.visibility ?? "unlisted") as Visibility;
  if (visibility === "private") {
    if (!user || !(await isAcceptedMember(item.list_id, user.id))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  } else if (visibility === "unlisted") {
    const hasValidToken = share_token && list.share_token === share_token;
    const isMember = user ? await isAcceptedMember(item.list_id, user.id) : false;
    if (!hasValidToken && !isMember) {
      return NextResponse.json(
        { error: "Invalid or missing share token" },
        { status: 403 }
      );
    }
  }

  const { data: reservation, error: reservationErr } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("item_id", itemId)
    .neq("status", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reservationErr) {
    return NextResponse.json(
      { error: "Failed to read reservation state" },
      { status: 500 }
    );
  }

  if (!reservation) {
    clearFallbackReservation(tokenHash, itemId);
    return NextResponse.json({ ok: true, already_available: true });
  }

  const reservationRow = reservation as ReservationRow;

  if (reservationRow.status === "purchased" || isLegacyPurchasedLock(reservationRow)) {
    return NextResponse.json(
      { error: "Purchased gifts cannot be unreserved" },
      { status: 409 }
    );
  }

  const isExpired = isReservationExpired(reservationRow);
  const ownerHash = getReservationOwnerHash(reservationRow);

  if (isExpired) {
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("reservations")
      .update({ status: "canceled", canceled_at: nowIso })
      .eq("id", reservationRow.id)
      .eq("status", "reserved");

    clearFallbackReservation(tokenHash, itemId);
    return NextResponse.json({ ok: true, already_available: true });
  }

  if (ownerHash) {
    if (ownerHash !== tokenHash) {
      return NextResponse.json(
        { error: "This reservation belongs to another browser/device" },
        { status: 403 }
      );
    }
  } else if (reservationRow.cancel_token_hash) {
    if (!cancelToken) {
      return NextResponse.json(
        { error: "Reservation token required for this browser/device" },
        { status: 403 }
      );
    }
    if (sha256(cancelToken) !== reservationRow.cancel_token_hash) {
      return NextResponse.json(
        { error: "Invalid reservation token for this browser/device" },
        { status: 403 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unable to verify reservation ownership" },
      { status: 403 }
    );
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("reservations")
    .update({ status: "canceled", canceled_at: nowIso })
    .eq("id", reservationRow.id)
    .eq("status", "reserved")
    .select("id,status")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }

  clearFallbackReservation(tokenHash, itemId);

  void logAuditEvent({
    eventType: AuditEventType.GUEST_CANCEL_RESERVATION,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "reservation",
    resourceId: reservationRow.id,
    metadata: {
      item_id: itemId,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  void logAuditEvent({
    eventType: AuditEventType.RESERVATION_CANCELED,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "reservation",
    resourceId: reservationRow.id,
    metadata: {
      item_id: itemId,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({
    ok: true,
    reservation_id: updated.id,
    status: updated.status,
  });
}
