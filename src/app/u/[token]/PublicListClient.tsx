"use client";

import { useState } from "react";
import { BadgeChip, GlassCard } from "@/components/ui";
import { ItemActions } from "@/components/ItemActions";
import { formatCurrency } from "@/lib/currency";
import type { ExperimentVariant } from "@/lib/experiments";

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  has_product_link: boolean;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  status: "active" | "funded" | "received" | "archived";
  sort_order: number | null;
  most_desired: boolean | null;
};

type PublicListClientProps = {
  token: string;
  listId: string;
  items: ItemRow[];
  reservedMap: Map<string, boolean>;
  fundedMap: Map<string, number>;
  listAllowReservations: boolean;
  listAllowContributions: boolean;
  currency: string;
  actionLabelVariant: ExperimentVariant;
  occasion: string | null;
  recipientTypeLabel: string;
  eventDateLabel: string | null;
};

type SortOption = "default" | "price-low" | "price-high" | "most-desired";
type FilterOption = "all" | "available" | "bought" | "funded";

export function PublicListClient({
  token,
  listId,
  items: initialItems,
  reservedMap,
  fundedMap,
  listAllowReservations,
  listAllowContributions,
  currency,
  actionLabelVariant,
  occasion,
  recipientTypeLabel,
  eventDateLabel,
}: PublicListClientProps): React.ReactElement {
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  function isItemFunded(item: ItemRow): boolean {
    const funded = fundedMap.get(item.id) ?? 0;
    const target = item.target_amount_cents ?? item.price_cents ?? 0;
    return item.status === "funded" || (target > 0 && funded >= target);
  }

  function isItemUnavailable(item: ItemRow): boolean {
    return item.status === "archived";
  }

  // Apply filtering
  const filteredItems = initialItems.filter((item) => {
    const isReserved = Boolean(reservedMap.get(item.id));
    const isFunded = isItemFunded(item);
    const isUnavailable = isItemUnavailable(item);

    if (filterBy === "available") {
      return !isReserved && !isFunded && !isUnavailable;
    }
    if (filterBy === "bought") {
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

  async function copyShareLink(): Promise<void> {
    try {
      const shareUrl = `${window.location.origin}/u/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <>
      {initialItems.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="h-11 w-full max-w-[240px] overflow-hidden rounded-[30px] bg-white px-3 font-[family-name:var(--font-urbanist)] sm:w-[240px]">
            <div className="flex h-full w-full items-center gap-2 text-sm font-medium text-[#6f6f6f] sm:text-base">
              <span className="shrink-0 text-sm sm:text-base">Sort</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                aria-label="Filter items"
                className="min-w-0 max-w-[120px] flex-none truncate appearance-none bg-transparent p-0 !pl-0 !pr-0 text-sm font-semibold text-[#202020] outline-none sm:max-w-[140px] sm:text-base"
              >
                <option value="all">All Items ({initialItems.length})</option>
                <option value="available">
                  Available ({initialItems.filter((i) => !reservedMap.get(i.id) && !isItemFunded(i) && !isItemUnavailable(i)).length})
                </option>
                <option value="bought">
                  Bought ({initialItems.filter((i) => reservedMap.get(i.id)).length})
                </option>
                <option value="funded">
                  Funded ({initialItems.filter((i) => isItemFunded(i)).length})
                </option>
              </select>
              <span className="shrink-0 text-[#a0a0a0]">|</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort items"
                className="min-w-0 flex-1 truncate appearance-none bg-transparent p-0 text-sm font-semibold text-[#2b2b2b] outline-none sm:text-base"
              >
                <option value="default">Default</option>
                <option value="most-desired">Most Desired</option>
                <option value="price-low">Price (Low-High)</option>
                <option value="price-high">Price (High-Low)</option>
              </select>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2.5 lg:w-auto lg:justify-self-center">
            <div className="flex h-11 min-w-0 max-w-full items-center justify-center rounded-[30px] bg-white px-5 text-sm font-medium text-[#5f5f5f] font-[family-name:var(--font-urbanist)] sm:text-base">
              <span className="truncate text-center">{initialItems.length} items</span>
            </div>
            <div className="flex h-11 min-w-0 max-w-full items-center justify-center rounded-[30px] bg-white px-5 text-sm font-medium text-[#5f5f5f] font-[family-name:var(--font-urbanist)] sm:max-w-[260px] sm:text-base">
              <span className="truncate text-center">{occasion?.trim() || recipientTypeLabel}</span>
            </div>
            <div className="flex h-11 min-w-0 max-w-full items-center justify-center rounded-[30px] bg-white px-5 text-sm font-medium text-[#5f5f5f] font-[family-name:var(--font-urbanist)] sm:max-w-[260px] sm:text-base">
              <span className="truncate text-center">{eventDateLabel ?? recipientTypeLabel}</span>
            </div>
          </div>

          <div className="flex w-full justify-center lg:w-auto lg:justify-end lg:justify-self-end">
            <button
              type="button"
              onClick={() => {
                void copyShareLink();
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border-0 bg-[#d4d7c2] px-4 text-sm font-semibold text-[#2b2b2b] transition-colors hover:bg-[#d4d7c2] font-[family-name:var(--font-urbanist)] sm:w-[140px] sm:text-base"
            >
              {copyState === "copied" ? (
                "Copied"
              ) : (
                <>
                  <span>Share List</span>
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17 17 7m0 0H9m8 0v8"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {sortedItems.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {sortedItems.map((item) => (
            <ItemCardComponent
              key={item.id}
              item={item}
              token={token}
              listId={listId}
              reservedMap={reservedMap}
              fundedMap={fundedMap}
              listAllowReservations={listAllowReservations}
              listAllowContributions={listAllowContributions}
              currency={currency}
              actionLabelVariant={actionLabelVariant}
            />
          ))}
        </section>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <GlassCard className="py-8 text-center sm:py-12">
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
            No gifts match this filter
          </h2>
          <p className="mt-2 text-sm text-[#62748e]">
            Try a different filter, or show all gifts again.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterBy("all");
              setSortBy("default");
            }}
            className="mt-4 rounded-full border border-[#2B2B2B]/20 px-4 py-2 text-sm font-medium text-[#2B2B2B] transition-all hover:bg-white/70"
          >
            Show all gifts
          </button>
        </GlassCard>
      )}
    </>
  );
}

function ItemCardComponent({
  item,
  token,
  listId,
  reservedMap,
  fundedMap,
  listAllowReservations,
  listAllowContributions,
  currency,
  actionLabelVariant,
}: {
  item: ItemRow;
  token: string;
  listId: string;
  reservedMap: Map<string, boolean>;
  fundedMap: Map<string, number>;
  listAllowReservations: boolean;
  listAllowContributions: boolean;
  currency: string;
  actionLabelVariant: ExperimentVariant;
}): React.ReactElement {
  const isReserved = Boolean(reservedMap.get(item.id));
  const funded = fundedMap.get(item.id) ?? 0;
  const target = item.target_amount_cents ?? item.price_cents ?? 0;
  const isReceived = item.status === "received";
  const isUnavailable = item.status === "archived";
  const isFunded =
    item.status === "funded" || (target > 0 && funded >= target);
  const isComplete = isReceived || isFunded || isUnavailable;

  const contributeDisabled =
    !listAllowContributions || isComplete || isReserved;
  const reserveDisabled =
    !listAllowReservations || isReserved || isComplete;
  const contributeDisabledReason = !listAllowContributions
    ? "Contributions are off for this item."
    : isUnavailable
      ? "This gift is unavailable right now."
    : isReserved
      ? "This gift is already marked as bought."
      : isComplete
        ? "This gift is fully funded."
        : undefined;
  const reserveDisabledReason = !listAllowReservations
    ? "Buying is off for this list."
    : isUnavailable
      ? "This gift is unavailable right now."
    : isReserved
      ? "Already bought by another friend."
      : isComplete
        ? "This gift is fully funded."
        : undefined;

  const pct =
    target > 0
      ? Math.min(100, Math.round((funded / target) * 100))
      : 0;

  return (
    <div className="stagger-item">
      <GlassCard
        variant="default"
        className="group rounded-[20px] bg-[#c5c5c5] p-2.5 sm:rounded-[24px] sm:p-3"
      >
        <div className="relative mb-1.5 aspect-square overflow-hidden rounded-[16px] bg-white sm:mb-2 sm:rounded-[20px]">
          {item.most_desired && (
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
              <div className="flex items-center gap-1 rounded-full bg-[#f5a623] px-2 py-0.5 text-[10px] font-semibold text-[#2b2b2b] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
                <div className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#2b2b2b] bg-white sm:h-3.5 sm:w-3.5">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2b2b2b]" />
                </div>
                <span className="max-w-[90px] truncate sm:max-w-none">Most Desired</span>
              </div>
            </div>
          )}

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
                src="/logo.svg"
                alt=""
                className="h-24 w-24 opacity-35"
              />
            </div>
          )}
        </div>

        <div className="space-y-[6px] font-[family-name:var(--font-urbanist)]">
          <div className="flex items-start justify-between gap-2 sm:gap-2.5">
            <div className="flex-1 min-w-0">
              <h3 className="line-clamp-2 text-xs font-bold leading-tight text-[#2b2b2b] sm:text-sm md:text-base">
                {item.title}
              </h3>
              {isUnavailable && (
                <div className="mt-1">
                  <BadgeChip variant="unavailable">Unavailable</BadgeChip>
                </div>
              )}
            </div>

            {target > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <svg className="w-4 h-[2px] text-[#2b2b2b]/40" viewBox="0 0 16 2" fill="none">
                  <path d="M0 1C4 0 4 2 8 1C12 0 12 2 16 1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="text-xs sm:text-sm md:text-base font-bold text-[#2b2b2b]">
                  {formatCurrency(target, currency)}
                </span>
              </div>
            )}
          </div>

          {target > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-[#505050] sm:text-sm">
                <span className="font-medium">
                  {formatCurrency(funded, currency)} funded
                </span>
                <span>&#8226;</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, target - funded), currency)} left
                </span>
              </div>

              <div className="h-1 w-full rounded-full bg-[#3a3a3a] overflow-hidden flex">
                <div
                  className="h-full bg-[#b4a0f2] rounded-l-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="text-xs font-semibold text-[#505050] sm:text-sm">
                {pct}% funded
              </div>
            </div>
          )}

          {item.note_public && (
            <p className="line-clamp-2 text-xs text-[#505050] sm:text-sm">
              {item.note_public}
            </p>
          )}

          <ItemActions
            token={token}
            itemId={item.id}
            listId={listId}
            contributeDisabled={contributeDisabled}
            contributeDisabledReason={contributeDisabledReason}
            canReserve={!reserveDisabled}
            reserveDisabledReason={reserveDisabledReason}
            hasProductLink={item.has_product_link}
            actionLabelVariant={actionLabelVariant}
          />
        </div>
      </GlassCard>
    </div>
  );
}
