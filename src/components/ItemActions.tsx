"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModalShell } from "@/components/ModalShell";
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
  reservedUntil?: string | null;
  hasProductLink: boolean;
  storeLabel?: string;
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
    reservedUntil,
    hasProductLink,
    storeLabel,
    actionLabelVariant,
  } = props;
  const contributeLabel = "Contribute";
  const buyLabel = "Buy gift";
  const [openHelper, setOpenHelper] = useState<"contribute" | "buy" | null>(null);
  const [isReservedInfoOpen, setIsReservedInfoOpen] = useState(false);

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
    track(AuditEventType.GUEST_BUY_TAP);
    const buyStoreLabel = (storeLabel?.trim() || "Store");
    const nextUrl = `/u/${token}/reserve?item=${itemId}&store=${encodeURIComponent(buyStoreLabel)}`;
    router.push(nextUrl);
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
  const showReservedInfoAction = !buyEnabled && Boolean(reservedUntil);
  const buyDisabledReason = reserveDisabledReason;
  const contributeHelperText = contributeDisabled && contributeDisabledReason
    ? contributeDisabledReason
    : "Chip in with friends.";
  const buyHelperText = buyEnabled
    ? hasProductLink
      ? "We'll hold it for 24h."
      : "We'll hold it for 24h while you decide."
    : (buyDisabledReason ?? "Not available right now.");

  const reservedUntilLabel = (() => {
    if (!reservedUntil) {
      return null;
    }
    const date = new Date(reservedUntil);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString();
  })();

  return (
    <div className="grid grid-cols-1 items-start gap-2 min-[420px]:grid-cols-2 sm:gap-2.5">
      <div className="relative">
        {contributeDisabled ? (
          <button
            disabled
            className="peer flex h-11 w-full items-center justify-center rounded-full bg-[#4a3a78] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed font-[family-name:var(--font-urbanist)] sm:text-base"
          >
            {contributeLabel}
          </button>
        ) : (
          <Link
            href={`/u/${token}/contribute?item=${itemId}`}
            className="peer block"
            onClick={() => {
              setOpenHelper(null);
              track(AuditEventType.GUEST_CONTRIBUTE_TAP);
            }}
          >
            <span className="flex h-11 w-full items-center justify-center rounded-full bg-[#3d267a] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#311f63] active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:text-base">
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
        {buyEnabled ? (
          <button
            onClick={() => {
              setOpenHelper(null);
              buy();
            }}
            className="peer flex h-11 w-full items-center justify-between rounded-full bg-slate-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-black active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
          >
            <span className="flex-1 truncate pr-2 text-center">{buyLabel}</span>
            <span className="shrink-0">{arrowIcon}</span>
          </button>
        ) : showReservedInfoAction ? (
          <button
            onClick={() => {
              setOpenHelper(null);
              setIsReservedInfoOpen(true);
            }}
            className="peer flex h-11 w-full items-center justify-between rounded-full bg-slate-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-black active:scale-[0.98] font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
          >
            <span className="flex-1 truncate pr-2 text-center">{buyLabel}</span>
            <span className="shrink-0">{arrowIcon}</span>
          </button>
        ) : (
          <button
            disabled
            className="peer flex h-11 w-full items-center justify-between rounded-full bg-slate-700 px-2.5 text-sm font-medium text-white/95 disabled:cursor-not-allowed font-[family-name:var(--font-urbanist)] sm:px-3 sm:text-base"
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

      <ModalShell
        isOpen={isReservedInfoOpen}
        onClose={() => setIsReservedInfoOpen(false)}
        maxWidthClass="max-w-sm"
        panelClassName="rounded-[24px] bg-[#2b2b2b] p-4 text-white shadow-2xl animate-modal-in sm:p-5"
      >
        <div className="space-y-3 pr-8">
          <h3 className="text-lg font-semibold">Gift reserved</h3>
          <p className="text-sm text-white/85">
            {reservedUntilLabel
              ? `Reserved until ${reservedUntilLabel}.`
              : "This gift is currently reserved."}
          </p>
          <p className="text-xs text-white/85">
            You can still contribute to other available gifts on this list.
          </p>
          <button
            type="button"
            onClick={() => setIsReservedInfoOpen(false)}
            className="h-11 w-full rounded-full bg-white px-4 text-sm font-semibold text-[#2b2b2b] transition-colors hover:bg-[#f2f2f2]"
          >
            Got it
          </button>
        </div>
      </ModalShell>
    </div>
  );
}

