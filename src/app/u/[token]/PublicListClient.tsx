"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { ItemActions } from "@/components/ItemActions";

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

type PublicListClientProps = {
  token: string;
  items: ItemRow[];
  reservedMap: Map<string, boolean>;
  fundedMap: Map<string, number>;
  listAllowReservations: boolean;
  listAllowContributions: boolean;
  currency: string;
};

type SortOption = "default" | "price-low" | "price-high" | "most-desired";
type FilterOption = "all" | "available" | "reserved" | "funded";

function formatCents(n: number | null | undefined): string {
  if (!n) return "0";
  return (n / 100).toFixed(0);
}

export function PublicListClient({
  token,
  items: initialItems,
  reservedMap,
  fundedMap,
  listAllowReservations,
  listAllowContributions,
  currency,
}: PublicListClientProps): React.ReactElement {
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // Apply filtering
  const filteredItems = initialItems.filter((item) => {
    const isReserved = reservedMap.get(item.id);
    const funded = fundedMap.get(item.id) ?? 0;
    const target = item.target_amount_cents ?? item.price_cents ?? 0;
    const isFunded = item.status === "funded" || (target > 0 && funded >= target);

    if (filterBy === "available") {
      return !isReserved && !isFunded;
    }
    if (filterBy === "reserved") {
      return isReserved;
    }
    if (filterBy === "funded") {
      return isFunded;
    }
    return true;
  });

  // Apply sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    const targetA = a.target_amount_cents ?? a.price_cents ?? 0;
    const targetB = b.target_amount_cents ?? b.price_cents ?? 0;
    const mostDesiredA = a.most_desired ? 1 : 0;
    const mostDesiredB = b.most_desired ? 1 : 0;

    if (sortBy === "price-low") return targetA - targetB;
    if (sortBy === "price-high") return targetB - targetA;
    if (sortBy === "most-desired") {
      // Most desired first, then by original sort order
      if (mostDesiredB !== mostDesiredA) return mostDesiredB - mostDesiredA;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    }
    // Default: keep original sort order
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // Separate most desired items
  const mostDesiredItems = sortedItems.filter((item) => item.most_desired);
  const otherItems = sortedItems.filter((item) => !item.most_desired);

  return (
    <>
      {/* Sort/Filter Controls */}
      {initialItems.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#62748e]">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-full border border-[#2B2B2B]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#2B2B2B] transition-all hover:border-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/30"
              >
                <option value="default">Default</option>
                <option value="most-desired">Most Desired</option>
                <option value="price-low">Price (Low-High)</option>
                <option value="price-high">Price (High-Low)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#62748e]">Filter</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="rounded-full border border-[#2B2B2B]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#2B2B2B] transition-all hover:border-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/30"
              >
                <option value="all">All Items ({initialItems.length})</option>
                <option value="available">
                  Available ({initialItems.filter((i) => !reservedMap.get(i.id) && !(i.status === "funded" || ((i.target_amount_cents ?? i.price_cents ?? 0) > 0 && (fundedMap.get(i.id) ?? 0) >= (i.target_amount_cents ?? i.price_cents ?? 0)))).length})
                </option>
                <option value="reserved">
                  Reserved ({initialItems.filter((i) => reservedMap.get(i.id)).length})
                </option>
                <option value="funded">
                  Fully Funded ({initialItems.filter((i) => i.status === "funded" || ((i.target_amount_cents ?? i.price_cents ?? 0) > 0 && (fundedMap.get(i.id) ?? 0) >= (i.target_amount_cents ?? i.price_cents ?? 0))).length})
                </option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs text-[#62748e]">
            Showing {filteredItems.length} of {initialItems.length} items
          </div>
        </div>
      )}

      {/* Items - Most Desired Section */}
      {mostDesiredItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#f5a623]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h2 className="font-asul text-lg font-semibold text-[#2B2B2B]">
              Top Picks
            </h2>
            <span className="text-xs font-medium text-[#62748e]">
              {mostDesiredItems.length} item{mostDesiredItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mostDesiredItems.map((item) => (
              <ItemCardComponent
                key={item.id}
                item={item}
                token={token}
                reservedMap={reservedMap}
                fundedMap={fundedMap}
                listAllowReservations={listAllowReservations}
                listAllowContributions={listAllowContributions}
                currency={currency}
              />
            ))}
          </section>
        </div>
      )}

      {/* Items - Other Items Section */}
      {otherItems.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherItems.map((item) => (
            <ItemCardComponent
              key={item.id}
              item={item}
              token={token}
              reservedMap={reservedMap}
              fundedMap={fundedMap}
              listAllowReservations={listAllowReservations}
              listAllowContributions={listAllowContributions}
              currency={currency}
            />
          ))}
        </section>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
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
          <h2 className="mt-4 text-lg font-medium text-[#2B2B2B]">No items match</h2>
          <p className="mt-2 text-sm text-[#62748e]">
            Try adjusting your filters or sort order.
          </p>
        </GlassCard>
      )}
    </>
  );
}

/**
 * ItemCardComponent - Single product card for public list
 */
function ItemCardComponent({
  item,
  token,
  reservedMap,
  fundedMap,
  listAllowReservations,
  listAllowContributions,
  currency,
}: {
  item: ItemRow;
  token: string;
  reservedMap: Map<string, boolean>;
  fundedMap: Map<string, number>;
  listAllowReservations: boolean;
  listAllowContributions: boolean;
  currency: string;
}): React.ReactElement {
  const isReserved = Boolean(reservedMap.get(item.id));
  const funded = fundedMap.get(item.id) ?? 0;
  const target = item.target_amount_cents ?? item.price_cents ?? undefined;
  const isReceived = item.status === "received";
  const isFunded =
    item.status === "funded" || (target ? funded >= target : false);
  const isComplete = isReceived || isFunded;

  const contributeDisabled =
    !listAllowContributions || isComplete || isReserved;
  const reserveDisabled =
    !listAllowReservations || isReserved || isComplete;

  const pct =
    target && target > 0
      ? Math.min(100, Math.round((funded / target) * 100))
      : 0;

  return (
    <GlassCard
      className="rounded-[20px] sm:rounded-[24px] p-2 sm:p-[10px] md:p-3 group bg-[#c5c5c5] overflow-hidden"
    >
      {/* White container for image with rounded corners */}
      <div className="relative bg-white rounded-[16px] sm:rounded-[20px] mb-2 sm:mb-3 overflow-hidden aspect-square">
        {/* Most Desired Badge */}
        {item.most_desired && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 bg-[#f5a623] px-2 py-1 rounded-full">
              <svg
                className="h-3.5 w-3.5 text-[#2b2b2b]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#2b2b2b]">
                Top Pick
              </span>
            </div>
          </div>
        )}

        {/* Product image - covers entire container */}
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-hollow.svg"
              alt=""
              className="h-24 w-24 opacity-20"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Title and Price on same line */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-[#2b2b2b] leading-tight line-clamp-2">
              {item.title}
            </h3>
          </div>

          {/* Price with favicon */}
          {target && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Favicon placeholder - rounded square representing website icon */}
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded border border-[#2b2b2b]/20 bg-[#f5f5f5] flex items-center justify-center">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-sm bg-[#2b2b2b]/30" />
              </div>
              <span className="text-xs sm:text-sm md:text-base font-bold text-[#2b2b2b]">
                ${formatCents(target)} {currency ?? "CAD"}
              </span>
            </div>
          )}
        </div>

        {/* Funding status with progress bar */}
        {/* Only show when there's a target amount (price or target set) */}
        {target && (
          <div className="space-y-1.5">
            {/* Funding text */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-[#505050]">
                <span className="font-medium">
                  ${formatCents(funded)} funded
                </span>
                <span>•</span>
                <span className="font-medium">
                  {/* Clamp remaining to 0 when overfunded */}
                  ${formatCents(Math.max(0, target - funded))} left
                </span>
              </div>
            </div>

            {/* Progress bar with dual colors */}
            <div className="h-1 w-full rounded-full bg-[#b8a8ff] overflow-hidden flex">
              <div
                className="h-full bg-[#3a3a3a] rounded-l-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Public note */}
        {item.note_public && (
          <p className="text-[10px] sm:text-xs md:text-sm text-[#505050]">
            {item.note_public}
          </p>
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
}
