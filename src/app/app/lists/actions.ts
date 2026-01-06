"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  createNotificationsForUsers,
  getListMemberIdsExcept,
  NotificationType,
} from "@/lib/notifications";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

// --------------------------------------------------------------------------
// createList
// --------------------------------------------------------------------------
const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  recipient_type: z.enum(["person", "group"]).default("person"),
  visibility: z.enum(["unlisted", "private", "public"]).default("unlisted"),
  occasion: z.string().max(100).optional(),
  event_date: z.string().optional(),
  allow_reservations: z.boolean().default(true),
  allow_contributions: z.boolean().default(true),
  allow_anonymous: z.boolean().default(true),
});

export async function createList(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Ensure profile exists (fallback if trigger didn't create one)
  // Use admin client to bypass RLS for this check
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    // Generate a unique handle from email or user id
    const emailPrefix = user.email?.split("@")[0] ?? "";
    const handle = emailPrefix
      ? `${emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`
      : `user_${Date.now()}`;

    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        handle,
        display_name:
          user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
      });

    if (profileInsertError) {
      console.error("Failed to create profile:", profileInsertError);
      // Check if it's a duplicate key error (profile was created by trigger concurrently)
      if (profileInsertError.code === "23505") {
        // Profile exists, continue
      } else {
        return {
          success: false,
          error: `Failed to set up your account: ${profileInsertError.message}`,
        };
      }
    }
  }

  const raw = {
    title: formData.get("title"),
    recipient_type: formData.get("recipient_type") ?? "person",
    visibility: formData.get("visibility") ?? "unlisted",
    occasion: formData.get("occasion") || undefined,
    event_date: formData.get("event_date") || undefined,
    allow_reservations: formData.get("allow_reservations") === "true",
    allow_contributions: formData.get("allow_contributions") === "true",
    allow_anonymous: formData.get("allow_anonymous") === "true",
  };

  const parsed = createListSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      recipient_type: parsed.data.recipient_type,
      visibility: parsed.data.visibility,
      occasion: parsed.data.occasion ?? null,
      event_date: parsed.data.event_date ?? null,
      allow_reservations: parsed.data.allow_reservations,
      allow_contributions: parsed.data.allow_contributions,
      allow_anonymous: parsed.data.allow_anonymous,
      currency: "CAD",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  redirect(`/app/lists/${list.id}`);
}

// --------------------------------------------------------------------------
// addItem
// --------------------------------------------------------------------------
const addItemSchema = z.object({
  list_id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  product_url: z.string().url().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  price_cents: z.number().int().min(0).optional(),
  target_amount_cents: z.number().int().min(0).optional(),
  note_public: z.string().max(500).optional(),
  note_private: z.string().max(500).optional(),
});

export async function addItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const priceStr = formData.get("price") as string | null;
  const priceCents = priceStr ? Math.round(parseFloat(priceStr) * 100) : undefined;

  const raw = {
    list_id: formData.get("list_id"),
    title: formData.get("title"),
    product_url: formData.get("product_url") || undefined,
    image_url: formData.get("image_url") || undefined,
    price_cents: priceCents,
    target_amount_cents: priceCents, // default target = price
    note_public: formData.get("note_public") || undefined,
    note_private: formData.get("note_private") || undefined,
  };

  const parsed = addItemSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  // Verify user is an accepted member of the list (owner or member)
  // First, check list_members for membership
  const { data: membership } = await supabase
    .from("list_members")
    .select("id, role")
    .eq("list_id", parsed.data.list_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  // If not found in list_members, check if user is the list owner directly
  // (fallback in case the on_list_created trigger didn't run)
  if (!membership) {
    const { data: list, error: listErr } = await supabase
      .from("lists")
      .select("id")
      .eq("id", parsed.data.list_id)
      .eq("owner_id", user.id)
      .single();

    if (listErr || !list) {
      return { success: false, error: "List not found or you don't have permission" };
    }
  }

  // Get max sort_order
  const { data: maxSort } = await supabase
    .from("items")
    .select("sort_order")
    .eq("list_id", parsed.data.list_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((maxSort?.sort_order as number | null) ?? 0) + 1;

  const { data: insertedItem, error } = await supabase
    .from("items")
    .insert({
      list_id: parsed.data.list_id,
      title: parsed.data.title,
      product_url: parsed.data.product_url || null,
      image_url: parsed.data.image_url || null,
      price_cents: parsed.data.price_cents ?? null,
      target_amount_cents: parsed.data.target_amount_cents ?? null,
      note_public: parsed.data.note_public ?? null,
      note_private: parsed.data.note_private ?? null,
      status: "active",
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Notify other list members about the new item (fire-and-forget)
  void (async () => {
    const memberIds = await getListMemberIdsExcept(parsed.data.list_id, user.id);
    if (memberIds.length > 0) {
      await createNotificationsForUsers(memberIds, {
        type: NotificationType.ITEM_ADDED,
        title: "New wish added",
        body: `"${parsed.data.title}" was added to the list`,
        link: `/app/lists/${parsed.data.list_id}`,
        metadata: {
          list_id: parsed.data.list_id,
          item_id: insertedItem.id,
          item_title: parsed.data.title,
        },
      });
    }
  })();

  return { success: true };
}

// --------------------------------------------------------------------------
// deleteItem
// --------------------------------------------------------------------------
export async function deleteItem(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // First get the item to find its list_id
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("id, list_id")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return { success: false, error: "Item not found" };
  }

  // Verify user is an accepted member of the list (owner or member)
  const { data: membership } = await supabase
    .from("list_members")
    .select("id, role")
    .eq("list_id", item.list_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  // If not found in list_members, check if user is the list owner directly
  // (fallback in case the on_list_created trigger didn't run)
  if (!membership) {
    const { data: list, error: listErr } = await supabase
      .from("lists")
      .select("id")
      .eq("id", item.list_id)
      .eq("owner_id", user.id)
      .single();

    if (listErr || !list) {
      return { success: false, error: "You don't have permission to delete this item" };
    }
  }

  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// --------------------------------------------------------------------------
// updateList
// --------------------------------------------------------------------------
const updateListSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(100),
  recipient_type: z.enum(["person", "group"]),
  visibility: z.enum(["unlisted", "private", "public"]),
  occasion: z.string().max(100).optional(),
  event_date: z.string().optional(),
  allow_reservations: z.boolean(),
  allow_contributions: z.boolean(),
  allow_anonymous: z.boolean(),
});

export async function updateList(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const raw = {
    id: formData.get("id"),
    title: formData.get("title"),
    recipient_type: formData.get("recipient_type"),
    visibility: formData.get("visibility"),
    occasion: formData.get("occasion") || undefined,
    event_date: formData.get("event_date") || undefined,
    allow_reservations: formData.get("allow_reservations") === "true",
    allow_contributions: formData.get("allow_contributions") === "true",
    allow_anonymous: formData.get("allow_anonymous") === "true",
  };

  const parsed = updateListSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  // Verify user owns the list
  const { data: existingList, error: checkErr } = await supabase
    .from("lists")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .single();

  if (checkErr || !existingList) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  const { error } = await supabase
    .from("lists")
    .update({
      title: parsed.data.title,
      recipient_type: parsed.data.recipient_type,
      visibility: parsed.data.visibility,
      occasion: parsed.data.occasion ?? null,
      event_date: parsed.data.event_date ?? null,
      allow_reservations: parsed.data.allow_reservations,
      allow_contributions: parsed.data.allow_contributions,
      allow_anonymous: parsed.data.allow_anonymous,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// --------------------------------------------------------------------------
// deleteList
// --------------------------------------------------------------------------
export async function deleteList(listId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns the list
  const { data: list, error: checkErr } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("owner_id", user.id)
    .single();

  if (checkErr || !list) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  // Delete all items first (cascade might not be set up)
  await supabase.from("items").delete().eq("list_id", listId);

  // Delete the list
  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/app/lists");
}

// --------------------------------------------------------------------------
// generateInviteLink
// --------------------------------------------------------------------------
function generateSecureToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(24);
  for (let i = 0; i < 24; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

export async function generateInviteLink(listId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns the list
  const { data: list, error: checkErr } = await supabase
    .from("lists")
    .select("id, owner_id")
    .eq("id", listId)
    .eq("owner_id", user.id)
    .single();

  if (checkErr || !list) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  const inviteToken = generateSecureToken();

  // Create a pending invite record with null user_id (set when accepted)
  // Requires migration 004_nullable_invite_user.sql
  const { data: invite, error } = await supabase
    .from("list_members")
    .insert({
      list_id: listId,
      user_id: null, // Will be set when invite is accepted
      role: "member",
      status: "pending",
      invited_by: user.id,
      invite_token: inviteToken,
    })
    .select("id, invite_token")
    .single();

  if (error) {
    // If unique constraint error on invite_token (rare collision), retry
    if (error.code === "23505" && error.message?.includes("invite_token")) {
      return generateInviteLink(listId);
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: { inviteToken: invite.invite_token, inviteId: invite.id } };
}

// --------------------------------------------------------------------------
// listInvites
// --------------------------------------------------------------------------
export type InviteRecord = {
  id: string;
  invite_token: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

export async function listInvites(listId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns the list
  const { data: list, error: checkErr } = await supabase
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("owner_id", user.id)
    .single();

  if (checkErr || !list) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  const { data: invites, error } = await supabase
    .from("list_members")
    .select(`
      id,
      invite_token,
      status,
      created_at,
      user_id,
      profiles:user_id (display_name)
    `)
    .eq("list_id", listId)
    .neq("role", "owner")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: invites };
}

// --------------------------------------------------------------------------
// revokeInvite
// --------------------------------------------------------------------------
export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the invite and verify the user owns the list
  const { data: invite, error: inviteErr } = await supabase
    .from("list_members")
    .select(`
      id,
      list_id,
      lists!inner(owner_id)
    `)
    .eq("id", inviteId)
    .single();

  if (inviteErr || !invite) {
    return { success: false, error: "Invite not found" };
  }

  const listOwner = (invite.lists as unknown as { owner_id: string })?.owner_id;
  if (listOwner !== user.id) {
    return { success: false, error: "You don't have permission to revoke this invite" };
  }

  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("id", inviteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// --------------------------------------------------------------------------
// acceptInvite
// --------------------------------------------------------------------------
export async function acceptInvite(inviteToken: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Find the invite using admin client to bypass RLS.
  // Pending invites have user_id = null and the invitee cannot SELECT them.
  // The invite_token itself acts as the credential.
  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from("list_members")
    .select("id, list_id, status, user_id")
    .eq("invite_token", inviteToken)
    .single();

  if (inviteErr || !invite) {
    return { success: false, error: "Invalid or expired invite link" };
  }

  if (invite.status === "accepted") {
    // Check if it was already accepted by this user
    if (invite.user_id === user.id) {
      return { success: true, data: { listId: invite.list_id, alreadyMember: true } };
    }
    return { success: false, error: "This invite has already been used" };
  }

  // Check if user is already a member of this list
  const { data: existingMember } = await supabase
    .from("list_members")
    .select("id, status")
    .eq("list_id", invite.list_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (existingMember) {
    // User is already a member, delete the pending invite
    await supabase.from("list_members").delete().eq("id", invite.id);
    return { success: true, data: { listId: invite.list_id, alreadyMember: true } };
  }

  // Update the invite: set user_id to accepting user, status to accepted, clear token
  const { error } = await supabase
    .from("list_members")
    .update({
      user_id: user.id,
      status: "accepted",
      invite_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  if (error) {
    // Could be a unique constraint if user already has membership
    if (error.code === "23505") {
      return { success: false, error: "You are already a member of this list" };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: { listId: invite.list_id } };
}

// --------------------------------------------------------------------------
// getListMembers
// --------------------------------------------------------------------------
export type MemberRecord = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
};

export async function getListMembers(listId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is a member of the list
  const { data: membership, error: memberErr } = await supabase
    .from("list_members")
    .select("id, role")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (memberErr || !membership) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  const { data: members, error } = await supabase
    .from("list_members")
    .select(`
      id,
      user_id,
      role,
      status,
      created_at,
      profiles:user_id (display_name)
    `)
    .eq("list_id", listId)
    .eq("status", "accepted")
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: members };
}

// --------------------------------------------------------------------------
// removeMember
// --------------------------------------------------------------------------
export async function removeMember(memberId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the member record and verify the current user is an owner
  const { data: member, error: memberErr } = await supabase
    .from("list_members")
    .select(`
      id,
      list_id,
      user_id,
      role
    `)
    .eq("id", memberId)
    .single();

  if (memberErr || !member) {
    return { success: false, error: "Member not found" };
  }

  // Verify current user is an owner of the list
  const { data: currentMembership } = await supabase
    .from("list_members")
    .select("role")
    .eq("list_id", member.list_id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!currentMembership || currentMembership.role !== "owner") {
    return { success: false, error: "Only list owners can remove members" };
  }

  // Prevent removing the last owner
  if (member.role === "owner") {
    const { count } = await supabase
      .from("list_members")
      .select("id", { count: "exact", head: true })
      .eq("list_id", member.list_id)
      .eq("role", "owner")
      .eq("status", "accepted");

    if ((count ?? 0) <= 1) {
      return { success: false, error: "Cannot remove the last owner of a list" };
    }
  }

  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

