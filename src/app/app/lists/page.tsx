import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassButton, BadgeChip } from "@/components/ui";

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
}

// Sample product data for the "Popular gift ideas" section
const popularGiftIdeas = [
  { id: 1, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
  { id: 2, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
  { id: 3, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
  { id: 4, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
  { id: 5, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
  { id: 6, name: "Nike Sport Shoes for wh...", originalPrice: "$545.00", currentPrice: "$545.00" },
];

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
      "id, title, recipient_type, visibility, occasion, event_date, share_token, created_at, owner_id"
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

  return (
    <div className="ml-12 space-y-6">
      {/* Tagline */}
      <p className="text-center text-lg font-normal text-[#2B2B2B]">
        Great surprises won&apos;t create themselves!
      </p>

      {/* Lists */}
      {typedLists.length === 0 ? (
        <div className="space-y-6">
          {/* Empty State Card */}
          <div className="mx-auto max-w-2xl rounded-3xl bg-[#3D3D3D] px-8 py-12 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl italic text-white md:text-3xl">
              Only you know what you want!
            </h2>
            <Link href="/app/lists/new" className="mt-6 inline-block">
              <button className="rounded-full border border-[#2B2B2B]/20 bg-[#D4D7C2] px-6 py-2.5 text-sm font-medium text-[#2B2B2B] transition-all hover:bg-[#c9ccb7]">
                Create you first wishlist
              </button>
            </Link>
          </div>

          {/* Popular Gift Ideas Section */}
          <div className="mx-auto max-w-3xl rounded-2xl bg-white/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-normal text-[#5C5C5C]">Popular gift ideas</span>
              <button className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#2B2B2B] shadow-sm transition-all hover:shadow-md">
                Explore All
              </button>
            </div>
            
            {/* Product Cards Carousel */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {popularGiftIdeas.map((product) => (
                <div
                  key={product.id}
                  className="relative min-w-[100px] flex-shrink-0"
                >
                  {/* Product Image Placeholder */}
                  <div className="relative h-20 w-full rounded-lg bg-[#B8B8C8]">
                    {/* Add Button */}
                    <button className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2B2B2B] text-white transition-transform hover:scale-110">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Product Info */}
                  <div className="mt-1.5">
                    <p className="truncate text-[9px] font-medium text-[#2B2B2B]">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-[#8A8A8A] line-through">
                        {product.originalPrice}
                      </span>
                      <span className="text-[8px] font-medium text-[#2B2B2B]">
                        {product.currentPrice}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl grid gap-4">
          {typedLists.map((list) => (
            <ListCard key={list.id} list={list} userId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListCard({ list, userId }: { list: ListRow; userId: string }): React.ReactElement {
  const shareUrl = `/u/${list.share_token}`;
  const isOwner = list.owner_id === userId;

  const visibilityVariant =
    list.visibility === "private"
      ? "private"
      : list.visibility === "public"
      ? "public"
      : "unlisted";

  const visibilityLabel =
    list.visibility === "private"
      ? "Private"
      : list.visibility === "public"
      ? "Public"
      : "Unlisted";

  return (
    <GlassCard variant="interactive">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#343338] dark:text-white">
              {list.title}
            </h3>
            <BadgeChip variant={visibilityVariant}>{visibilityLabel}</BadgeChip>
            {!isOwner && (
              <BadgeChip variant="unlisted">Shared with me</BadgeChip>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              {list.recipient_type === "person"
                ? "Individual"
                : list.recipient_type === "shared"
                ? "Collaborative"
                : "Group"}
            </span>
            {list.occasion && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m18-4.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {list.occasion}
              </span>
            )}
            {list.event_date && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                {new Date(list.event_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={shareUrl} target="_blank">
            <GlassButton variant="ghost" size="sm">
              View
            </GlassButton>
          </Link>
          <Link href={`/app/lists/${list.id}`}>
            <GlassButton variant="secondary" size="sm">
              Manage
            </GlassButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
