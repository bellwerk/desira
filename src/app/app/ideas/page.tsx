import { createClient } from "@/lib/supabase/server";
import { getRecentPublicIdeas } from "@/lib/ideas/server";
import { GiftFinderClient } from "@/components/ideas/GiftFinderClient";
import type { UserListOption } from "@/components/ideas/ListPickerModal";
import { parseIdeaCategoryFilter } from "@/lib/ideas/types";

export const dynamic = "force-dynamic";

type ListRow = {
  id: string;
  title: string;
  visibility: "private" | "unlisted" | "public";
  created_at: string;
};

function normalizeVisibility(value: string): "private" | "unlisted" | "public" {
  if (value === "private" || value === "public") {
    return value;
  }
  return "unlisted";
}

type AppIdeasPageProps = {
  searchParams: Promise<{ category?: string; suggestion?: string; suggestion_id?: string }>;
};

export default async function AppIdeasPage({
  searchParams,
}: AppIdeasPageProps): Promise<React.ReactElement> {
  const { category, suggestion, suggestion_id } = await searchParams;
  const [ideas, supabase] = await Promise.all([getRecentPublicIdeas(), createClient()]);
  const initialCategory = parseIdeaCategoryFilter(category);
  const initialSuggestion = typeof suggestion === "string" ? suggestion.trim() : "";
  const initialSuggestionId = typeof suggestion_id === "string" ? suggestion_id.trim() : "";

  const { data: listsData, error } = await supabase
    .from("lists")
    .select("id,title,visibility,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AppIdeasPage] Failed to load lists:", error.message, error.code);
  }

  const lists = ((listsData ?? []) as ListRow[]).map<UserListOption>((list) => ({
    id: list.id,
    title: list.title,
    visibility: normalizeVisibility(list.visibility),
  }));

  return (
    <GiftFinderClient
      ideas={ideas}
      mode="app"
      userLists={lists}
      initialDisplayCount={24}
      initialCategory={initialCategory}
      initialSuggestion={initialSuggestion}
      initialSuggestionId={initialSuggestionId}
    />
  );
}

