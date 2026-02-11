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
}): React.ReactElement {
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

  async function reserve(): Promise<void> {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ share_token: token, item_id: itemId }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error ?? "Failed to reserve.");
      return;
    }

    // Store cancel credentials locally so this browser can cancel later.
    if (json?.reservation_id && json?.cancel_token) {
      try {
        localStorage.setItem(
          `desira_cancel_${itemId}`,
          JSON.stringify({
            reservation_id: json.reservation_id,
            cancel_token: json.cancel_token,
          })
        );
        setHasTicket(true);
      } catch {
        // ignore
      }
    }

    router.refresh();
  }

  function cancel(): void {
    // Go to cancel page (which validates ticket + cancels)
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  return (
    <div className="flex items-center gap-2">
      {contributeDisabled ? (
        <button
          disabled
          className="flex-1 rounded-full bg-[#3a3a3a] px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-white transition-all opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3a3a3a]"
        >
          Contribute
        </button>
      ) : (
        <Link href={`/u/${token}/contribute?item=${itemId}`} className="flex-1">
          <button className="w-full rounded-full bg-[#3a3a3a] px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-white transition-all hover:bg-[#2b2b2b] active:scale-[0.98]">
            Contribute
          </button>
        </Link>
      )}

      {hasTicket ? (
        <button
          onClick={cancel}
          className="flex-1 rounded-full border border-[#2b2b2b] bg-transparent px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98]"
        >
          Cancel
        </button>
      ) : (
        <button
          onClick={reserve}
          disabled={!canReserve}
          className="flex-1 rounded-full border border-[#2b2b2b] bg-transparent px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reserve
        </button>
      )}
    </div>
  );
}
