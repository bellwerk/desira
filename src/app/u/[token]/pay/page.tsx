"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlassCard, GlassButton, Spinner } from "@/components/ui";

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

function centsToPretty(cents: number, currency: string): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export default function PayPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
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

  async function pay(): Promise<void> {
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
      setState({
        status: "error",
        message: json?.error ?? "Failed to start checkout.",
      });
      return;
    }

    if (!json?.url) {
      setState({ status: "error", message: "Stripe checkout URL missing." });
      return;
    }

    window.location.href = String(json.url);
  }

  const showDraft = state.status === "ready" || state.status === "submitting";
  const draft = showDraft ? state.draft : null;

  return (
    <GlassCard className="mx-auto max-w-md">
      {/* Payment icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#9D8DF1]/20">
        <svg
          className="h-8 w-8 text-[#9D8DF1]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
          />
        </svg>
      </div>

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#2B2B2B] text-center">
        Checkout
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
      ) : draft ? (
        <>
          {/* Summary */}
          <div className="mt-4 rounded-2xl glass-2 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#62748e]">Contribution</span>
              <span className="font-medium text-[#2B2B2B]">
                {centsToPretty(draft.amount_cents, draft.currency)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[#62748e]">Desira service fee</span>
              <span className="font-medium text-[#2B2B2B]">
                {centsToPretty(draft.fee_cents, draft.currency)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/30 pt-3 text-sm">
              <span className="font-medium text-[#2B2B2B]">Total charged</span>
              <span className="font-semibold text-[#2B2B2B]">
                {centsToPretty(draft.total_cents, draft.currency)}
              </span>
            </div>

            <div className="mt-2 text-xs text-[#62748e]">
              Payments processed by Stripe. Desira doesn&apos;t store card details.
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <GlassButton
              variant="primary"
              size="md"
              onClick={pay}
              loading={state.status === "submitting"}
              className="flex-1 justify-center"
            >
              {state.status === "submitting" ? "Redirecting..." : "Pay"}
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() =>
                router.push(`/u/${token}/contribute?item=${draft.item_id}`)
              }
              className="flex-1 justify-center"
            >
              Back
            </GlassButton>
          </div>
        </>
      ) : null}
    </GlassCard>
  );
}
