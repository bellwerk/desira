import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { PublicListClient } from "./PublicListClient";

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
  most_desired: boolean | null;
};

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
      visibility,
      owner_id
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

  // Fetch owner's display name and avatar
  const { data: owner, error: ownerErr } = await supabaseAdmin
    .from("profiles")
    .select("display_name,avatar_url")
    .eq("id", list.owner_id)
    .single();

  const ownerName = ownerErr || !owner ? "User" : owner.display_name || "User";
  const ownerAvatar = ownerErr || !owner ? null : owner.avatar_url;

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
      sort_order,
      most_desired
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
          {/* Left: Avatar + Title + Details */}
          <div className="min-w-0 flex-1 flex flex-col gap-3">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3">
              {ownerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-[#2B2B2B]/10"
                />
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-[#b8a8ff] to-[#3a3a3a] flex items-center justify-center border-2 border-[#2B2B2B]/10">
                  <span className="text-sm sm:text-base font-bold text-white">
                    {ownerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-[#62748e]">Wishlist for</p>
                <h1 className="font-asul text-xl sm:text-2xl font-semibold tracking-tight text-[#2B2B2B]">
                  {ownerName}
                </h1>
              </div>
            </div>

            {/* Occasion + Date with countdown */}
            {(list.occasion || list.event_date) && (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#62748e]">
                  {list.occasion && (
                    <span className="font-medium text-[#2B2B2B]">{list.occasion}</span>
                  )}
                  {list.occasion && list.event_date && <span>·</span>}
                  {list.event_date && (
                    <span>
                      {(() => {
                        // Parse as local date to avoid UTC timezone shift
                        const [y, m, d] = String(list.event_date)
                          .split("-")
                          .map(Number);
                        const eventDate = new Date(y, m - 1, d);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const daysUntil = Math.ceil(
                          (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        if (daysUntil < 0)
                          return `${eventDate.toLocaleDateString()} (passed)`;
                        if (daysUntil === 0) return "Today!";
                        if (daysUntil === 1) return "Tomorrow";
                        return `${eventDate.toLocaleDateString()} (in ${daysUntil} days)`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="mt-2 text-sm text-[#62748e]">
              Reserved gifts stay anonymous · Contributions go to the recipient
            </p>
          </div>

          {/* Right: Badge */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-[#2B2B2B] capitalize whitespace-nowrap">
              {list.recipient_type === "person"
                ? "Individual"
                : list.recipient_type === "shared"
                ? "Collaborative"
                : "Group"}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Empty State - No items at all */}
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
          <h2 className="mt-4 text-lg font-medium text-[#2B2B2B]">
            {ownerName} hasn&apos;t added any items yet
          </h2>
          <p className="mt-2 text-sm text-[#62748e]">
            Check back soon — items will appear here.
          </p>
        </GlassCard>
      ) : (
        /* Items Grid with Sort/Filter - Client Component */
        <PublicListClient
          token={token}
          items={typedItems}
          reservedMap={reservedMap}
          fundedMap={fundedMap}
          listAllowReservations={list.allow_reservations ?? true}
          listAllowContributions={list.allow_contributions ?? true}
          currency={list.currency ?? "CAD"}
        />
      )}

      {/* CTA Section */}
      <GlassCard className="mt-8 space-y-4 bg-gradient-to-br from-[#2B2B2B]/5 to-[#2B2B2B]/10 p-8 text-center">
        <div>
          <h2 className="font-asul text-2xl font-semibold text-[#2B2B2B]">
            Create and share your own wishlist for free
          </h2>
          <p className="mt-2 text-sm text-[#62748e]">
            Receive gifts and contributions from friends and family
          </p>
        </div>
        <div className="flex justify-center pt-4">
          <Link
            href="/login?redirect=/app/lists/new"
            className="rounded-full bg-[#2B2B2B] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#3a3a3a]"
          >
            Create a wishlist
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
