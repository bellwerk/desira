"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToastActions } from "@/components/ui";

// New format includes reservation_id; legacy format is just the token string
type CancelTicketData =
  | { type: "new"; reservation_id: string; cancel_token: string }
  | { type: "legacy"; cancel_token: string };

function readCancelTicket(itemId: string): CancelTicketData | null {
  const key = `desira_cancel_${itemId}`;

  try {
    const v = localStorage.getItem(key);
    if (!v || !v.trim()) return null;

    // Try to parse as JSON (new format)
    try {
      const parsed = JSON.parse(v) as { reservation_id?: string; cancel_token?: string };
      if (parsed.reservation_id && parsed.cancel_token) {
        return { type: "new", reservation_id: parsed.reservation_id, cancel_token: parsed.cancel_token };
      }
    } catch {
      // Not JSON - treat as legacy plain string token
    }

    // Legacy plain string format - still valid for cancellation via hash lookup
    return { type: "legacy", cancel_token: v };
  } catch {
    return null;
  }
}

function writeCancelTicket(itemId: string, reservationId: string, cancelToken: string): void {
  const key = `desira_cancel_${itemId}`;

  try {
    localStorage.setItem(key, JSON.stringify({ reservation_id: reservationId, cancel_token: cancelToken }));
  } catch {
    // ignore
  }
}

export function ItemActions(props: {
  token: string;
  itemId: string;
  productUrl?: string | null;
  contributeDisabled: boolean;
  canReserve: boolean;
  isReserved: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const toast = useToastActions();
  const { token, itemId, productUrl, contributeDisabled, canReserve, isReserved, isOwner } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [cancelTicket, setCancelTicket] = useState<CancelTicketData | null>(() =>
    readCancelTicket(itemId)
  );

  const hasTicket = cancelTicket !== null;

  const canShowCancel = isReserved && hasTicket;

  const contributeClass = useMemo(() => {
    return contributeDisabled
      ? "pointer-events-none bg-neutral-200 text-neutral-500"
      : "bg-neutral-900 text-white";
  }, [contributeDisabled]);

  // Self-gifting prevention: hide all actions for list owners
  if (isOwner) {
    return (
      <div className="mt-4 text-sm text-neutral-500 italic">
        You own this list
      </div>
    );
  }

  async function reserve() {
    setIsLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, item_id: itemId }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error ?? "Failed to reserve item.");
        return;
      }

      // Store cancel token for later cancellation
      const reservationId = json?.reservation?.id as string | undefined;
      const cancelTokenVal = json?.cancel_token as string | undefined;
      
      if (reservationId && cancelTokenVal) {
        writeCancelTicket(itemId, reservationId, cancelTokenVal);
        setCancelTicket({ type: "new", reservation_id: reservationId, cancel_token: cancelTokenVal });
      }

      toast.success("Item reserved! You can cancel anytime.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function goCancel() {
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  // UI rules:
  // - If reserved and you have ticket -> show Cancel
  // - If reserved and no ticket -> show Reserved (disabled)
  // - Else show Reserve (if allowed)
  // - If product URL exists -> show Buy button
  return (
    <div className="mt-4 space-y-2">
      {/* Buy button - routes through affiliate redirect */}
      {productUrl && (
        <a
          href={`/api/go/${itemId}?token=${encodeURIComponent(token)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-teal-700"
        >
          Buy this gift &rarr;
        </a>
      )}
      
      <div className="flex gap-2">
      <Link
        href={`/u/${token}/contribute?item=${itemId}`}
        className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium ${contributeClass}`}
      >
        Contribute
      </Link>

      {canShowCancel ? (
        <button
          type="button"
          onClick={goCancel}
          className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
        >
          Cancel
        </button>
      ) : isReserved ? (
        <button
          type="button"
          disabled
          className="flex-1 rounded-xl bg-neutral-200 px-3 py-2 text-sm font-medium text-neutral-500"
          title="This item is reserved."
        >
          Reserved
        </button>
      ) : (
        <button
          type="button"
          onClick={reserve}
          disabled={!canReserve || isLoading}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
            canReserve && !isLoading
              ? "bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50"
              : "bg-neutral-200 text-neutral-500"
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Reserving…
            </span>
          ) : (
            "Reserve"
          )}
        </button>
      )}
      </div>
    </div>
  );
}

