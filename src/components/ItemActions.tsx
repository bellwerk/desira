"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  contributeDisabled: boolean;
  canReserve: boolean;
  isReserved: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const { token, itemId, contributeDisabled, canReserve, isReserved, isOwner } = props;

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
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, item_id: itemId }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error ?? "Failed to reserve.");
      return;
    }

    // Store cancel token for later cancellation
    const reservationId = json?.reservation?.id as string | undefined;
    const cancelTokenVal = json?.cancel_token as string | undefined;
    
    if (reservationId && cancelTokenVal) {
      writeCancelTicket(itemId, reservationId, cancelTokenVal);
      setCancelTicket({ type: "new", reservation_id: reservationId, cancel_token: cancelTokenVal });
    }

    router.refresh();
  }

  function goCancel() {
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  // UI rules:
  // - If reserved and you have ticket -> show Cancel
  // - If reserved and no ticket -> show Reserved (disabled)
  // - Else show Reserve (if allowed)
  return (
    <div className="mt-4 flex gap-2">
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
          disabled={!canReserve}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
            canReserve
              ? "bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300"
              : "bg-neutral-200 text-neutral-500"
          }`}
        >
          Reserve
        </button>
      )}
    </div>
  );
}

