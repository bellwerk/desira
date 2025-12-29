"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function dollarsToCents(input: string) {
  const clean = input.replace(/[^0-9.]/g, "");
  if (!clean) return null;
  const num = Number(clean);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

function sanitizeMoneyInput(raw: string) {
  let s = raw.replace(/[^\d.]/g, "");

  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }

  const [intPart, decPart] = s.split(".");
  const intClean = (intPart ?? "").slice(0, 6);
  const decClean = (decPart ?? "").slice(0, 2);

  return firstDot !== -1 ? `${intClean}.${decClean}` : intClean;
}

function formatCentsInput(cents: number) {
  const s = (cents / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function centsToPretty(cents: number, currency: string) {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

// Fee rule: 5% with $1 minimum
function feeCentsForContribution(contributionCents: number) {
  return Math.max(100, Math.round(contributionCents * 0.05));
}

export function ContributeForm(props: {
  token: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  currency: string;
  targetCents: number | null;
  fundedCents: number;
  allowAnonymous: boolean;
  closeWhenFunded: boolean;
}) {
  const router = useRouter();

  const leftCents = useMemo(() => {
    if (!props.targetCents) return null;
    return Math.max(props.targetCents - props.fundedCents, 0);
  }, [props.targetCents, props.fundedCents]);

  const isFullyFunded = useMemo(() => {
    if (!props.targetCents) return false;
    return props.fundedCents >= props.targetCents;
  }, [props.targetCents, props.fundedCents]);

  const [chip, setChip] = useState<number | null>(25);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chipOptions = [10, 25, 50];

  const contributionCents = useMemo(() => {
    if (custom.trim()) return dollarsToCents(custom.trim());
    if (chip == null) return null;
    return chip * 100;
  }, [chip, custom]);

  const feeCents = useMemo(() => {
    if (!contributionCents) return null;
    return feeCentsForContribution(contributionCents);
  }, [contributionCents]);

  const totalChargeCents = useMemo(() => {
    if (!contributionCents || !feeCents) return null;
    return contributionCents + feeCents;
  }, [contributionCents, feeCents]);

  const amountError = useMemo(() => {
    if (props.closeWhenFunded && isFullyFunded)
      return "This item is already fully funded.";

    if (!contributionCents || contributionCents <= 0) return "Choose an amount.";
    if (contributionCents < 100) return "Minimum contribution is $1.";

    if (
      leftCents != null &&
      props.closeWhenFunded &&
      contributionCents > leftCents
    ) {
      return `Max contribution is ${centsToPretty(leftCents, props.currency)}.`;
    }

    return null;
  }, [
    contributionCents,
    leftCents,
    props.closeWhenFunded,
    isFullyFunded,
    props.currency,
  ]);

  function pickChip(dollars: number) {
    const cents = dollars * 100;

    if (props.closeWhenFunded && leftCents != null && cents > leftCents) {
      setChip(null);
      setCustom(formatCentsInput(leftCents));
      return;
    }

    setCustom("");
    setChip(dollars);
  }

  // ✅ renamed (so eslint doesn’t think it’s a Hook)
  function setCustomAmount(v: string) {
    setChip(null);

    const cleaned = sanitizeMoneyInput(v);
    const cents = dollarsToCents(cleaned);

    if (
      props.closeWhenFunded &&
      leftCents != null &&
      cents != null &&
      cents > leftCents
    ) {
      setCustom(formatCentsInput(leftCents));
      return;
    }

    setCustom(cleaned);
  }

  function continueToPay() {
    setError(null);

    if (amountError) {
      setError(amountError);
      return;
    }

    const draft = {
      item_id: props.itemId,
      token: props.token,
      amount_cents: contributionCents!,
      fee_cents: feeCents!,
      total_cents: totalChargeCents!,
      currency: props.currency,
      contributor_name: name.trim() || null,
      message: message.trim() || null,
      is_anonymous: props.allowAnonymous ? anon : false,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(`desira_contrib_${props.itemId}`, JSON.stringify(draft));
    router.push(`/u/${props.token}/pay?item=${props.itemId}`);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Contribute</h1>

        <div className="mt-4 flex gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={props.imageUrl ?? "https://picsum.photos/seed/fallback/200/200"}
              alt={props.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="line-clamp-2 text-sm font-medium">{props.title}</div>
            {props.targetCents ? (
              <div className="mt-1 text-xs text-neutral-600">
                Target {centsToPretty(props.targetCents, props.currency)} · Funded{" "}
                {centsToPretty(props.fundedCents, props.currency)}
                {leftCents != null
                  ? ` · ${centsToPretty(leftCents, props.currency)} left`
                  : null}
              </div>
            ) : (
              <div className="mt-1 text-xs text-neutral-600">
                Funds go to the recipient.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-medium">Amount (to recipient)</div>
          <div className="mt-2 flex gap-2">
            {chipOptions.map((d) => {
              const active = chip === d && !custom.trim();
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickChip(d)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300"
                  }`}
                >
                  ${d}
                </button>
              );
            })}

            <input
              value={custom}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              inputMode="decimal"
              maxLength={10}
              pattern="^[0-9]*[.]?[0-9]{0,2}$"
            />
          </div>

          {props.closeWhenFunded && props.targetCents ? (
            <div className="mt-2 text-xs text-neutral-600">
              If the item is fully funded, contributions close.
            </div>
          ) : null}
        </div>

        {contributionCents && feeCents && totalChargeCents ? (
          <div className="mt-4 rounded-2xl border bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">Contribution</span>
              <span className="font-medium">
                {centsToPretty(contributionCents, props.currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-neutral-700">Desira service fee</span>
              <span className="font-medium">
                {centsToPretty(feeCents, props.currency)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-neutral-900 font-medium">Total charged</span>
              <span className="text-neutral-900 font-semibold">
                {centsToPretty(totalChargeCents, props.currency)}
              </span>
            </div>
            <div className="mt-2 text-xs text-neutral-600">
              Recipient receives the contribution amount. Fee helps cover payment
              processing.
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm text-neutral-700">Name (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-700">Message (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>

          {props.allowAnonymous ? (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
              />
              Give anonymously
            </label>
          ) : null}
        </div>

        <div className="mt-5 text-xs text-neutral-600">
          Payments processed by Stripe. Desira doesn’t store card details.
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={continueToPay}
            className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Continue to Pay
          </button>
          <button
            type="button"
            onClick={() => router.push(`/u/${props.token}`)}
            className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
          >
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
