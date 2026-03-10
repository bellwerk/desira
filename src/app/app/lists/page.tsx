import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PopularGiftIdeas } from "@/components/PopularGiftIdeas";
import { ListCardWrapper } from "./ListCardWrapper";
import { ShareProfileButton } from "./ShareProfileButton";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

interface ListRow {
  id: string;
  title: string;
  recipient_type: string;
  visibility: string;
  occasion: string | null;
  event_date: string | null;
  share_token: string;
  created_at: string;
  owner_id: string;
  allow_reservations: boolean;
  allow_contributions: boolean;
  allow_anonymous: boolean;
}

interface ItemRow {
  id: string;
  list_id: string;
  image_url: string | null;
  status: string;
}

interface ListsPageProps {
  searchParams: Promise<{
    q?: string;
    scope?: string;
  }>;
}

export default async function ListsPage({
  searchParams,
}: ListsPageProps): Promise<React.ReactElement> {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          Please sign in to view your lists.
        </p>
      </div>
    );
  }

  // RLS returns all lists where user is an accepted member (includes owned lists)
  const { data: lists, error } = await supabase
    .from("lists")
    .select(
      "id, title, recipient_type, visibility, occasion, event_date, share_token, created_at, owner_id, allow_reservations, allow_contributions, allow_anonymous"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <GlassCard className="border-red-200/50 dark:border-red-800/50">
        <h2 className="font-semibold text-red-800 dark:text-red-200">
          Error loading lists
        </h2>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      </GlassCard>
    );
  }

  const typedLists = (lists ?? []) as ListRow[];
  const ownedLists = typedLists.filter((list) => list.owner_id === user.id);
  const sharedLists = typedLists.filter((list) => list.owner_id !== user.id);
  const hasManyLists = typedLists.length >= 6;
  const rawQuery =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const query = rawQuery.trim().toLowerCase();
  const scope =
    resolvedSearchParams.scope === "owned" || resolvedSearchParams.scope === "shared"
      ? resolvedSearchParams.scope
      : "all";

  const matchesQuery = (list: ListRow): boolean => {
    if (!query) return true;
    const title = list.title.toLowerCase();
    const occasion = list.occasion?.toLowerCase() ?? "";
    return title.includes(query) || occasion.includes(query);
  };

  const visibleOwnedLists =
    scope === "shared" ? [] : ownedLists.filter(matchesQuery);
  const visibleSharedLists =
    scope === "owned" ? [] : sharedLists.filter(matchesQuery);
  const visibleListCount = visibleOwnedLists.length + visibleSharedLists.length;

  // Fetch items for all lists to display thumbnails and stats
  const listIds = typedLists.map((l) => l.id);
  let items: ItemRow[] = [];
  if (listIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, list_id, image_url, status")
      .in("list_id", listIds);
    items = (itemsData ?? []) as ItemRow[];
  }

  // Group items by list
  const itemsByList: Record<string, ItemRow[]> = {};
  for (const item of items) {
    if (!itemsByList[item.list_id]) {
      itemsByList[item.list_id] = [];
    }
    itemsByList[item.list_id].push(item);
  }

  return (
    <div className="flex flex-col items-center pt-6 sm:pt-10">
      <PageHeader
        title="Great surprises won&apos;t create themselves!"
        align="center"
        className="mb-6 w-full max-w-[1100px] px-0 sm:mb-8 sm:px-4"
      />

      {/* Action bar */}
      <div className="mb-6 flex w-full max-w-[1100px] flex-col items-stretch gap-3 px-0 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {/* Left: Add New WishList */}
        <Link
          href="/app/lists/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#D4D7C2] px-5 text-sm font-medium text-[#2b2b2b] shadow-sm transition-all hover:bg-[#c8cbb6] hover:shadow-md active:scale-[0.98] sm:w-auto sm:justify-start"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New WishList
        </Link>

        {/* Right: Edit and Share Your Profile */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3">
          <Link
            href="/app/settings"
            className="inline-flex h-11 items-center rounded-full border border-[#2b2b2b]/20 bg-white/50 px-5 text-sm font-medium text-[#2b2b2b] transition-all hover:bg-white/80 active:scale-[0.98]"
          >
            Edit
          </Link>
          {/* Only show profile share if user has at least one public/unlisted list */}
          {(() => {
            const shareableList = typedLists.find(
              (l) => l.visibility === "public" || l.visibility === "unlisted"
            );
            return shareableList ? (
              <ShareProfileButton
                shareToken={shareableList.share_token}
                userName={user.email?.split("@")[0] || "My Profile"}
              />
            ) : null;
          })()}
        </div>
      </div>

      {/* Lists or Empty State */}
      {typedLists.length === 0 ? (
        <>
          <EmptyState
            className="w-full max-w-[940px]"
            title="Only you know what you want!"
            action={(
              <Link
                href="/app/lists/new"
                className="inline-block rounded-full bg-[#D4D7C2] px-7 py-3.5 text-lg font-semibold text-[#2b2b2f] shadow-sm transition-all hover:bg-[#c8cbb6] hover:shadow-md active:scale-[0.98]"
                style={{ fontFamily: "Urbanist" }}
              >
                Create your first wishlist
              </Link>
            )}
          />

          {/* Popular Gift Ideas Section */}
          <div className="mt-6 w-full flex justify-center">
            <PopularGiftIdeas />
          </div>
        </>
      ) : (
        <div className="w-full max-w-[1100px] space-y-7 font-[family-name:var(--font-urbanist)]">
          {hasManyLists && (
            <GlassCard className="rounded-2xl px-3 py-3 sm:px-4">
              <form className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3" method="get">
                <label className="flex-1 text-sm font-medium text-[#2b2b2b]">
                  Search lists
                  <input
                    type="search"
                    name="q"
                    defaultValue={rawQuery}
                    placeholder="Search by list title or occasion"
                    className="mt-1 block h-11 w-full rounded-xl border border-[#2b2b2b]/20 bg-white px-3 text-sm text-[#2b2b2b] placeholder:text-[#2b2b2b]/45 focus:border-[#2b2b2b]/35 focus:outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-[#2b2b2b] sm:w-[170px]">
                  Scope
                  <select
                    name="scope"
                    defaultValue={scope}
                    className="mt-1 block h-11 w-full rounded-xl border border-[#2b2b2b]/20 bg-white px-3 text-sm text-[#2b2b2b] focus:border-[#2b2b2b]/35 focus:outline-none"
                  >
                    <option value="all">All lists</option>
                    <option value="owned">Owned by me</option>
                    <option value="shared">Shared with me</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#2b2b2b] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1f1f1f]"
                >
                  Apply
                </button>
                {(query || scope !== "all") && (
                  <Link
                    href="/app/lists"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#2b2b2b]/20 bg-white/70 px-4 text-sm font-medium text-[#2b2b2b] transition-colors hover:bg-white"
                  >
                    Clear
                  </Link>
                )}
              </form>
            </GlassCard>
          )}

          {scope !== "shared" && (
            <section>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h3 className="font-asul text-2xl leading-tight text-[#2b2b2b] sm:text-[30px]">
                  Your Lists
                </h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#2b2b2b]/70">
                  {visibleOwnedLists.length}
                  {query || scope !== "all" ? ` / ${ownedLists.length}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {visibleOwnedLists.map((list) => {
                  const listItems = itemsByList[list.id] || [];
                  const totalWishes = listItems.length;
                  const receivedCount = listItems.filter((i) => i.status === "received").length;

                  return (
                    <ListCardWrapper
                      key={list.id}
                      list={list}
                      items={listItems.slice(0, 4)}
                      totalWishes={totalWishes}
                      receivedCount={receivedCount}
                      ownership="owner"
                    />
                  );
                })}
              </div>
            </section>
          )}

          {scope !== "owned" && sharedLists.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <h3 className="font-asul text-2xl leading-tight text-[#2b2b2b] sm:text-[30px]">
                  Shared With You
                </h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-[#2b2b2b]/70">
                  {visibleSharedLists.length}
                  {query || scope !== "all" ? ` / ${sharedLists.length}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {visibleSharedLists.map((list) => {
                  const listItems = itemsByList[list.id] || [];
                  const totalWishes = listItems.length;
                  const receivedCount = listItems.filter((i) => i.status === "received").length;

                  return (
                    <ListCardWrapper
                      key={list.id}
                      list={list}
                      items={listItems.slice(0, 4)}
                      totalWishes={totalWishes}
                      receivedCount={receivedCount}
                      ownership="shared"
                    />
                  );
                })}
              </div>
            </section>
          )}

          {visibleListCount === 0 && (
            <GlassCard className="rounded-2xl px-4 py-4 text-center">
              <p className="text-sm text-[#2b2b2b]/70">
                No lists match your current search filters.
              </p>
            </GlassCard>
          )}

          {ownedLists.length === 0 && (
            <GlassCard className="rounded-2xl px-4 py-3 text-center">
              <p className="text-sm text-[#2b2b2b]/70">
                You don&apos;t own a list yet. Create one to start sharing.
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
