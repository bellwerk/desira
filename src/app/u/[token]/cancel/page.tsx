"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlassCard, GlassButton, Spinner } from "@/components/ui";

type State =
  | { status: "loading" }
  | { status: "ready"; cancelTicket: string }
  | { status: "missing" }
  | { status: "error"; message: string };

export default function CancelPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [state, setState] = useState<State>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ticketKey = useMemo(() => (itemId ? `desira_cancel_${itemId}` : null), [itemId]);

  useEffect(() => {
    if (!itemId || !ticketKey) {
      queueMicrotask(() => setState({ status: "missing" }));
      return;
    }

    try {
      const t = localStorage.getItem(ticketKey);
      if (!t) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: "No cancel ticket found in this browser.",
          })
        );
        return;
      }

      queueMicrotask(() => setState({ status: "ready", cancelTicket: t }));
    } catch {
      queueMicrotask(() =>
        setState({ status: "error", message: "Cannot access localStorage." })
      );
    }
  }, [itemId, ticketKey]);

  async function confirmCancel(): Promise<void> {
    if (!itemId || state.status !== "ready") return;

    setIsSubmitting(true);

    const res = await fetch("/api/reservations", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        item_id: itemId,
        cancel_ticket: state.cancelTicket,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setIsSubmitting(false);
      alert(json?.error ?? "Cancel failed.");
      return;
    }

    // clear ticket
    try {
      localStorage.removeItem(`desira_cancel_${itemId}`);
    } catch {
      // ignore
    }

    router.push(`/u/${token}`);
    router.refresh();
  }

  return (
    <GlassCard className="mx-auto max-w-md">
      {/* Warning icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100/80">
        <svg
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#2B2B2B] text-center">
        Cancel reservation
      </h1>

      {state.status === "loading" ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#62748e]">
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : state.status === "missing" ? (
        <>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            Missing item reference.
          </p>
          <div className="mt-5">
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => router.push(`/u/${token}`)}
              className="w-full justify-center"
            >
              Back to list
            </GlassButton>
          </div>
        </>
      ) : state.status === "error" ? (
        <>
          <div className="mt-4 rounded-xl bg-red-50/80 px-3 py-2 text-sm text-red-600 text-center">
            {state.message}
          </div>
          <div className="mt-5">
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => router.push(`/u/${token}`)}
              className="w-full justify-center"
            >
              Back to list
            </GlassButton>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            This will free the item so others can reserve it. Only works from the
            same browser/device that reserved it.
          </p>

          <div className="mt-5 flex gap-2">
            <GlassButton
              variant="primary"
              size="md"
              onClick={confirmCancel}
              loading={isSubmitting}
              className="flex-1 justify-center"
            >
              Confirm cancellation
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => router.push(`/u/${token}`)}
              className="flex-1 justify-center"
            >
              Back
            </GlassButton>
          </div>
        </>
      )}
    </GlassCard>
  );
}
