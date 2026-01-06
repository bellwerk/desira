import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Notification types for consistent usage across the app.
 */
export const NotificationType = {
  ITEM_ADDED: "item.added",
  ITEM_RESERVED: "item.reserved",
  CONTRIBUTION_RECEIVED: "contribution.received",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user.
 *
 * This is fire-and-forget; errors are logged but don't throw.
 * Call from API routes/actions after successful operations.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const { userId, type, title, body, link, metadata = {} } = params;

  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
      metadata,
    });

    if (error) {
      console.error(
        "[notifications] Failed to create notification:",
        type,
        error.message
      );
    }
  } catch (err) {
    console.error("[notifications] Exception creating notification:", type, err);
  }
}

/**
 * Create notifications for multiple users (batch).
 *
 * Useful for notifying all list members about an event.
 */
export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  if (userIds.length === 0) return;

  const { type, title, body, link, metadata = {} } = params;

  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
      metadata,
    }));

    const { error } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error(
        "[notifications] Failed to create batch notifications:",
        type,
        error.message
      );
    }
  } catch (err) {
    console.error(
      "[notifications] Exception creating batch notifications:",
      type,
      err
    );
  }
}

/**
 * Get list members who should receive notifications (excludes the actor).
 *
 * Returns user IDs of all accepted members except the one performing the action.
 */
export async function getListMemberIdsExcept(
  listId: string,
  excludeUserId?: string | null
): Promise<string[]> {
  const { data: members, error } = await supabaseAdmin
    .from("list_members")
    .select("user_id")
    .eq("list_id", listId)
    .eq("status", "accepted")
    .not("user_id", "is", null);

  if (error || !members) {
    console.error(
      "[notifications] Failed to get list members:",
      error?.message
    );
    return [];
  }

  return members
    .map((m) => m.user_id as string)
    .filter((id) => id !== excludeUserId);
}

/**
 * Get the list owner's user ID.
 */
export async function getListOwnerId(
  listId: string
): Promise<string | null> {
  const { data: list, error } = await supabaseAdmin
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (error || !list) {
    console.error("[notifications] Failed to get list owner:", error?.message);
    return null;
  }

  return list.owner_id;
}



