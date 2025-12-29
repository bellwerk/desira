"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ItemActions(props: {
  token: string;
  itemId: string;
  contributeDisabled: boolean;
  canReserve: boolean;
  isReserved: boolean;
}) {
  const router = useRouter();
  const { token, itemId, contributeDisabled, canReserve } = props;

  // ✅ lazy init instead of useEffect setState
  const [hasTicket, setHasTicket] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(`desira_cancel_${itemId}`));
    } catch {
      return false;
    }
  });

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

    // ticket is stored by the API response (we store here too to be safe)
    if (json?.cancel_ticket) {
      try {
        localStorage.setItem(`desira_cancel_${itemId}`, String(json.cancel_ticket));
        setHasTicket(true);
      } catch {
        // ignore
      }
    }

    router.refresh();
  }

  async function cancel() {
    // Go to cancel page (which validates ticket + cancels)
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  return (
    <div className="mt-4 flex gap-2">
      <Link
        href={`/u/${token}/contribute?item=${itemId}`}
        className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium ${
          contributeDisabled
            ? "pointer-events-none bg-neutral-200 text-neutral-500"
            : "bg-neutral-900 text-white"
        }`}
      >
        Contribute
      </Link>

      {hasTicket ? (
        <button
          type="button"
          onClick={cancel}
          className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
        >
          Cancel
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
