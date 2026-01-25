import { supabaseAdmin } from "@/lib/supabase/admin";
import { ItemActions } from "@/components/ItemActions";
import { EnablePayoutsButton } from "@/components/EnablePayoutsButton";

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
  status: "active" | "funded" | "archived";
  sort_order: number | null;
};

function cents(n: number | null | undefined) {
  if (!n) return "";
  return (n / 100).toFixed(0);
}

export default async function PublicListPage({ params }: PageProps) {
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
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>List not found</h1>
        <p>That link may be invalid or expired.</p>
      </main>
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
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Failed to load items</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(itemsErr, null, 2)}
        </pre>
      </main>
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
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{list.title}</h1>

            <div className="mt-2 text-sm text-neutral-600">
              {list.occasion ? <span>{list.occasion}</span> : null}
              {list.occasion && list.event_date ? <span> · </span> : null}
              {list.event_date ? <span>{String(list.event_date)}</span> : null}
            </div>

            <div className="mt-3 text-sm text-neutral-600">
              Reserved gifts stay anonymous · Contributions go to the recipient
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border px-3 py-1 text-sm capitalize">
              {list.recipient_type}
            </span>
            <EnablePayoutsButton token={token} />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {typedItems.map((item) => {
          const isReserved = Boolean(reservedMap.get(item.id));
          const funded = fundedMap.get(item.id) ?? 0;

          const target = item.target_amount_cents ?? item.price_cents ?? undefined;

          const isFunded =
            item.status === "funded" || (target ? funded >= target : false);

          const statusLabel = isFunded ? "Funded" : isReserved ? "Reserved" : "Available";

          const contributeDisabled = !list.allow_contributions || isFunded || isReserved;
          const reserveDisabled = !list.allow_reservations || isReserved || isFunded;

          const left = target && target > funded ? Math.max(target - funded, 0) : 0;

          const pct =
            target && target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="aspect-square w-full bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url ?? "https://picsum.photos/seed/fallback/600/600"}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-base font-medium">{item.title}</h2>
                  <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
                    {statusLabel}
                  </span>
                </div>

                {target ? (
                  <div className="mt-2 text-sm text-neutral-700">
                    Target: ${cents(target)} {list.currency}
                  </div>
                ) : null}

                {list.allow_contributions && target ? (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-neutral-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">
                      {isFunded ? "Fully funded" : `$${cents(left)} left`}
                    </div>
                  </div>
                ) : null}

                <ItemActions
                  token={token}
                  itemId={item.id}
                  contributeDisabled={contributeDisabled}
                  canReserve={!reserveDisabled}
                  isReserved={isReserved}
                />
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
