import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemsSection } from "@/components/ItemsSection";
import { CopyButton } from "@/components/CopyButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ListRow {
  id: string;
  title: string;
  recipient_type: string;
  visibility: string;
  occasion: string | null;
  event_date: string | null;
  share_token: string;
  allow_reservations: boolean;
  allow_contributions: boolean;
  allow_anonymous: boolean;
  currency: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  note_private: string | null;
  merchant: string | null;
  status: "active" | "funded" | "archived";
  sort_order: number | null;
}

interface ReservationFlag {
  item_id: string;
  is_reserved: boolean;
}

interface ContributionTotal {
  item_id: string;
  funded_amount_cents: number;
}

export default async function ListDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: list, error } = await supabase
    .from("lists")
    .select("id, title, recipient_type, visibility, occasion, event_date, share_token, allow_reservations, allow_contributions, allow_anonymous, currency, created_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error || !list) {
    notFound();
  }

  const typedList = list as ListRow;

  // Fetch items for this list
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, title, image_url, product_url, price_cents, target_amount_cents, note_public, note_private, merchant, status, sort_order")
    .eq("list_id", id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("Failed to fetch items:", itemsError);
  }

  const typedItems = (items ?? []) as ItemRow[];
  const itemIds = typedItems.map((i) => i.id);

  // Fetch reservation flags and contribution totals
  let reservedMap = new Map<string, boolean>();
  let fundedMap = new Map<string, number>();

  if (itemIds.length > 0) {
    const [reservationsResult, contributionsResult] = await Promise.all([
      supabase
        .from("public_reservation_flags")
        .select("item_id, is_reserved")
        .in("item_id", itemIds),
      supabase
        .from("public_contribution_totals")
        .select("item_id, funded_amount_cents")
        .in("item_id", itemIds),
    ]);

    const reservedFlags = (reservationsResult.data ?? []) as ReservationFlag[];
    const totals = (contributionsResult.data ?? []) as ContributionTotal[];

    reservedMap = new Map(reservedFlags.map((r) => [r.item_id, r.is_reserved]));
    fundedMap = new Map(totals.map((t) => [t.item_id, t.funded_amount_cents]));
  }

  // Merge reservation and contribution data into items
  const itemsWithStatus = typedItems.map((item) => ({
    ...item,
    is_reserved: reservedMap.get(item.id) ?? false,
    funded_amount_cents: fundedMap.get(item.id) ?? 0,
  }));

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/u/${typedList.share_token}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/app/lists"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to lists
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {typedList.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span>{typedList.recipient_type === "person" ? "Individual" : "Group"}</span>
            {typedList.occasion && <span>• {typedList.occasion}</span>}
            {typedList.event_date && (
              <span>• {new Date(typedList.event_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${typedList.share_token}`}
            target="_blank"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Preview
          </Link>
        </div>
      </div>

      {/* Share link */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-medium text-slate-900 dark:text-white">Share link</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Share this link with friends and family so they can view your wishlist.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          />
          <CopyButton text={shareUrl} />
        </div>
      </div>

      {/* Items section */}
      <ItemsSection listId={typedList.id} items={itemsWithStatus} currency={typedList.currency} />

      {/* Settings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Reservations</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Allow people to reserve items</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typedList.allow_reservations ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
              {typedList.allow_reservations ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 py-2 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Contributions</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Allow people to contribute money</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typedList.allow_contributions ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
              {typedList.allow_contributions ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 py-2 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Anonymous</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Allow anonymous contributions</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typedList.allow_anonymous ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
              {typedList.allow_anonymous ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
