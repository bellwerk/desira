import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/CopyButton";
import { GlassCard, GlassButton, BadgeChip } from "@/components/ui";
import { AddItemForm } from "./AddItemForm";
import { ItemCard } from "./ItemCard";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  note_private: string | null;
  status: string;
  sort_order: number | null;
};

type ReservationFlag = {
  item_id: string;
  is_reserved: boolean;
};

type ContributionTotal = {
  item_id: string;
  funded_amount_cents: number;
};

export default async function ListDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load list (RLS allows members to view lists they belong to)
  const { data: list, error: listErr } = await supabase
    .from("lists")
    .select(
      `
      id,
      title,
      recipient_type,
      visibility,
      occasion,
      event_date,
      share_token,
      allow_reservations,
      allow_contributions,
      allow_anonymous,
      currency,
      created_at,
      owner_id
    `
    )
    .eq("id", id)
    .single();

  // Check if current user is the owner
  const isOwner = list?.owner_id === user.id;

  if (listErr || !list) {
    notFound();
  }

  // Load items
  const { data: items } = await supabase
    .from("items")
    .select(
      `
      id,
      title,
      image_url,
      product_url,
      price_cents,
      target_amount_cents,
      note_public,
      note_private,
      status,
      sort_order
    `
    )
    .eq("list_id", id)
    .order("sort_order", { ascending: true });

  const typedItems = (items ?? []) as ItemRow[];
  const itemIds = typedItems.map((i) => i.id);

  // Load reservation flags and contribution totals
  let reservedFlags: ReservationFlag[] = [];
  let totals: ContributionTotal[] = [];

  if (itemIds.length > 0) {
    const [r1, r2] = await Promise.all([
      supabase
        .from("public_reservation_flags")
        .select("item_id,is_reserved")
        .in("item_id", itemIds),
      supabase
        .from("public_contribution_totals")
        .select("item_id,funded_amount_cents")
        .in("item_id", itemIds),
    ]);

    reservedFlags = (r1.data ?? []) as ReservationFlag[];
    totals = (r2.data ?? []) as ContributionTotal[];
  }

  const reservedMap = new Map(
    reservedFlags.map((r) => [r.item_id, r.is_reserved])
  );
  const fundedMap = new Map(
    totals.map((t) => [t.item_id, t.funded_amount_cents])
  );

  // Build absolute share URL from request headers (server component)
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const shareUrl = `${protocol}://${host}/u/${list.share_token}`;

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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/app/lists"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back to lists
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {list.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="capitalize">{list.recipient_type}</span>
              {list.occasion && (
                <>
                  <span>·</span>
                  <span>{list.occasion}</span>
                </>
              )}
              {list.event_date && (
                <>
                  <span>·</span>
                  <span>{new Date(list.event_date).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BadgeChip variant={visibilityVariant}>{visibilityLabel}</BadgeChip>
            <Link href={`/app/lists/${id}/settings`}>
              <GlassButton variant="ghost" size="sm">
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
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Settings
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Share link */}
      <GlassCard variant="dense">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Share link
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Anyone with this link can view your list and reserve or contribute to
          items.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl glass-1 px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
            /u/{list.share_token}
          </code>
          <CopyButton text={shareUrl} />
          <Link href={`/u/${list.share_token}`} target="_blank">
            <GlassButton variant="ghost" size="sm">
              Preview
            </GlassButton>
          </Link>
        </div>
      </GlassCard>

      {/* Add Item Form */}
      <AddItemForm listId={list.id} />

      {/* Items */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Items ({typedItems.length})
        </h2>

        {typedItems.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">
              No items yet. Add your first wish above!
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {typedItems.map((item) => {
              const isReserved = Boolean(reservedMap.get(item.id));
              const funded = fundedMap.get(item.id) ?? 0;
              const target = item.target_amount_cents ?? item.price_cents ?? 0;
              const isFunded =
                item.status === "funded" || (target > 0 && funded >= target);

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  isReserved={isReserved}
                  isFunded={isFunded}
                  fundedAmount={funded}
                  currency={list.currency ?? "CAD"}
                  isOwner={isOwner}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
