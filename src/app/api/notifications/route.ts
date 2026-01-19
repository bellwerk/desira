import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/notifications
 * Fetch current user's notifications (most recent first).
 * Query params:
 *   - limit: number (default 20, max 50)
 *   - unread_only: "1" to filter only unread
 */
export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const unreadOnly = url.searchParams.get("unread_only") === "1";

  let limit = 20;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 50);
    }
  }

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return NextResponse.json({
    ok: true,
    notifications,
    unread_count: unreadCount ?? 0,
  });
}

/**
 * PATCH /api/notifications
 * Mark notifications as read.
 * Body:
 *   - ids: string[] (specific notification IDs to mark as read)
 *   - all: boolean (mark all as read)
 */
export async function PATCH(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);

  if (!json) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (json.all === true) {
    // Mark all as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, marked_all: true });
  }

  if (Array.isArray(json.ids) && json.ids.length > 0) {
    // Mark specific IDs as read (RLS ensures user can only update their own)
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .in("id", json.ids)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, marked_ids: json.ids });
  }

  return NextResponse.json(
    { error: "Provide 'ids' array or 'all: true'" },
    { status: 400 }
  );
}






