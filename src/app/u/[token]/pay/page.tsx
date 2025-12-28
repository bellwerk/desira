"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function centsToPretty(cents: number, currency: string) {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

type Draft = {
  item_id: string;
  token: string;

  // recipient gets this
  amount_cents: number;

  // desira fee + total charged
  fee_cents: number;
  total_cents: number;

  currency: string;
  contributor_name: string | null;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
};

export default function PayPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const raw = localStorage.getItem(`desira_contrib_${itemId}`);
    if (!raw) {
      setDraft(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Draft;
      setDraft(parsed);
    } catch {
      setDraft(null);
    }
  }, [itemId]);

  const canProceed = useMemo(
    () => Boolean(itemId) && Boolean(draft) && !loading,
    [itemId, draft, loading]
  );

  async function pay() {
    if (!draft) return;
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: draft.token,
        item_id: draft.item_id,

        // IMPORTANT: backend will charge total and use application_fee_amount
        amount_cents: draft.amount_cents,
        fee_cents: draft.fee_cents,

        contributor_name: draft.contributor_name,
        message: draft.message,
        is_anonymous: draft.is_anonymous,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (json?.max_cents) {
        setErr(
          `Amount exceeds remaining. Max is ${centsToPretty(
            Number(json.max_cents),
            draft.currency
          )}.`
        );
      } else {
        setErr(json?.error ?? "Failed to start checkout.");
      }
      setLoading(false);
      return;
    }

    if (json?.url) {
      window.location.href = json.url;
      return;
    }

    setErr("Stripe checkout URL missing.");
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Checkout</h1>

        {!itemId ? (
          <>
            <p className="mt-3 text-sm text-neutral-600">
              Missing item. Go back and tap Contribute again.
            </p>
            <button
              className="mt-5 w-full rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
              onClick={() => router.push(`/u/${token}`)}
            >
              Back to list
            </button>
          </>
        ) : !draft ? (
          <>
            <p className="mt-3 text-sm text-neutral-600">
              No draft contribution found. Go back and choose an amount.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
                onClick={() => router.push(`/u/${token}/contribute?item=${itemId}`)}
              >
                Back to amount
              </button>
              <button
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
                onClick={() => router.push(`/u/${token}`)}
              >
                List
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 rounded-2xl border bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">Contribution (to recipient)</span>
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
                Recipient receives the contribution amount. Fee helps cover processing.
              </div>

              {draft.is_anonymous ? (
                <div className="mt-2 text-xs text-neutral-600">Anonymous contribution</div>
              ) : null}
              {draft.message ? (
                <div className="mt-2 text-xs text-neutral-700">
                  Message: “{draft.message}”
                </div>
              ) : null}
            </div>

            <div className="mt-4 text-xs text-neutral-600">
              Payments processed by Stripe. Desira doesn’t store card details.
            </div>

            {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:bg-neutral-300"
                disabled={!canProceed}
                onClick={pay}
              >
                {loading ? "Redirecting…" : "Pay"}
              </button>
              <button
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
                onClick={() => router.push(`/u/${token}/contribute?item=${itemId}`)}
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
