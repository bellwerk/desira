"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuditEventType } from "@/lib/audit-events";
import type { ExperimentVariant } from "@/lib/experiments";

export function ItemActions(props: {
  token: string;
  itemId: string;
  listId: string;
  contributeDisabled: boolean;
  contributeDisabledReason?: string;
  canReserve: boolean;
  reserveDisabledReason?: string;
  hasProductLink: boolean;
  actionLabelVariant: ExperimentVariant;
}): React.ReactElement {
  const router = useRouter();
  const {
    token,
    itemId,
    listId,
    contributeDisabled,
    contributeDisabledReason,
    canReserve,
    reserveDisabledReason,
    hasProductLink,
    actionLabelVariant,
  } = props;
  const contributeLabel = "Contribute";
  const buyLabel = "Buy this gift";
  const [openHelper, setOpenHelper] = useState<"contribute" | "buy" | null>(null);

  // Lazy init instead of useEffect setState.
  const [hasTicket] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(`desira_cancel_${itemId}`));
    } catch {
      return false;
    }
  });

  function track(eventType: string): void {
    void fetch("/api/public-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        list_id: listId,
        item_id: itemId,
        placement: "item_card",
        action_label_variant: actionLabelVariant,
      }),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics failures.
    });
  }

  function buy(): void {
    track(AuditEventType.SHARED_ITEM_RESERVE_CLICKED);
    const nextUrl = hasProductLink
      ? `/u/${token}/reserve?item=${itemId}&go=1`
      : `/u/${token}/reserve?item=${itemId}`;
    router.push(nextUrl);
  }

  function cancel(): void {
    // Go to cancel page (which validates ticket + cancels)
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  function reopenMerchant(): void {
    window.location.assign(`/api/go/${itemId}?token=${encodeURIComponent(token)}`);
  }

  function toggleHelper(which: "contribute" | "buy"): void {
    setOpenHelper((prev) => (prev === which ? null : which));
  }

  const arrowIcon = (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white">
      <svg
        className="h-4 w-4 text-[#111111]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 17 17 7m0 0H9m8 0v8"
        />
      </svg>
    </span>
  );

  const buyEnabled = canReserve;
  const buyDisabledReason = reserveDisabledReason;
  const contributeHelperText = contributeDisabled && contributeDisabledReason
    ? contributeDisabledReason
    : "Chip in with friends.";
  const buyHelperText = hasTicket
    ? hasProductLink
      ? "You can reopen the merchant page or undo your buy mark from this browser."
      : "You marked this gift as bought from this browser."
    : buyEnabled
      ? hasProductLink
        ? "Review and confirm first, then continue to the merchant page."
        : "Review and confirm to mark this gift as bought."
      : (buyDisabledReason ?? "Not available right now.");

  return (
    <div className="grid grid-cols-1 items-start gap-2 min-[420px]:grid-cols-2 sm:gap-2.5">
      <div className="relative">
        {contributeDisabled ? (
          <button
            disabled
            className="peer flex h-11 w-full items-center justify-center rounded-full bg-[#b4a0f2] px-3 text-sm font-medium text-white opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-urbanist)] sm:text-base"
          >
            {contributeLabel}
          </button>
        ) : (
          <Link
            href={`/u/${token}/contribute?item=${itemId}`}
            className="peer block"
            onClick={() => {
              setOpenHelper(null);
              track(AuditEventType.SHARED_ITEM_CONTRIBUTE_CLICKED);
            }}
          >
            <span className="flex h-11 w-full items-center justify-center rounded-full bg-[#b4a0f2] px-3 text-sm font-medium text-white transition-colors hover:bg-[#a68ce8] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:text-base">
              {contributeLabel}
            </span>
          </Link>
        )}
        <div className="mt-1 flex justify-end sm:hidden">
          <button
            type="button"
            onClick={() => toggleHelper("contribute")}
            aria-expanded={openHelper === "contribute"}
            aria-controls={`helper-contribute-${itemId}`}
            aria-label="Show contribute helper text"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b6b6b6] text-sm font-semibold text-[#7c7c7c]"
          >
            i
          </button>
        </div>
        {openHelper === "contribute" && (
          <p
            id={`helper-contribute-${itemId}`}
            className="mt-1 inline-flex items-center justify-center rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] leading-tight text-[#5f5f5f] shadow-[0_6px_18px_rgba(0,0,0,0.08)] sm:hidden"
          >
            {contributeHelperText}
          </p>
        )}
        <p className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-center text-[10px] font-normal leading-tight text-[#5f5f5f] opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-opacity duration-150 sm:inline-flex sm:peer-hover:opacity-100 sm:peer-focus-visible:opacity-100">
          {contributeHelperText}
        </p>
      </div>

      <div className="relative">
        {hasTicket ? hasProductLink ? (
          <div className="space-y-2">
            <button
              onClick={() => {
                setOpenHelper(null);
                reopenMerchant();
              }}
              className="peer flex h-11 w-full items-center justify-between rounded-full bg-[#3a3a3a] px-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b2b2b] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
            >
              <span className="flex-1 truncate pr-2 text-center">Open merchant again</span>
              <span className="shrink-0">{arrowIcon}</span>
            </button>
            <button
              onClick={() => {
                setOpenHelper(null);
                cancel();
              }}
              className="flex h-11 w-full items-center justify-center rounded-full border border-[#202020] bg-white px-3 text-center text-sm font-medium text-[#202020] transition-colors hover:bg-[#f4f4f4] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:text-base"
            >
              Undo buy mark
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setOpenHelper(null);
              cancel();
            }}
            className="peer flex h-11 w-full items-center justify-center rounded-full border border-[#202020] bg-white px-3 text-center text-sm font-medium text-[#202020] transition-colors hover:bg-[#f4f4f4] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:text-base"
          >
            Undo buy mark
          </button>
        ) : buyEnabled ? (
          <button
            onClick={() => {
              setOpenHelper(null);
              buy();
            }}
            className="peer flex h-11 w-full items-center justify-between rounded-full bg-[#3a3a3a] px-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b2b2b] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
          >
            <span className="flex-1 truncate pr-2 text-center">{buyLabel}</span>
            <span className="shrink-0">{arrowIcon}</span>
          </button>
        ) : (
          <button
            disabled
            className="peer flex h-11 w-full items-center justify-between rounded-full bg-[#3a3a3a] px-2.5 text-sm font-medium text-white opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
          >
            <span className="flex-1 truncate pr-2 text-center">{buyLabel}</span>
            <span className="shrink-0">{arrowIcon}</span>
          </button>
        )}
        <div className="mt-1 flex justify-end sm:hidden">
          <button
            type="button"
            onClick={() => toggleHelper("buy")}
            aria-expanded={openHelper === "buy"}
            aria-controls={`helper-buy-${itemId}`}
            aria-label="Show buy helper text"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b6b6b6] text-sm font-semibold text-[#7c7c7c]"
          >
            i
          </button>
        </div>
        {openHelper === "buy" && (
          <p
            id={`helper-buy-${itemId}`}
            className="mt-1 inline-flex items-center justify-center rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] leading-tight text-[#5f5f5f] shadow-[0_6px_18px_rgba(0,0,0,0.08)] sm:hidden"
          >
            {buyHelperText}
          </p>
        )}
        <p className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-center text-[10px] font-normal leading-tight text-[#5f5f5f] opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-opacity duration-150 sm:inline-flex sm:peer-hover:opacity-100 sm:peer-focus-visible:opacity-100">
          {buyHelperText}
        </p>
      </div>
    </div>
  );
}
