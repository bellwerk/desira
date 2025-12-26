"use client";

import { useEffect, useState } from "react";

export function ItemActions({
  token,
  itemId,
  contributeDisabled,
  canReserve,
  isReserved,
}: {
  token: string;
  itemId: string;
  contributeDisabled: boolean;
  canReserve: boolean;
  isReserved: boolean;
}) {
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    try {
      setHasTicket(Boolean(localStorage.getItem(`desira_cancel_${itemId}`)));
    } catch {
      setHasTicket(false);
    }
  }, [itemId]);

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <a
        href={`/u/${token}/contribute?item=${itemId}`}
        className={`rounded-xl px-3 py-2 text-center text-sm font-medium ${
          contributeDisabled
            ? "pointer-events-none bg-neutral-200 text-neutral-500"
            : "bg-neutral-900 text-white"
        }`}
      >
        Contribute
      </a>

      {!isReserved ? (
        <a
          href={`/u/${token}/reserve?item=${itemId}`}
          className={`rounded-xl px-3 py-2 text-center text-sm font-medium ${
            canReserve
              ? "bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300"
              : "pointer-events-none bg-neutral-200 text-neutral-500"
          }`}
        >
          Reserve
        </a>
      ) : hasTicket ? (
        <a
          href={`/u/${token}/cancel?item=${itemId}`}
          className="rounded-xl bg-white px-3 py-2 text-center text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
          title="Only you can cancel (this browser)"
        >
          Cancel
        </a>
      ) : (
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-center text-sm font-medium text-neutral-600">
          Reserved
        </div>
      )}
    </div>
  );
}
