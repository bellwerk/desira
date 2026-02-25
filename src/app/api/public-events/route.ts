import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditEventType, getClientIP, logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

const EventSchema = z
  .object({
    event_type: z.enum([
      AuditEventType.SHARED_LIST_VIEWED,
      AuditEventType.SHARED_ITEM_CONTRIBUTE_CLICKED,
      AuditEventType.SHARED_ITEM_RESERVE_CLICKED,
      AuditEventType.SHARED_CREATE_LIST_CTA_CLICKED,
    ]),
    list_id: z.string().uuid().optional(),
    item_id: z.string().uuid().optional(),
    hero_variant: z.enum(["a", "b"]).optional(),
    action_label_variant: z.enum(["a", "b"]).optional(),
    placement: z.enum(["header", "footer", "item_card"]).optional(),
  })
  .strict();

export async function POST(req: Request): Promise<NextResponse> {
  const json = await req.json().catch(() => null);
  const parsed = EventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { event_type, list_id, item_id, ...metadata } = parsed.data;

  const resourceType = item_id
    ? "item"
    : list_id
      ? "list"
      : undefined;
  const resourceId = item_id ?? list_id;

  await logAuditEvent({
    eventType: event_type,
    actorType: "guest",
    resourceType,
    resourceId,
    metadata,
    ipAddress: getClientIP(req),
  });

  return NextResponse.json({ ok: true });
}
