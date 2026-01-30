"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, GlassButton } from "@/components/ui";

function dollarsToCents(input: string): number | null {
  const clean = input.replace(/[^0-9.]/g, "");
  if (!clean) return null;
  const num = Number(clean);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

function sanitizeMoneyInput(raw: string): string {
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

function formatCentsInput(cents: number): string {
  const s = (cents / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function centsToPretty(cents: number, currency: string): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(dollars);
}

// Fee rule: 5% with $1 minimum
function feeCentsForContribution(contributionCents: number): number {
  return Math.max(100, Math.round(contributionCents * 0.05));
}

interface ContributeFormProps {
  token: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  currency: string;
  targetCents: number | null;
  fundedCents: number;
  allowAnonymous: boolean;
  closeWhenFunded: boolean;
}

export function ContributeForm(props: ContributeFormProps): React.ReactElement {
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

  function pickChip(dollars: number): void {
    const cents = dollars * 100;

    if (props.closeWhenFunded && leftCents != null && cents > leftCents) {
      setChip(null);
      setCustom(formatCentsInput(leftCents));
      return;
    }

    setCustom("");
    setChip(dollars);
  }

  function setCustomAmount(v: string): void {
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

  function continueToPay(): void {
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
    <GlassCard className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold tracking-tight text-[#2B2B2B]">
        Contribute
      </h1>

      {/* Item preview */}
      <div className="mt-4 flex gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.imageUrl ?? "https://picsum.photos/seed/fallback/200/200"}
            alt={props.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium text-[#2B2B2B]">
            {props.title}
          </div>
          {props.targetCents ? (
            <div className="mt-1 text-xs text-[#62748e]">
              Target {centsToPretty(props.targetCents, props.currency)} · Funded{" "}
              {centsToPretty(props.fundedCents, props.currency)}
              {leftCents != null
                ? ` · ${centsToPretty(leftCents, props.currency)} left`
                : null}
            </div>
          ) : (
            <div className="mt-1 text-xs text-[#62748e]">
              Funds go to the recipient.
            </div>
          )}
        </div>
      </div>

      {/* Amount selection */}
      <div className="mt-5">
        <div className="text-sm font-medium text-[#2B2B2B]">
          Amount (to recipient)
        </div>
        <div className="mt-2 flex gap-2">
          {chipOptions.map((d) => {
            const active = chip === d && !custom.trim();
            return (
              <button
                key={d}
                type="button"
                onClick={() => pickChip(d)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#2B2B2B] text-white"
                    : "glass-2 text-[#2B2B2B] hover:bg-white/60"
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
            className="w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#62748e] focus:border-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/10"
            inputMode="decimal"
            maxLength={10}
            pattern="^[0-9]*[.]?[0-9]{0,2}$"
          />
        </div>

        {props.closeWhenFunded && props.targetCents ? (
          <div className="mt-2 text-xs text-[#62748e]">
            If the item is fully funded, contributions close.
          </div>
        ) : null}
      </div>

      {/* Summary */}
      {contributionCents && feeCents && totalChargeCents ? (
        <div className="mt-4 rounded-2xl glass-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#62748e]">Contribution</span>
            <span className="font-medium text-[#2B2B2B]">
              {centsToPretty(contributionCents, props.currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[#62748e]">Desira service fee</span>
            <span className="font-medium text-[#2B2B2B]">
              {centsToPretty(feeCents, props.currency)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/30 pt-3 text-sm">
            <span className="font-medium text-[#2B2B2B]">Total charged</span>
            <span className="font-semibold text-[#2B2B2B]">
              {centsToPretty(totalChargeCents, props.currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-[#62748e]">
            Recipient receives the contribution amount. Fee helps cover payment
            processing.
          </div>
        </div>
      ) : null}

      {/* Optional fields */}
      <div className="mt-5 space-y-3">
        <div>
          <label className="text-sm text-[#62748e]">Name (optional)</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#62748e] focus:border-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="text-sm text-[#62748e]">Message (optional)</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#62748e] focus:border-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional"
            rows={3}
          />
        </div>

        {props.allowAnonymous ? (
          <label className="flex items-center gap-2 text-sm text-[#62748e]">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="rounded border-slate-300"
            />
            Give anonymously
          </label>
        ) : null}
      </div>

      <div className="mt-5 text-xs text-[#62748e]">
        Payments processed by Stripe. Desira doesn&apos;t store card details.
      </div>

      {error ? (
        <div className="mt-3 rounded-xl bg-red-50/80 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <GlassButton
          variant="primary"
          size="md"
          onClick={continueToPay}
          className="flex-1 justify-center"
        >
          Continue to Pay
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="md"
          onClick={() => router.push(`/u/${props.token}`)}
          className="flex-1 justify-center"
        >
          Back
        </GlassButton>
      </div>
    </GlassCard>
  );
}
