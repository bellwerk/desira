import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Owner-scoped list existence check.
 * Safe to use with elevated/service-role clients because it always filters by owner_id.
 */
export async function userOwnsAnyLists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("lists")
    .select("id")
    .eq("owner_id", userId)
    .limit(1);

  if (error) {
    console.error("[userOwnsAnyLists] Owner-scoped list lookup failed:", error.message, error.code);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Backward-compatible alias retained for existing auth/login callers.
 */
export async function userHasAnyLists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return userOwnsAnyLists(supabase, userId);
}
