import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";
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


export default async function ListsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
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
    <div className="flex flex-col items-center pt-[60px]">
      {/* Tagline */}
      <h2
        className="mb-10 text-center text-[24px] font-medium leading-[24px] text-[#2b2b2b]"
        style={{ fontFamily: "Urbanist" }}
      >
        Great surprises won&apos;t create themselves!
      </h2>

      {/* Action bar */}
      <div className="mb-8 flex w-full max-w-[1100px] items-center justify-between px-4">
        {/* Left: Add New WishList */}
        <Link
          href="/app/lists/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#D4D7C2] px-5 py-2.5 text-sm font-medium text-[#2b2b2b] shadow-sm transition-all hover:bg-[#c8cbb6] hover:shadow-md active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New WishList
        </Link>

        {/* Right: Edit and Share Your Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/app/settings"
            className="inline-flex items-center rounded-full border border-[#2b2b2b]/20 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#2b2b2b] transition-all hover:bg-white/80 active:scale-[0.98]"
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
          {/* Empty State Card */}
          <GlassCard className="w-full max-w-[940px] px-10 py-14 text-center">
            <h3 className="font-asul text-3xl font-medium text-[#2b2b2b]">
              Only you know what you want!
            </h3>
            <Link
              href="/app/lists/new"
              className="mt-8 inline-block rounded-full bg-[#D4D7C2] px-7 py-3.5 text-lg font-semibold text-[#2b2b2f] shadow-sm transition-all hover:bg-[#c8cbb6] hover:shadow-md active:scale-[0.98]"
              style={{ fontFamily: "Urbanist" }}
            >
              Create your first wishlist
            </Link>
          </GlassCard>

          {/* Popular Gift Ideas Section */}
          <div className="mt-6 w-full flex justify-center">
            <PopularGiftIdeas />
          </div>
        </>
      ) : (
        /* 3-card grid layout - aligned with action bar */
        <div className="w-full max-w-[1100px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center" style={{ rowGap: '2px', fontFamily: 'Urbanist' }}>
            {typedLists.map((list) => {
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
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
