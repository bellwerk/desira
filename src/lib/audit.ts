import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Audit event types for consistent logging.
 */
export const AuditEventType = {
  // List events
  LIST_CREATED: "list.created",
  LIST_UPDATED: "list.updated",
  LIST_DELETED: "list.deleted",

  // Item events
  ITEM_CREATED: "item.created",
  ITEM_UPDATED: "item.updated",
  ITEM_DELETED: "item.deleted",

  // Reservation events
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_CANCELED: "reservation.canceled",

  // Contribution events
  CONTRIBUTION_CREATED: "contribution.created",
  CONTRIBUTION_SUCCEEDED: "contribution.succeeded",
  CONTRIBUTION_FAILED: "contribution.failed",

  // Invite events
  INVITE_CREATED: "invite.created",
  INVITE_ACCEPTED: "invite.accepted",

  // Auth events
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
} as const;

export type AuditEventType = (typeof AuditEventType)[keyof typeof AuditEventType];

export type ActorType = "user" | "guest" | "system" | "webhook";

export interface AuditLogParams {
  eventType: AuditEventType;
  actorId?: string | null;
  actorType?: ActorType;
  resourceType?: "list" | "item" | "reservation" | "contribution" | "invite";
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Log an audit event.
 * 
 * This is fire-and-forget; errors are logged but don't throw.
 * Call from API routes after successful operations.
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const {
    eventType,
    actorId = null,
    actorType = actorId ? "user" : "guest",
    resourceType,
    resourceId,
    metadata = {},
    ipAddress = null,
  } = params;

  try {
    const { error } = await supabaseAdmin.from("audit_events").insert({
      event_type: eventType,
      actor_id: actorId,
      actor_type: actorType,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: ipAddress,
    });

    if (error) {
      // Log but don't throw - audit failures shouldn't break the app
      console.error("[audit] Failed to log event:", eventType, error.message);
    }
  } catch (err) {
    console.error("[audit] Exception logging event:", eventType, err);
  }
}

/**
 * Extract IP address from request headers.
 * Returns the client IP, preferring forwarded headers.
 */
export function getClientIP(req: Request): string | null {
  // Check standard headers (in order of preference)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (client) IP
    return forwarded.split(",")[0].trim();
  }

  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // No client IP available
  return null;
}



