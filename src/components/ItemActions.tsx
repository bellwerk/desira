"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassButton } from "@/components/ui";

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

  function cancel(): void {
    // Go to cancel page (which validates ticket + cancels)
    router.push(`/u/${token}/cancel?item=${itemId}`);
  }

  return (
    <div className="flex gap-2 pt-3 border-t border-white/20">
      {contributeDisabled ? (
        <GlassButton
          variant="primary"
          size="sm"
          className="flex-1 justify-center"
          disabled
        >
          Contribute
        </GlassButton>
      ) : (
        <Link href={`/u/${token}/contribute?item=${itemId}`} className="flex-1">
          <GlassButton
            variant="primary"
            size="sm"
            className="w-full justify-center"
          >
            Contribute
          </GlassButton>
        </Link>
      )}

      {hasTicket ? (
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={cancel}
          className="flex-1 justify-center"
        >
          Cancel
        </GlassButton>
      ) : (
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={reserve}
          disabled={!canReserve}
          className="flex-1 justify-center"
        >
          Reserve
        </GlassButton>
      )}
    </div>
  );
}
