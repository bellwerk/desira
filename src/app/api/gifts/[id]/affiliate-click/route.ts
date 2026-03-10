import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";
import { generateAffiliateUrl, getAffiliateProvider } from "@/lib/affiliate";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

const AffiliateClickSchema = z.object({
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

function isMissingColumnError(errorMessage: string | undefined): boolean {
  const message = (errorMessage ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
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
  const parsed = AffiliateClickSchema.safeParse(json);
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
    .select("id,list_id,status,product_url")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  if (item.status !== "active") {
    return NextResponse.json({ error: "Gift is not available" }, { status: 409 });
  }

  if (!item.product_url) {
    return NextResponse.json({ error: "Gift has no store link" }, { status: 404 });
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
    .eq("status", "reserved")
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
    return NextResponse.json({ error: "Gift is not currently reserved" }, { status: 409 });
  }

  const reservationRow = reservation as ReservationRow;
  const isExpired = isReservationExpired(reservationRow);
  if (isExpired) {
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("reservations")
      .update({ status: "canceled", canceled_at: nowIso })
      .eq("id", reservation.id)
      .eq("status", "reserved");

    return NextResponse.json(
      {
        error: "Reservation expired. Reserve the gift again.",
      },
      { status: 409 }
    );
  }

  const ownerHash = getReservationOwnerHash(reservationRow);
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
  const clickUpdatePayload: Record<string, unknown> = {
    affiliate_click_at: nowIso,
  };
  if (ownerHash) {
    clickUpdatePayload.reserved_by_token_hash = ownerHash;
    clickUpdatePayload.device_token_hash = ownerHash;
  }

  const { error: markClickErrRaw } = await supabaseAdmin
    .from("reservations")
    .update(clickUpdatePayload)
    .eq("id", reservationRow.id)
    .eq("status", "reserved");

  const markClickErr = isMissingColumnError(markClickErrRaw?.message)
    ? null
    : markClickErrRaw;

  if (markClickErr) {
    return NextResponse.json(
      { error: "Failed to record outbound click" },
      { status: 500 }
    );
  }

  const affiliateProvider = getAffiliateProvider(item.product_url);
  const affiliateUrl = generateAffiliateUrl(item.product_url, itemId);

  void logAuditEvent({
    eventType: AuditEventType.GUEST_BUY_ON_STORE_CLICK,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "reservation",
    resourceId: reservationRow.id,
    metadata: {
      item_id: itemId,
      list_id: item.list_id,
      affiliate_provider: affiliateProvider,
    },
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({
    ok: true,
    affiliate_url: affiliateUrl,
    reserved_until: getReservationExpiryIso(reservationRow),
  });
}
