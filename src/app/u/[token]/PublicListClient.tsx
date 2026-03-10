"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemCardMedia } from "@/components/item-card/ItemCardMedia";
import { LinkedItemTitle } from "@/components/item-card/LinkedItemTitle";
import { MostDesiredBadge } from "@/components/item-card/MostDesiredBadge";
import { BadgeChip, GlassCard, ProgressBar } from "@/components/ui";
import { ItemActions } from "@/components/ItemActions";
import { getItemRedirectPath } from "@/lib/affiliate";
import { formatCurrency } from "@/lib/currency";
import { getOrCreateDeviceToken } from "@/lib/device-token";
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
  reservedUntilMap: Map<string, string | null>;
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

type PendingPurchaseItem = {
  item_id: string;
  title: string;
  reserved_until: string | null;
  affiliate_click_at: string | null;
};

export function PublicListClient({
  token,
  listId,
  items: initialItems,
  reservedMap,
  reservedUntilMap,
  fundedMap,
  listAllowReservations,
  listAllowContributions,
  currency,
  actionLabelVariant,
  occasion,
  recipientTypeLabel,
  eventDateLabel,
}: PublicListClientProps): React.ReactElement {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [pendingPurchaseItem, setPendingPurchaseItem] = useState<PendingPurchaseItem | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [isMarkingPurchased, setIsMarkingPurchased] = useState(false);

  useEffect(() => {
    const deviceToken = getOrCreateDeviceToken();
    if (!deviceToken) {
      return;
    }

    const cancelToken = (() => {
      try {
        const pendingKeys = Object.keys(window.localStorage).filter((key) =>
          key.startsWith("desira_pending_purchase_")
        );
        const matchingItemId = pendingKeys
          .map((key) => {
            const raw = window.localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { item_id?: string; token?: string };
            if (parsed.token !== token || !parsed.item_id) {
              return null;
            }
            return parsed.item_id;
          })
          .find((id): id is string => Boolean(id));

        if (!matchingItemId) {
          return undefined;
        }
        const cancelRaw = window.localStorage.getItem(`desira_cancel_${matchingItemId}`);
        if (!cancelRaw) {
          return undefined;
        }
        const cancelParsed = JSON.parse(cancelRaw) as { cancel_token?: string };
        return typeof cancelParsed.cancel_token === "string" &&
          cancelParsed.cancel_token.length > 10
          ? cancelParsed.cancel_token
          : undefined;
      } catch {
        return undefined;
      }
    })();

    let cancelled = false;

    void (async () => {
      const res = await fetch("/api/gifts/pending-purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceToken,
          cancelToken,
          share_token: token,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || cancelled) {
        return;
      }

      const item = json?.item as PendingPurchaseItem | null | undefined;
      if (!item || typeof item.item_id !== "string") {
        const fallbackKeys = Object.keys(window.localStorage).filter((key) =>
          key.startsWith("desira_pending_purchase_")
        );
        const fallbackItemId = fallbackKeys
          .map((key) => {
            try {
              const raw = window.localStorage.getItem(key);
              if (!raw) return null;
              const parsed = JSON.parse(raw) as { item_id?: string; token?: string };
              if (parsed.token !== token || !parsed.item_id) return null;
              return parsed.item_id;
            } catch {
              return null;
            }
          })
          .find((id): id is string => Boolean(id));

        if (fallbackItemId) {
          const fallbackTitle =
            initialItems.find((entry) => entry.id === fallbackItemId)?.title ??
            "This gift";
          queueMicrotask(() => {
            if (!cancelled) {
              setPendingPurchaseItem({
                item_id: fallbackItemId,
                title: fallbackTitle,
                reserved_until: null,
                affiliate_click_at: null,
              });
            }
          });
        }
        return;
      }

      queueMicrotask(() => {
        if (!cancelled) {
          setPendingPurchaseItem(item);
          void fetch("/api/public-events", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event_type: "guest_banner_shown",
              list_id: listId,
              item_id: item.item_id,
              placement: "return_banner",
            }),
            keepalive: true,
          }).catch(() => {
            // Ignore analytics failures.
          });
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [initialItems, listId, token]);

  async function markPendingPurchase(): Promise<void> {
    if (!pendingPurchaseItem || isMarkingPurchased) {
      return;
    }

    const deviceToken = getOrCreateDeviceToken();
    if (!deviceToken) {
      return;
    }

    setIsMarkingPurchased(true);
    let cancelToken: string | undefined;
    try {
      const raw = localStorage.getItem(`desira_cancel_${pendingPurchaseItem.item_id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { cancel_token?: string };
        if (typeof parsed.cancel_token === "string" && parsed.cancel_token.length > 10) {
          cancelToken = parsed.cancel_token;
        }
      }
    } catch {
      // Ignore malformed local storage values.
    }

    const res = await fetch(`/api/gifts/${pendingPurchaseItem.item_id}/mark-purchased`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceToken,
        cancelToken,
        share_token: token,
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setIsMarkingPurchased(false);
      return;
    }

    try {
      localStorage.removeItem(`desira_cancel_${pendingPurchaseItem.item_id}`);
      localStorage.removeItem(`desira_pending_purchase_${pendingPurchaseItem.item_id}`);
    } catch {
      // Ignore storage cleanup failures.
    }

    queueMicrotask(() => {
      setPendingPurchaseItem(null);
      setDismissedBanner(false);
      setIsMarkingPurchased(false);
    });
    router.refresh();

    void fetch("/api/public-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: "guest_mark_purchased",
        list_id: listId,
        item_id: pendingPurchaseItem.item_id,
        placement: "return_banner",
        status: json?.status,
      }),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics failures.
    });
  }

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
      {pendingPurchaseItem && !dismissedBanner && (
        <GlassCard className="mb-4 rounded-2xl border border-[#2b2b2b]/15 bg-white/90 p-3 sm:mb-6 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2b2b2b] sm:text-base">
                Did you buy this gift?
              </p>
              <p className="mt-1 text-xs text-[#5f5f5f] sm:text-sm">
                {pendingPurchaseItem.title}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void markPendingPurchase();
                }}
                disabled={isMarkingPurchased}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#2b2b2b] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMarkingPurchased ? "Saving..." : "Mark purchased"}
              </button>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#2b2b2b]/20 bg-white px-4 text-sm font-medium text-[#2b2b2b] transition-colors hover:bg-[#f4f4f4]"
              >
                Not yet
              </button>
            </div>
          </div>
        </GlassCard>
      )}

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
              reservedUntilMap={reservedUntilMap}
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
  reservedUntilMap,
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
  reservedUntilMap: Map<string, string | null>;
  fundedMap: Map<string, number>;
  listAllowReservations: boolean;
  listAllowContributions: boolean;
  currency: string;
  actionLabelVariant: ExperimentVariant;
}): React.ReactElement {
  const isReserved = Boolean(reservedMap.get(item.id));
  const reservedUntil = reservedUntilMap.get(item.id) ?? null;
  const funded = fundedMap.get(item.id) ?? 0;
  const target = item.target_amount_cents ?? item.price_cents ?? 0;
  const isReceived = item.status === "received";
  const isUnavailable = item.status === "archived";
  const isFunded =
    item.status === "funded" || (target > 0 && funded >= target);
  const isComplete = isReceived || isFunded || isUnavailable;
  const productRedirectPath = item.has_product_link
    ? `${getItemRedirectPath(item.id)}?token=${encodeURIComponent(token)}`
    : null;

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
              <MostDesiredBadge active />
            </div>
          )}

          <ItemCardMedia
            title={item.title}
            imageUrl={item.image_url}
            productRedirectPath={productRedirectPath}
            linkClassName="block h-full w-full"
            imageClassName="w-full h-full object-cover transition-opacity hover:opacity-95"
          />
        </div>

        <div className="space-y-[6px] font-[family-name:var(--font-urbanist)]">
          <div className="flex items-start justify-between gap-2 sm:gap-2.5">
            <div className="flex-1 min-w-0">
              <h3 className="line-clamp-2 text-xs font-bold leading-tight text-[#2b2b2b] sm:text-sm md:text-base">
                <LinkedItemTitle
                  title={item.title}
                  productRedirectPath={productRedirectPath}
                  className="underline-offset-2 hover:underline"
                />
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

              <ProgressBar
                value={pct}
                heightClassName="h-1"
                trackClassName="bg-[#3a3a3a]"
                barClassName="bg-[#b4a0f2]"
              />

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
            reservedUntil={reservedUntil}
            hasProductLink={item.has_product_link}
            actionLabelVariant={actionLabelVariant}
          />
        </div>
      </GlassCard>
    </div>
  );
}
