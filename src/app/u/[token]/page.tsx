import { supabaseAdmin } from "@/lib/supabase/admin";
import { ItemActions } from "@/components/ItemActions";
import { GlassCard, BadgeChip, ProgressBar } from "@/components/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

type ReservationFlag = {
  item_id: string;
  is_reserved: boolean;
};

type ContributionTotal = {
  item_id: string;
  funded_amount_cents: number;
};

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  status: "active" | "funded" | "received" | "archived";
  sort_order: number | null;
};

function formatCents(n: number | null | undefined): string {
  if (!n) return "0";
  return (n / 100).toFixed(0);
}

export default async function PublicListPage({ params }: PageProps): Promise<React.ReactElement> {
  const { token } = await params;

  const { data: list, error: listErr } = await supabaseAdmin
    .from("lists")
    .select(
      `
      id,
      title,
      occasion,
      event_date,
      recipient_type,
      allow_reservations,
      allow_contributions,
      allow_anonymous,
      currency,
      visibility
    `
    )
    .eq("share_token", token)
    .single();

  // Block access if list not found OR if visibility is private
  // Private lists should only be accessible to authenticated members, not via share link
  if (listErr || !list || list.visibility === "private") {
    return (
      <GlassCard className="text-center py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/60">
          <svg
            className="h-8 w-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-[#2B2B2B]">List not found</h1>
        <p className="mt-2 text-sm text-[#62748e]">
          That link may be invalid or expired.
        </p>
      </GlassCard>
    );
  }

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("items")
    .select(
      `
      id,
      title,
      image_url,
      price_cents,
      target_amount_cents,
      note_public,
      status,
      sort_order
    `
    )
    .eq("list_id", list.id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return (
      <GlassCard className="text-center py-12">
        <h1 className="text-lg font-semibold text-[#2B2B2B]">Failed to load items</h1>
        <p className="mt-2 text-sm text-[#62748e]">Please try again later.</p>
      </GlassCard>
    );
  }

  const typedItems = (items ?? []) as ItemRow[];
  const itemIds = typedItems.map((i) => i.id);

  let reservedFlags: ReservationFlag[] = [];
  let totals: ContributionTotal[] = [];

  if (itemIds.length > 0) {
    const [r1, r2] = await Promise.all([
      supabaseAdmin
        .from("public_reservation_flags")
        .select("item_id,is_reserved")
        .in("item_id", itemIds),
      supabaseAdmin
        .from("public_contribution_totals")
        .select("item_id,funded_amount_cents")
        .in("item_id", itemIds),
    ]);

    reservedFlags = (r1.data ?? []) as ReservationFlag[];
    totals = (r2.data ?? []) as ContributionTotal[];
  }

  const reservedMap = new Map(reservedFlags.map((r) => [r.item_id, r.is_reserved]));
  const fundedMap = new Map(totals.map((t) => [t.item_id, t.funded_amount_cents]));

  return (
    <div className="space-y-8">
      {/* List Header */}
      <GlassCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[#2B2B2B]">
              {list.title}
            </h1>

            {(list.occasion || list.event_date) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#62748e]">
                {list.occasion && <span>{list.occasion}</span>}
                {list.occasion && list.event_date && <span>·</span>}
                {list.event_date && (
                  <span>
                    {(() => {
                      // Parse as local date to avoid UTC timezone shift
                      const [y, m, d] = String(list.event_date).split("-").map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString();
                    })()}
                  </span>
                )}
              </div>
            )}

            <p className="mt-3 text-sm text-[#62748e]">
              Reserved gifts stay anonymous · Contributions go to the recipient
            </p>
          </div>

          <div className="flex items-center gap-2">
            <BadgeChip variant="neutral" className="capitalize">
              {list.recipient_type === "person"
                ? "Individual"
                : list.recipient_type === "shared"
                ? "Collaborative"
                : "Group"}
            </BadgeChip>
          </div>
        </div>
      </GlassCard>

      {/* Empty State */}
      {typedItems.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/60">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-[#2B2B2B]">No items yet</h2>
          <p className="mt-2 text-sm text-[#62748e]">
            Check back later — items will appear here.
          </p>
        </GlassCard>
      ) : (
        /* Items Grid */
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {typedItems.map((item) => {
            const isReserved = Boolean(reservedMap.get(item.id));
            const funded = fundedMap.get(item.id) ?? 0;
            const target = item.target_amount_cents ?? item.price_cents ?? undefined;
            const isReceived = item.status === "received";
            const isFunded =
              item.status === "funded" || (target ? funded >= target : false);
            const isComplete = isReceived || isFunded;

            const statusVariant = isReceived
              ? "received"
              : isFunded
              ? "funded"
              : isReserved
              ? "reserved"
              : "available";
            const statusLabel = isReceived
              ? "Received"
              : isFunded
              ? "Funded"
              : isReserved
              ? "Reserved"
              : "Available";

            const contributeDisabled =
              !list.allow_contributions || isComplete || isReserved;
            const reserveDisabled =
              !list.allow_reservations || isReserved || isComplete;

            const pct =
              target && target > 0
                ? Math.min(100, Math.round((funded / target) * 100))
                : 0;

            return (
              <GlassCard key={item.id} className="overflow-hidden p-0">
                {/* Image */}
                <div className="aspect-square w-full bg-slate-100/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.image_url ??
                      "https://picsum.photos/seed/fallback/600/600"
                    }
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="space-y-3 p-4">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-medium text-[#2B2B2B]">
                      {item.title}
                    </h2>
                    <BadgeChip variant={statusVariant}>{statusLabel}</BadgeChip>
                  </div>

                  {/* Price */}
                  {target && (
                    <p className="text-sm font-medium text-[#2B2B2B]">
                      ${formatCents(target)} {list.currency ?? "CAD"}
                    </p>
                  )}

                  {/* Progress bar (if contributions enabled and has target) */}
                  {list.allow_contributions && target && (
                    <ProgressBar
                      value={pct}
                      label={
                        isReceived
                          ? "Received"
                          : isFunded
                          ? "Fully funded"
                          : `$${formatCents(funded)} of $${formatCents(target)}`
                      }
                    />
                  )}

                  {/* Public note */}
                  {item.note_public && (
                    <p className="text-sm text-[#62748e]">{item.note_public}</p>
                  )}

                  {/* Actions */}
                  <ItemActions
                    token={token}
                    itemId={item.id}
                    contributeDisabled={contributeDisabled}
                    canReserve={!reserveDisabled}
                    isReserved={isReserved}
                  />
                </div>
              </GlassCard>
            );
          })}
        </section>
      )}
    </div>
  );
}
