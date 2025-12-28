"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function centsToPretty(cents: number, currency: string) {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

type ConfirmOk = {
  ok: true;
  already_recorded?: boolean;
  item_id?: string;
  currency?: string;
  contribution_cents?: number;
  fee_cents?: number;
  total_cents?: number;
  payment_intent?: string;
};

export default function ThanksPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const itemId = search.get("item");
  const sessionId = search.get("session_id");

  const [state, setState] = useState<
    | { status: "loading" }
    | {
        status: "ok" | "already";
        currency: string;
        contributionCents: number;
        feeCents: number;
        totalCents: number;
      }
    | { status: "missing" }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!itemId) {
      setState({ status: "missing" });
      return;
    }

    // prevent accidental re-pay
    localStorage.removeItem(`desira_contrib_${itemId}`);

    async function run() {
      if (!sessionId) {
        setState({
          status: "error",
          message:
            "Missing session id. Payment succeeded, but it can’t be recorded automatically.",
        });
        return;
      }

      const res = await fetch("/api/stripe/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const json = (await res.json().catch(() => ({}))) as Partial<ConfirmOk> & {
        error?: string;
      };

      if (!res.ok) {
        setState({
          status: "error",
          message: json?.error ?? "Failed to confirm payment.",
        });
        return;
      }

      const currency = String(json?.currency ?? "CAD");
      const contributionCents = Number(json?.contribution_cents ?? 0);
      const feeCents = Number(json?.fee_cents ?? 0);
      const totalCents = Number(json?.total_cents ?? 0);

      if (!contributionCents || !totalCents) {
        setState({
          status: "error",
          message: "Payment confirmed, but amounts were missing.",
        });
        return;
      }

      setState({
        status: json?.already_recorded ? "already" : "ok",
        currency,
        contributionCents,
        feeCents,
        totalCents,
      });
    }

    run();
  }, [itemId, sessionId]);

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Thank you</h1>

        {state.status === "loading" ? (
          <p className="mt-2 text-sm text-neutral-600">Confirming…</p>
        ) : state.status === "missing" ? (
          <p className="mt-2 text-sm text-neutral-600">
            Payment succeeded, but item is missing.
          </p>
        ) : state.status === "error" ? (
          <p className="mt-2 text-sm text-red-600">{state.message}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-600">
              {state.status === "already" ? "Recorded (already)." : "Recorded."}
            </p>

            <div className="mt-4 rounded-2xl border bg-neutral-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">Contribution (to recipient)</span>
                <span className="font-medium">
                  {centsToPretty(state.contributionCents, state.currency)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-700">Desira service fee</span>
                <span className="font-medium">
                  {centsToPretty(state.feeCents, state.currency)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900">Total charged</span>
                <span className="font-semibold text-neutral-900">
                  {centsToPretty(state.totalCents, state.currency)}
                </span>
              </div>

              <div className="mt-2 text-xs text-neutral-600">
                Recipient receives the contribution amount. Fee helps cover processing.
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
            onClick={() => router.push(`/u/${token}`)}
          >
            Back to list
          </button>
          <button
            className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
            onClick={() =>
              navigator.clipboard.writeText(window.location.origin + `/u/${token}`)
            }
          >
            Copy link
          </button>
        </div>
      </div>
    </main>
  );
}
