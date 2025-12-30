"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CancelTicketData = {
  reservation_id: string;
  cancel_token: string;
};

function readCancelTicket(itemId: string): CancelTicketData | null {
  const key = `desira_cancel_${itemId}`;

  try {
    const v = localStorage.getItem(key);
    if (!v || !v.trim()) return null;

    // Handle both JSON format and legacy plain string
    try {
      const parsed = JSON.parse(v) as CancelTicketData;
      if (parsed.reservation_id && parsed.cancel_token) {
        return parsed;
      }
    } catch {
      // Legacy plain string format - can't use without reservation_id
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCancelTicket(itemId: string, data: CancelTicketData): void {
  const key = `desira_cancel_${itemId}`;

  try {
    localStorage.setItem(key, JSON.stringify(data));
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
}) {
  const router = useRouter();
  const { token, itemId, contributeDisabled, canReserve, isReserved } = props;

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
    const reservationId = json?.reservation?.id;
    const cancelToken = json?.cancel_token;
    
    if (reservationId && cancelToken) {
      const ticketData: CancelTicketData = {
        reservation_id: reservationId,
        cancel_token: cancelToken,
      };
      writeCancelTicket(itemId, ticketData);
      setCancelTicket(ticketData);
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

