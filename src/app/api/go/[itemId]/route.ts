import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateAffiliateUrl, isSkimlinksEnabled } from "@/lib/affiliate";
import { logAuditEvent, type AuditEventType } from "@/lib/audit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

/**
 * GET /api/go/[itemId]?token=...
 *
 * Redirect route for product links with affiliate monetization.
 * - Validates access based on list visibility:
 *   - public: anyone can access
 *   - unlisted: requires valid share token in query param
 *   - private: requires authenticated list member
 * - Wraps URL with Skimlinks affiliate URL (if configured)
 * - Logs click event for analytics
 * - Redirects user to the (affiliate-wrapped) product URL
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { itemId } = await context.params;
  const tokenParam = req.nextUrl.searchParams.get("token");

  // Validate itemId format (UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(itemId)) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  // Fetch item with product_url
  const { data: item, error: itemErr } = await supabaseAdmin
    .from("items")
    .select("id, product_url, list_id")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (!item.product_url) {
    return NextResponse.json(
      { error: "This item has no product link" },
      { status: 404 }
    );
  }

  // Fetch list to validate visibility and access
  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select("id, share_token, visibility, owner_id")
    .eq("id", item.list_id)
    .single();

  if (listErr || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const visibility = (list.visibility ?? "unlisted") as
    | "public"
    | "unlisted"
    | "private";

  // Validate access based on visibility
  let hasAccess = false;

  // Helper to check if current user is the list owner or an authenticated list member
  const checkOwnerOrMembership = async (): Promise<boolean> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Check if user is the list owner
    if (user.id === list.owner_id) return true;

    // Check if user is an accepted list member
    const { data: membership } = await supabaseAdmin
      .from("list_members")
      .select("id")
      .eq("list_id", item.list_id)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();

    return !!membership;
  };

  if (visibility === "public") {
    // Public lists: anyone can access
    hasAccess = true;
  } else if (visibility === "unlisted") {
    // Unlisted lists: valid share token OR list owner OR authenticated list member
    if (tokenParam === list.share_token) {
      hasAccess = true;
    } else {
      // Fallback: check if user is owner or authenticated member
      hasAccess = await checkOwnerOrMembership();
    }
  } else if (visibility === "private") {
    // Private lists: require list owner or authenticated list member
    hasAccess = await checkOwnerOrMembership();
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  // Build custom tracking param: only item ID (do NOT include share token
  // as it would leak sensitive access tokens to third-party affiliates)
  const xcust = itemId;

  // Generate affiliate URL (or pass through if Skimlinks not configured)
  const affiliateUrl = generateAffiliateUrl(item.product_url, xcust);

  // Log click event for analytics (do NOT log share_token to avoid leaking it)
  await logAuditEvent({
    eventType: "product_link.click" as AuditEventType,
    actorType: "guest",
    actorId: null,
    resourceType: "item",
    resourceId: itemId,
    metadata: {
      original_url: item.product_url,
      affiliate_enabled: isSkimlinksEnabled(),
      list_id: item.list_id,
    },
  }).catch(() => {
    // Don't block redirect if audit logging fails
  });

  // Redirect to affiliate URL
  return NextResponse.redirect(affiliateUrl, 302);
}

