import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";
import {
  RateLimitUnavailableError,
  getRateLimitClientKey,
  takeRateLimit,
} from "@/lib/rate-limit";
import {
  getFallbackReservationCount,
  hasFallbackReservation,
  trackFallbackReservation,
} from "@/lib/reservation-fallback";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

const ReserveSchema = z.object({
  deviceToken: z.string().uuid(),
  share_token: z.string().trim().min(1).max(200).optional(),
});

const RESERVATION_DURATION_HOURS = 24;
const MAX_ACTIVE_RESERVATIONS_PER_DEVICE = 3;
const RESERVE_RATE_LIMIT_MAX_REQUESTS = 20;
const RESERVE_RATE_LIMIT_WINDOW_SECONDS = 60 * 5;

type Visibility = "public" | "unlisted" | "private";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function plusHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function isMissingColumnError(errorMessage: string | undefined): boolean {
  const message = (errorMessage ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
}

function isReservationConflictInsertError(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }
  if (error.code === "23505") {
    return true;
  }
  const message = (error.message ?? "").toLowerCase();
  return message.includes("duplicate key") || message.includes("unique constraint");
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
  reservation: Pick<ReservationRow, "reserved_until" | "created_at">,
  holdHours: number
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
  return new Date(createdAtMs + holdHours * 60 * 60 * 1000).toISOString();
}

function isReservationExpired(
  reservation: Pick<ReservationRow, "reserved_until" | "created_at">,
  holdHours: number
): boolean {
  const expiryIso = getReservationExpiryIso(reservation, holdHours);
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
  const parsed = ReserveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const itemId = routeParams.data.id;
  const { deviceToken, share_token } = parsed.data;
  const tokenHash = sha256(deviceToken);
  const nowIso = new Date().toISOString();

  try {
    const decision = await takeRateLimit({
      scope: "gift-reserve",
      key: `${getRateLimitClientKey(req.headers)}|device:${tokenHash}`,
      maxRequests: RESERVE_RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: RESERVE_RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!decision.allowed) {
      return NextResponse.json(
        { error: "Too many reservation attempts. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(decision.retryAfterSeconds),
          },
        }
      );
    }
  } catch (error) {
    if (error instanceof RateLimitUnavailableError && error.shouldBypass) {
      console.warn("[smart-buy][reserve] Skipping rate limit:", error.message);
    } else if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json(
        { error: "Reservation service is temporarily unavailable. Please retry." },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    } else {
      throw error;
    }
  }

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,list_id,status")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  if (item.status !== "active") {
    return NextResponse.json({ error: "Gift is not available" }, { status: 409 });
  }

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,owner_id,allow_reservations,visibility,share_token")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (!(list.allow_reservations ?? true)) {
    return NextResponse.json(
      { error: "Buying is disabled for this list" },
      { status: 403 }
    );
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

  if (user && user.id === list.owner_id) {
    return NextResponse.json(
      { error: "Cannot reserve your own list items" },
      { status: 403 }
    );
  }

  const { data: existingContribution } = await supabaseAdmin
    .from("contributions")
    .select("id")
    .eq("item_id", itemId)
    .eq("payment_status", "succeeded")
    .limit(1)
    .maybeSingle();

  if (existingContribution) {
    return NextResponse.json(
      { error: "Gift already has contributions and cannot be reserved" },
      { status: 409 }
    );
  }

  let activeReservations: ReservationRow[] | null = null;
  let activeReservationsErr: { message: string } | null = null;
  let useLocalOwnershipFallback = false;
  const reservationOwnerFilter = `reserved_by_token_hash.eq.${tokenHash},device_token_hash.eq.${tokenHash}`;

  const modernActiveReservations = await supabaseAdmin
    .from("reservations")
    .select("id,created_at,reserved_until,reserved_by_token_hash,device_token_hash")
    .eq("status", "reserved")
    .or(reservationOwnerFilter);

  if (!modernActiveReservations.error) {
    activeReservations = (modernActiveReservations.data ?? []) as ReservationRow[];
  } else if (isMissingColumnError(modernActiveReservations.error.message)) {
    const legacyActiveReservations = await supabaseAdmin
      .from("reservations")
      .select("id,created_at,device_token_hash")
      .eq("status", "reserved")
      .eq("device_token_hash", tokenHash);

    if (!legacyActiveReservations.error) {
      activeReservations = (legacyActiveReservations.data ?? []) as ReservationRow[];
    } else if (isMissingColumnError(legacyActiveReservations.error.message)) {
      activeReservations = [];
      useLocalOwnershipFallback = true;
    } else {
      activeReservationsErr = legacyActiveReservations.error;
    }
  } else {
    activeReservationsErr = modernActiveReservations.error;
  }

  if (!activeReservationsErr) {
    const activeOwnedCount = useLocalOwnershipFallback
      ? getFallbackReservationCount(tokenHash)
      : (activeReservations ?? [])
          .map((row) => row as ReservationRow)
          .filter((reservation) => {
            return (
              getReservationOwnerHash(reservation) === tokenHash &&
              !isReservationExpired(reservation, RESERVATION_DURATION_HOURS)
            );
          }).length;

    if (activeOwnedCount >= MAX_ACTIVE_RESERVATIONS_PER_DEVICE) {
      return NextResponse.json(
        {
          error:
            "Too many active reservations on this device. Complete or cancel one before reserving another.",
        },
        { status: 429 }
      );
    }
  } else {
    console.warn("[smart-buy][reserve] active-reservation guard skipped:", activeReservationsErr.message);
  }

  const { data: existingReservation, error: existingErr } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("item_id", itemId)
    .neq("status", "canceled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json(
      { error: "Failed to check reservation state" },
      { status: 500 }
    );
  }

  if (existingReservation) {
    const reservation = existingReservation as ReservationRow;
    if (reservation.status === "purchased" || isLegacyPurchasedLock(reservation)) {
      void logAuditEvent({
        eventType: AuditEventType.GUEST_RESERVED_CONFLICT,
        actorType: user ? "user" : "guest",
        actorId: user?.id ?? null,
        resourceType: "item",
        resourceId: itemId,
        metadata: { reason: "purchased_lock", source: "smart_buy" },
        ipAddress: getClientIP(req),
      });
      return NextResponse.json(
        { error: "Gift is already purchased" },
        { status: 409 }
      );
    }

    const isExpired = isReservationExpired(reservation, RESERVATION_DURATION_HOURS);
    const ownerHash = getReservationOwnerHash(reservation);
    const reservedUntilIso = getReservationExpiryIso(reservation, RESERVATION_DURATION_HOURS);

    if (!isExpired) {
      if (
        ownerHash &&
        ownerHash === tokenHash
      ) {
        return NextResponse.json({
          ok: true,
          reservation_id: reservation.id,
          status: "reserved",
          reserved_until: reservedUntilIso,
          already_reserved: true,
        });
      }

      if (!ownerHash && useLocalOwnershipFallback && hasFallbackReservation(tokenHash, itemId)) {
        return NextResponse.json({
          ok: true,
          reservation_id: reservation.id,
          status: "reserved",
          reserved_until: reservedUntilIso,
          already_reserved: true,
        });
      }

      void logAuditEvent({
        eventType: AuditEventType.GUEST_RESERVED_CONFLICT,
        actorType: user ? "user" : "guest",
        actorId: user?.id ?? null,
        resourceType: "item",
        resourceId: itemId,
        metadata: { reason: "active_reservation", source: "smart_buy" },
        ipAddress: getClientIP(req),
      });

      return NextResponse.json(
        {
          error: "Gift is already reserved",
          reserved_until: reservedUntilIso,
        },
        { status: 409 }
      );
    }

    const { error: expireErr } = await supabaseAdmin
      .from("reservations")
      .update({ status: "canceled", canceled_at: nowIso })
      .eq("id", existingReservation.id)
      .eq("status", "reserved");

    if (expireErr) {
      return NextResponse.json(
        { error: "Failed to release expired reservation" },
        { status: 500 }
      );
    }

    void logAuditEvent({
      eventType: AuditEventType.RESERVATION_EXPIRED,
      actorType: "system",
      actorId: null,
      resourceType: "reservation",
      resourceId: reservation.id,
      metadata: {
        item_id: itemId,
        source: "smart_buy",
      },
      ipAddress: getClientIP(req),
    });

    void logAuditEvent({
      eventType: AuditEventType.RESERVATION_CANCELED,
      actorType: "system",
      actorId: null,
      resourceType: "reservation",
      resourceId: existingReservation.id,
      metadata: {
        item_id: itemId,
        reason: "expired",
      },
      ipAddress: getClientIP(req),
    });
  }

  const cancelToken = crypto.randomBytes(24).toString("base64url");
  const cancelTokenHash = sha256(cancelToken);
  const reservedUntil = plusHours(RESERVATION_DURATION_HOURS);

  const reservationInsertAttempts: Array<Record<string, unknown>> = [
    {
      item_id: itemId,
      status: "reserved",
      cancel_token_hash: cancelTokenHash,
      reserved_at: nowIso,
      reserved_until: reservedUntil,
      reserved_by_token_hash: tokenHash,
      device_token_hash: tokenHash,
      affiliate_click_at: null,
    },
    {
      item_id: itemId,
      status: "reserved",
      cancel_token_hash: cancelTokenHash,
      reserved_until: reservedUntil,
      reserved_by_token_hash: tokenHash,
      device_token_hash: tokenHash,
    },
    {
      item_id: itemId,
      status: "reserved",
      cancel_token_hash: cancelTokenHash,
      device_token_hash: tokenHash,
    },
    {
      item_id: itemId,
      status: "reserved",
      cancel_token_hash: cancelTokenHash,
    },
  ];

  let created: ReservationRow | null = null;
  let createError: { message: string; code?: string } | null = null;
  for (const payload of reservationInsertAttempts) {
    const attempt = await supabaseAdmin
      .from("reservations")
      .insert(payload)
      .select("*")
      .single();

    if (!attempt.error && attempt.data) {
      created = attempt.data as ReservationRow;
      createError = null;
      break;
    }

    createError = attempt.error;
    if (!isMissingColumnError(attempt.error?.message)) {
      break;
    }

    useLocalOwnershipFallback = true;
  }

  if (createError || !created) {
    const { data: currentReservation } = await supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("item_id", itemId)
      .neq("status", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const current = (currentReservation ?? null) as ReservationRow | null;
    const isPurchased = current
      ? current.status === "purchased" || isLegacyPurchasedLock(current)
      : false;
    const currentReservedUntil = current
      ? getReservationExpiryIso(current, RESERVATION_DURATION_HOURS)
      : null;
    const hasActiveReservation = Boolean(current);
    const isConflictInsert = isReservationConflictInsertError(createError);

    if (!hasActiveReservation && !isConflictInsert) {
      return NextResponse.json(
        { error: "Failed to create reservation" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: isPurchased ? "Gift is already purchased" : "Gift is already reserved",
        reserved_until: currentReservedUntil,
      },
      { status: 409 }
    );
  }

  void logAuditEvent({
    eventType: AuditEventType.RESERVATION_CREATED,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "reservation",
    resourceId: created.id,
    metadata: {
      item_id: itemId,
      list_id: item.list_id,
      reservation_hours: RESERVATION_DURATION_HOURS,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  void logAuditEvent({
    eventType: AuditEventType.GUEST_RESERVED_SUCCESS,
    actorType: user ? "user" : "guest",
    actorId: user?.id ?? null,
    resourceType: "reservation",
    resourceId: created.id,
    metadata: {
      item_id: itemId,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  if (useLocalOwnershipFallback) {
    trackFallbackReservation(
      tokenHash,
      itemId,
      getReservationExpiryIso(created, RESERVATION_DURATION_HOURS) ?? reservedUntil,
      RESERVATION_DURATION_HOURS
    );
  }

  return NextResponse.json({
    ok: true,
    reservation_id: created.id,
    status: created.status,
    reserved_until:
      getReservationExpiryIso(created, RESERVATION_DURATION_HOURS) ?? reservedUntil,
    cancel_token: cancelToken,
  });
}
