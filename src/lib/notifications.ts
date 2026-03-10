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

const RESEND_SEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

function getNotificationFromEmail(): string | null {
  const configured = process.env.NOTIFICATION_FROM_EMAIL?.trim();
  return configured ? configured : null;
}

function getSiteOrigin(): string | null {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    null;

  if (!base) {
    return null;
  }

  return base.replace(/\/+$/, "");
}

function toAbsoluteLink(link: string | undefined): string | null {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return link;
  if (!link.startsWith("/")) return null;

  const origin = getSiteOrigin();
  return origin ? `${origin}${link}` : null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) {
      console.error("[notifications] Failed to fetch user for email:", error.message);
      return null;
    }

    return data.user?.email ?? null;
  } catch (err) {
    console.error("[notifications] Exception fetching user for email:", err);
    return null;
  }
}

async function sendNotificationEmail(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getNotificationFromEmail();

  if (!apiKey || !from) {
    return;
  }

  const recipientEmail = await getUserEmail(params.userId);
  if (!recipientEmail) {
    return;
  }

  const absoluteLink = toAbsoluteLink(params.link);
  const safeBody = params.body?.trim() ?? "";
  const safeTitle = params.title.trim();
  const escapedTitle = escapeHtml(safeTitle);
  const escapedBody = safeBody ? escapeHtml(safeBody) : "";
  const escapedLink = absoluteLink ? escapeHtml(absoluteLink) : null;

  const text = [safeTitle, safeBody, absoluteLink].filter(Boolean).join("\n\n");
  const htmlParts = [
    `<h2>${escapedTitle}</h2>`,
    escapedBody ? `<p>${escapedBody}</p>` : "",
    escapedLink ? `<p><a href="${escapedLink}">Open in Desira</a></p>` : "",
  ].filter(Boolean);

  try {
    const response = await fetch(RESEND_SEND_EMAILS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [recipientEmail],
        subject: `[Desira] ${safeTitle}`,
        text,
        html: htmlParts.join(""),
        tags: [
          { name: "channel", value: "notification" },
          { name: "notification_type", value: params.type },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(
        "[notifications] Failed to send email notification:",
        response.status,
        response.statusText,
        details
      );
    }
  } catch (err) {
    console.error("[notifications] Exception sending email notification:", err);
  }
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
      return;
    }

    // Email fan-out is best-effort and must never block notification creation.
    await sendNotificationEmail({ userId, type, title, body, link });
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
      return;
    }

    // Email fan-out is best-effort and does not affect DB notification writes.
    const emailJobs = userIds.map((userId) =>
      sendNotificationEmail({ userId, type, title, body, link })
    );
    await Promise.allSettled(emailJobs);
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



