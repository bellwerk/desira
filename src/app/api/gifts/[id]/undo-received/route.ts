import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
});

const UndoReceivedSchema = z
  .object({
    previousStatus: z.enum(["active", "funded", "archived"]).optional(),
  })
  .passthrough();
const OWNER_RECEIVED_UNDO_WINDOW_MS = 12_000;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ItemRow = {
  id: string;
  list_id: string;
  status: string;
  received_at?: string | null;
  target_amount_cents?: number | null;
  price_cents?: number | null;
};

function isMissingColumnError(errorMessage: string | undefined): boolean {
  const message = (errorMessage ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
}

export async function POST(req: Request, context: RouteContext): Promise<NextResponse> {
  const routeParams = RouteParamsSchema.safeParse(await context.params);
  if (!routeParams.success) {
    return NextResponse.json({ error: "Invalid gift ID" }, { status: 400 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = UndoReceivedSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const itemId = routeParams.data.id;
  const requestedPreviousStatus = parsed.data.previousStatus;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const primaryItem = await supabaseAdmin
    .from("items")
    .select("id,list_id,status,received_at,target_amount_cents,price_cents")
    .eq("id", itemId)
    .single();

  let item = primaryItem.data as ItemRow | null;
  let itemErr = primaryItem.error;
  let canEnforceUndoWindow = true;

  if (itemErr && isMissingColumnError(itemErr.message)) {
    const fallbackItem = await supabaseAdmin
      .from("items")
      .select("id,list_id,status,target_amount_cents,price_cents")
      .eq("id", itemId)
      .single();
    item = fallbackItem.data as ItemRow | null;
    itemErr = fallbackItem.error;
    canEnforceUndoWindow = false;
  }

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
      { error: "Only list owners can undo received state" },
      { status: 403 }
    );
  }

  const isLegacyArchivedUndo = !canEnforceUndoWindow && item.status === "archived";
  if (item.status !== "received" && !isLegacyArchivedUndo) {
    return NextResponse.json({ error: "Item is not currently marked as received" }, { status: 409 });
  }

  if (canEnforceUndoWindow) {
    if (!item.received_at) {
      return NextResponse.json(
        { error: "Undo window has expired" },
        { status: 409 }
      );
    }

    const receivedAtMs = new Date(item.received_at).getTime();
    if (Number.isNaN(receivedAtMs)) {
      return NextResponse.json(
        { error: "Undo window has expired" },
        { status: 409 }
      );
    }

    if (Date.now() - receivedAtMs > OWNER_RECEIVED_UNDO_WINDOW_MS) {
      return NextResponse.json(
        { error: "Undo window has expired" },
        { status: 409 }
      );
    }
  }

  const targetCents = item.target_amount_cents ?? item.price_cents ?? 0;
  let restoredStatus: "active" | "funded" = "active";

  if (targetCents > 0) {
    const { data: contributions, error: contributionsErr } = await supabaseAdmin
      .from("contributions")
      .select("amount_cents")
      .eq("item_id", item.id)
      .eq("payment_status", "succeeded");

    if (contributionsErr) {
      return NextResponse.json(
        { error: "Failed to evaluate funding state for undo" },
        { status: 500 }
      );
    }

    const fundedCents = (contributions ?? []).reduce(
      (sum, contribution) => sum + (contribution.amount_cents ?? 0),
      0
    );

    if (fundedCents >= targetCents) {
      restoredStatus = "funded";
    }
  }

  if (isLegacyArchivedUndo && requestedPreviousStatus) {
    restoredStatus = requestedPreviousStatus === "funded" ? "funded" : "active";
  }

  const primaryUpdate = await supabaseAdmin
    .from("items")
    .update({
      status: restoredStatus,
      received_at: null,
      received_by_owner_id: null,
    })
    .eq("id", item.id)
    .select("id,status")
    .single();

  let updatedItem = primaryUpdate.data as { id: string; status: string } | null;
  let updateErr = primaryUpdate.error;

  if (updateErr && isMissingColumnError(updateErr.message)) {
    const fallbackUpdate = await supabaseAdmin
      .from("items")
      .update({ status: restoredStatus })
      .eq("id", item.id)
      .select("id,status")
      .single();
    updatedItem = fallbackUpdate.data as { id: string; status: string } | null;
    updateErr = fallbackUpdate.error;
  }

  if (updateErr || !updatedItem) {
    return NextResponse.json(
      { error: "Failed to undo received state" },
      { status: 500 }
    );
  }

  void logAuditEvent({
    eventType: AuditEventType.OWNER_UNDO_RECEIVED,
    actorType: "user",
    actorId: user.id,
    resourceType: "item",
    resourceId: item.id,
    metadata: {
      list_id: item.list_id,
      previous_status: item.status,
      restored_status: restoredStatus,
      undo_window_enforced: canEnforceUndoWindow,
      source: "smart_buy",
    },
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({
    ok: true,
    item: updatedItem,
  });
}
