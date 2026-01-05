"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToastActions } from "@/components/ui";

type Draft = {
  item_id: string;
  token: string;
  amount_cents: number;
  fee_cents: number;
  total_cents: number;
  currency: string;
  contributor_name: string | null;
  message: string | null;
  is_anonymous: boolean;
};

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; draft: Draft }
  | { status: "submitting"; draft: Draft };

function centsToPretty(cents: number, currency: string) {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export default function PayPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToastActions();
  const itemId = search.get("item");

  const draftKey = useMemo(
    () => (itemId ? `desira_contrib_${itemId}` : null),
    [itemId]
  );

  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!itemId || !draftKey) {
      queueMicrotask(() => setState({ status: "missing" }));
      return;
    }

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: "No contribution draft found for this item.",
          })
        );
        return;
      }

      const parsed = JSON.parse(raw) as Partial<Draft>;

      if (
        !parsed ||
        parsed.item_id !== itemId ||
        typeof parsed.amount_cents !== "number" ||
        typeof parsed.fee_cents !== "number" ||
        typeof parsed.total_cents !== "number" ||
        typeof parsed.currency !== "string"
      ) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: "Draft is invalid. Please go back and try again.",
          })
        );
        return;
      }

      queueMicrotask(() => setState({ status: "ready", draft: parsed as Draft }));
    } catch {
      queueMicrotask(() =>
        setState({ status: "error", message: "Cannot access localStorage." })
      );
    }
  }, [itemId, draftKey]);

  async function pay() {
    if (state.status !== "ready") return;

    const draft = state.draft;
    setState({ status: "submitting", draft });

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        item_id: draft.item_id,
        contribution_cents: draft.amount_cents,
        fee_cents: draft.fee_cents,
        total_cents: draft.total_cents,
        contributor_name: draft.contributor_name,
        message: draft.message,
        is_anonymous: draft.is_anonymous,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = json?.error ?? "Failed to start checkout.";
      toast.error(errorMsg);
      setState({
        status: "error",
        message: errorMsg,
      });
      return;
    }

    if (!json?.url) {
      const errorMsg = "Stripe checkout URL missing.";
      toast.error(errorMsg);
      setState({ status: "error", message: errorMsg });
      return;
    }

    window.location.href = String(json.url);
  }

  const showDraft = state.status === "ready" || state.status === "submitting";
  const draft = showDraft ? state.draft : null;

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Checkout</h1>

        {state.status === "loading" ? (
          <p className="mt-2 text-sm text-neutral-600">Loading...</p>
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
        ) : draft ? (
          <>
            <div className="mt-4 rounded-2xl border bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">Contribution</span>
                <span className="font-medium">
                  {centsToPretty(draft.amount_cents, draft.currency)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-700">Desira service fee</span>
                <span className="font-medium">
                  {centsToPretty(draft.fee_cents, draft.currency)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900">Total charged</span>
                <span className="font-semibold text-neutral-900">
                  {centsToPretty(draft.total_cents, draft.currency)}
                </span>
              </div>

              <div className="mt-2 text-xs text-neutral-600">
                Payments processed by Stripe. Desira doesn’t store card details.
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={state.status === "submitting"}
                onClick={pay}
              >
                {state.status === "submitting" ? "Redirecting…" : "Pay"}
              </button>
              <button
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
                onClick={() => router.push(`/u/${token}/contribute?item=${draft.item_id}`)}
              >
                Back
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
