"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CreateListSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  recipient_type: z.enum(["person", "group"]),
  visibility: z.enum(["private", "unlisted", "public"]),
  occasion: z.string().max(100).optional(),
  event_date: z.string().optional(),
  allow_reservations: z.boolean(),
  allow_contributions: z.boolean(),
  allow_anonymous: z.boolean(),
});

export type CreateListInput = z.infer<typeof CreateListSchema>;

export interface ActionResult {
  success: boolean;
  error?: string;
  listId?: string;
}

export async function createList(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Parse and validate input
  const rawInput = {
    title: formData.get("title"),
    recipient_type: formData.get("recipient_type"),
    visibility: formData.get("visibility"),
    occasion: formData.get("occasion") || undefined,
    event_date: formData.get("event_date") || undefined,
    allow_reservations: formData.get("allow_reservations") === "true",
    allow_contributions: formData.get("allow_contributions") === "true",
    allow_anonymous: formData.get("allow_anonymous") === "true",
  };

  const parsed = CreateListSchema.safeParse(rawInput);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message ?? "Invalid input" };
  }

  const input = parsed.data;

  // Insert list
  const { data: list, error } = await supabase
    .from("lists")
    .insert({
      owner_id: user.id,
      title: input.title,
      recipient_type: input.recipient_type,
      visibility: input.visibility,
      occasion: input.occasion || null,
      event_date: input.event_date || null,
      allow_reservations: input.allow_reservations,
      allow_contributions: input.allow_contributions,
      allow_anonymous: input.allow_anonymous,
      currency: "CAD", // Default for MVP
    })
    .select("id")
    .single();

  if (error || !list) {
    console.error("Failed to create list:", error);
    return { success: false, error: "Failed to create list. Please try again." };
  }

  // Redirect to the new list
  redirect(`/app/lists/${list.id}`);
}

// ========================
// Item (Wish) Actions
// ========================

const CreateItemSchema = z.object({
  list_id: z.string().uuid("Invalid list ID"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  product_url: z.string().url("Invalid URL").max(2000).optional().or(z.literal("")),
  image_url: z.string().url("Invalid image URL").max(2000).optional().or(z.literal("")),
  price_cents: z.number().int().min(0).max(10_000_000).optional(), // max $100k
  target_amount_cents: z.number().int().min(0).max(10_000_000).optional(),
  note_public: z.string().max(500).optional(),
  note_private: z.string().max(500).optional(),
  merchant: z.string().max(100).optional(),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export interface ItemActionResult {
  success: boolean;
  error?: string;
  itemId?: string;
}

export async function createItem(formData: FormData): Promise<ItemActionResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const listId = formData.get("list_id") as string;

  // Verify user owns this list
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id, owner_id")
    .eq("id", listId)
    .eq("owner_id", user.id)
    .single();

  if (listError || !list) {
    return { success: false, error: "List not found or you don't have permission" };
  }

  // Parse price (convert dollars to cents)
  // Use explicit NaN check to allow 0 as a valid price
  const priceStr = formData.get("price") as string;
  const priceDollars = priceStr !== "" && priceStr !== null ? parseFloat(priceStr) : undefined;
  const priceCents = priceDollars !== undefined && !Number.isNaN(priceDollars)
    ? Math.round(priceDollars * 100)
    : undefined;

  // Parse and validate input
  const rawInput = {
    list_id: listId,
    title: formData.get("title"),
    product_url: formData.get("product_url") || undefined,
    image_url: formData.get("image_url") || undefined,
    price_cents: priceCents,
    target_amount_cents: priceCents, // Default target = price for MVP
    note_public: formData.get("note_public") || undefined,
    note_private: formData.get("note_private") || undefined,
    merchant: formData.get("merchant") || undefined,
  };

  const parsed = CreateItemSchema.safeParse(rawInput);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message ?? "Invalid input" };
  }

  const input = parsed.data;

  // Get max sort_order for this list
  const { data: maxOrderResult } = await supabase
    .from("items")
    .select("sort_order")
    .eq("list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrderResult?.sort_order ?? 0) + 1;

  // Insert item
  const { data: item, error } = await supabase
    .from("items")
    .insert({
      list_id: input.list_id,
      title: input.title,
      product_url: input.product_url || null,
      image_url: input.image_url || null,
      price_cents: input.price_cents ?? null,
      target_amount_cents: input.target_amount_cents ?? null,
      note_public: input.note_public || null,
      note_private: input.note_private || null,
      merchant: input.merchant || null,
      status: "active",
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error || !item) {
    console.error("Failed to create item:", error);
    return { success: false, error: "Failed to add item. Please try again." };
  }

  // Revalidate the list page
  revalidatePath(`/app/lists/${listId}`);

  return { success: true, itemId: item.id };
}

export async function deleteItem(formData: FormData): Promise<ItemActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const itemId = formData.get("item_id") as string;
  const listId = formData.get("list_id") as string;

  if (!itemId || !listId) {
    return { success: false, error: "Missing item or list ID" };
  }

  // Verify item exists and user owns the list
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id, list_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { success: false, error: "Item not found" };
  }

  // Verify user owns the list
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id, owner_id")
    .eq("id", item.list_id)
    .eq("owner_id", user.id)
    .single();

  if (listError || !list) {
    return { success: false, error: "You don't have permission to delete this item" };
  }

  // Delete the item
  const { error: deleteError } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);

  if (deleteError) {
    console.error("Failed to delete item:", deleteError);
    return { success: false, error: "Failed to delete item" };
  }

  revalidatePath(`/app/lists/${listId}`);

  return { success: true };
}

