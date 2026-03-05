import type { SupabaseClient } from "@supabase/supabase-js";

export async function userHasAnyLists(
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
    console.error("[userHasAnyLists] Owned list lookup failed:", error.message, error.code);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
