"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToastActions } from "@/components/ui";

// New format includes reservation_id; legacy format is just the token string
type CancelTicketData =
  | { type: "new"; reservation_id: string; cancel_token: string }
  | { type: "legacy"; cancel_token: string };

type State =
  | { status: "loading" }
  | { status: "ready"; ticketData: CancelTicketData }
  | { status: "missing" }
  | { status: "error"; message: string };

export default function CancelPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToastActions();
  const itemId = search.get("item");

  const [state, setState] = useState<State>({ status: "loading" });
  const [isCancelling, setIsCancelling] = useState(false);
  const ticketKey = useMemo(() => (itemId ? `desira_cancel_${itemId}` : null), [itemId]);

  useEffect(() => {
    if (!itemId || !ticketKey) {
      queueMicrotask(() => setState({ status: "missing" }));
      return;
    }

    try {
      const raw = localStorage.getItem(ticketKey);
      if (!raw || !raw.trim()) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: "No cancel ticket found in this browser.",
          })
        );
        return;
      }

      // Try to parse as JSON (new format)
      try {
        const parsed = JSON.parse(raw) as { reservation_id?: string; cancel_token?: string };
        if (parsed.reservation_id && parsed.cancel_token) {
          // Capture values to satisfy TypeScript narrowing in closure
          const rid = parsed.reservation_id;
          const ct = parsed.cancel_token;
          queueMicrotask(() =>
            setState({
              status: "ready",
              ticketData: { type: "new", reservation_id: rid, cancel_token: ct },
            })
          );
          return;
        }
      } catch {
        // Not JSON - fall through to legacy handling
      }

      // Legacy plain string format - still valid for cancellation via hash lookup
      queueMicrotask(() =>
        setState({
          status: "ready",
          ticketData: { type: "legacy", cancel_token: raw },
        })
      );
    } catch {
      queueMicrotask(() =>
        setState({ status: "error", message: "Cannot access localStorage." })
      );
    }
  }, [itemId, ticketKey]);

  async function confirmCancel() {
    if (!itemId || state.status !== "ready") return;

    setIsCancelling(true);
    const { ticketData } = state;

    try {
      // Build payload based on ticket type
      const payload =
        ticketData.type === "new"
          ? { reservation_id: ticketData.reservation_id, cancel_token: ticketData.cancel_token }
          : { cancel_token: ticketData.cancel_token };

      // Use PATCH to cancel reservation (matches the API)
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error ?? "Failed to cancel reservation.");
        return;
      }

      // Clear ticket from localStorage
      try {
        localStorage.removeItem(`desira_cancel_${itemId}`);
      } catch {
        // ignore
      }

      toast.success("Reservation cancelled. The item is now available.");
      router.push(`/u/${token}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Cancel reservation</h1>

        {state.status === "loading" ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </div>
        ) : state.status === "missing" ? (
          <p className="mt-2 text-sm text-neutral-600">Missing item.</p>
        ) : state.status === "error" ? (
          <>
            <p className="mt-2 text-sm text-red-600">{state.message}</p>
            <button
              className="mt-4 w-full rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
              onClick={() => router.push(`/u/${token}`)}
            >
              Back to list
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-600">
              This will free the item so others can reserve it. Only works from the same
              browser/device that reserved it.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
                onClick={confirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Cancelling…
                  </span>
                ) : (
                  "Confirm cancellation"
                )}
              </button>
              <button
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300 transition-all hover:bg-neutral-50"
                onClick={() => router.push(`/u/${token}`)}
                disabled={isCancelling}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
