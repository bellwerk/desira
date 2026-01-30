"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard, GlassButton, Spinner } from "@/components/ui";

function centsToPretty(cents: number, currency: string): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | {
      status: "ok" | "already";
      currency: string;
      contributionCents: number;
      feeCents: number;
      totalCents: number;
    };

export default function ThanksPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const itemId = search.get("item");
  const sessionId = search.get("session_id");

  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!itemId) {
      queueMicrotask(() => setState({ status: "missing" }));
      return;
    }

    // prevent accidental re-pay
    try {
      localStorage.removeItem(`desira_contrib_${itemId}`);
    } catch {
      // ignore
    }

    async function run(): Promise<void> {
      if (!sessionId) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message:
              "Missing session id. Payment succeeded, but it can't be recorded automatically.",
          })
        );
        return;
      }

      const res = await fetch("/api/stripe/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        already_recorded?: boolean;
        currency?: string;
        contribution_cents?: number;
        fee_cents?: number;
        total_cents?: number;
        error?: string;
      };

      if (!res.ok) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: json?.error ?? "Failed to confirm payment.",
          })
        );
        return;
      }

      const currency = String(json?.currency ?? "CAD");
      const contributionCents = Number(json?.contribution_cents ?? 0);
      const feeCents = Number(json?.fee_cents ?? 0);
      const totalCents = Number(json?.total_cents ?? 0);

      if (!contributionCents || !totalCents) {
        queueMicrotask(() =>
          setState({
            status: "error",
            message: "Payment confirmed, but amounts were missing.",
          })
        );
        return;
      }

      queueMicrotask(() =>
        setState({
          status: json?.already_recorded ? "already" : "ok",
          currency,
          contributionCents,
          feeCents,
          totalCents,
        })
      );
    }

    run();
  }, [itemId, sessionId]);

  return (
    <GlassCard className="mx-auto max-w-md">
      {/* Success icon */}
      {(state.status === "ok" || state.status === "already") && (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/80">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
      )}

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#2B2B2B] text-center">
        Thank you
      </h1>

      {state.status === "loading" ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#62748e]">
          <Spinner size="sm" />
          <span>Confirming payment...</span>
        </div>
      ) : state.status === "missing" ? (
        <p className="mt-2 text-sm text-[#62748e] text-center">
          Payment succeeded, but item is missing.
        </p>
      ) : state.status === "error" ? (
        <div className="mt-4 rounded-xl bg-red-50/80 px-3 py-2 text-sm text-red-600 text-center">
          {state.message}
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            {state.status === "already"
              ? "Your contribution has been recorded."
              : "Your contribution has been recorded."}
          </p>

          {/* Receipt summary */}
          <div className="mt-4 rounded-2xl glass-2 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#62748e]">Contribution (to recipient)</span>
              <span className="font-medium text-[#2B2B2B]">
                {centsToPretty(state.contributionCents, state.currency)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[#62748e]">Desira service fee</span>
              <span className="font-medium text-[#2B2B2B]">
                {centsToPretty(state.feeCents, state.currency)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/30 pt-3 text-sm">
              <span className="font-medium text-[#2B2B2B]">Total charged</span>
              <span className="font-semibold text-[#2B2B2B]">
                {centsToPretty(state.totalCents, state.currency)}
              </span>
            </div>

            <div className="mt-2 text-xs text-[#62748e]">
              Recipient receives the contribution amount. Fee helps cover payment
              processing.
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <GlassButton
          variant="primary"
          size="md"
          onClick={() => router.push(`/u/${token}`)}
          className="flex-1 justify-center"
        >
          Back to list
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="md"
          onClick={() =>
            navigator.clipboard.writeText(window.location.origin + `/u/${token}`)
          }
          className="flex-1 justify-center"
        >
          Copy link
        </GlassButton>
      </div>
    </GlassCard>
  );
}
