import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";
import { trackServerError } from "@/lib/error-tracking";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isMissingColumnError(errorMessage: string | undefined, column: string): boolean {
  const message = (errorMessage ?? "").toLowerCase();
  return (
    message.includes(column.toLowerCase()) &&
    (message.includes("does not exist") || message.includes("could not find"))
  );
}

export async function POST(req: Request, context: RouteContext): Promise<NextResponse> {
  const routeParams = RouteParamsSchema.safeParse(await context.params);
  if (!routeParams.success) {
    return NextResponse.json({ error: "Invalid gift ID" }, { status: 400 });
  }

  const itemId = routeParams.data.id;
  const nowIso = new Date().toISOString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id,list_id,status")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id,owner_id")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  if (list.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only list owners can mark items as received" },
      { status: 403 }
    );
  }

  const primaryUpdate = await supabaseAdmin
    .from("items")
    .update({
      status: "received",
      received_at: nowIso,
      received_by_owner_id: user.id,
    })
    .eq("id", item.id)
    .select("id,status,received_at")
    .single();

  let updatedItem = primaryUpdate.data as
    | { id: string; status: string; received_at?: string | null }
    | null;
  let updateItemErr = primaryUpdate.error;
  let usedLegacyArchivedFallback = false;

  if (
    updateItemErr &&
    (
      isMissingColumnError(updateItemErr.message, "received_at") ||
      isMissingColumnError(updateItemErr.message, "received_by_owner_id")
    )
  ) {
    const fallbackUpdate = await supabaseAdmin
      .from("items")
      .update({ status: "received" })
      .eq("id", item.id)
      .select("id,status")
      .single();
    updatedItem = fallbackUpdate.data as { id: string; status: string; received_at?: string | null } | null;
    updateItemErr = fallbackUpdate.error;
  }

  if (
    updateItemErr &&
    updateItemErr.message.toLowerCase().includes("invalid input value for enum") &&
    updateItemErr.message.toLowerCase().includes("received")
  ) {
    const legacyUpdate = await supabaseAdmin
      .from("items")
      .update({ status: "archived" })
      .eq("id", item.id)
      .select("id,status")
      .single();
    updatedItem = legacyUpdate.data as { id: string; status: string; received_at?: string | null } | null;
    updateItemErr = legacyUpdate.error;
    usedLegacyArchivedFallback = Boolean(legacyUpdate.data);
  }

  if (updateItemErr || !updatedItem) {
    return NextResponse.json(
      { error: "Failed to mark item as received" },
      { status: 500 }
    );
  }

  const { data: overriddenReservations } = await supabaseAdmin
    .from("reservations")
    .select("id,status")
    .eq("item_id", item.id)
    .neq("status", "canceled");

  let cleanupFailed = false;
  let { error: cleanupReservationsErr } = await supabaseAdmin
    .from("reservations")
    .update({
      status: "canceled",
      canceled_at: nowIso,
    })
    .eq("item_id", item.id)
    .neq("status", "canceled");

  if (cleanupReservationsErr) {
    const retryCleanup = await supabaseAdmin
      .from("reservations")
      .update({
        status: "canceled",
        canceled_at: nowIso,
      })
      .eq("item_id", item.id)
      .neq("status", "canceled");
    cleanupReservationsErr = retryCleanup.error;
    cleanupFailed = Boolean(cleanupReservationsErr);
  }

  if (cleanupFailed && cleanupReservationsErr) {
    void trackServerError(new Error(cleanupReservationsErr.message), {
      scope: "api.gifts.mark-received.reservation-cleanup",
      metadata: {
        item_id: item.id,
        list_id: item.list_id,
      },
    });
  }

  void logAuditEvent({
    eventType: AuditEventType.OWNER_MARK_RECEIVED,
    actorType: "user",
    actorId: user.id,
    resourceType: "item",
    resourceId: item.id,
    metadata: {
      list_id: item.list_id,
      previous_status: item.status,
      overridden_reservations: overriddenReservations?.map((reservation) => reservation.id) ?? [],
      stored_status: updatedItem.status,
      legacy_fallback: usedLegacyArchivedFallback,
      reservation_cleanup_failed: cleanupFailed,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...updatedItem,
      status: "received",
      received_at: updatedItem.received_at ?? nowIso,
    },
    overridden_reservations: overriddenReservations?.length ?? 0,
    reservation_cleanup_failed: cleanupFailed,
  });
}
