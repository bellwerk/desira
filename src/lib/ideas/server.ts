import { tryGetSupabaseAdmin } from "@/lib/supabase/admin";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { inferIdeaCategory } from "./categorize";
import type { IdeaSuggestion } from "./types";

const DEFAULT_POOL_SIZE = 96;

type PublicIdeaRow = {
  id: string;
  title: string;
  image_url: string | null;
  price_cents: number | null;
  currency: string | null;
  note_public: string | null;
  status: string;
  created_at: string;
  lists: { visibility: string; currency: string | null } | { visibility: string; currency: string | null }[] | null;
};

type GetRecentPublicIdeasOptions = {
  poolSize?: number;
};

export async function getRecentPublicIdeas(
  options: GetRecentPublicIdeasOptions = {}
): Promise<IdeaSuggestion[]> {
  const poolSize = options.poolSize ?? DEFAULT_POOL_SIZE;
  const supabase = tryGetSupabaseAdmin();

  if (!supabase && !isSupabaseConfigured()) {
    return [];
  }

  const queryClient = supabase ?? createPublicClient();

  const { data, error } = await queryClient
    .from("items")
    .select(
      "id,title,image_url,price_cents,note_public,status,created_at,lists!inner(visibility,currency)"
    )
    .eq("lists.visibility", "public")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(poolSize);

  if (error) {
    console.error("[getRecentPublicIdeas] Failed to load ideas:", error.message, error.code);
    return [];
  }

  const rows = (data ?? []) as PublicIdeaRow[];
  return rows
    .filter((row) => typeof row.title === "string" && row.title.trim().length > 0)
    .map((row) => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      priceCents: row.price_cents,
      currency: Array.isArray(row.lists) ? (row.lists[0]?.currency ?? null) : (row.lists?.currency ?? null),
      notePublic: row.note_public,
      category: inferIdeaCategory(row.title, row.note_public),
    }));
}

