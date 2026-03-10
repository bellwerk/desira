"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ErrorStateCard, GlassCard, GlassButton } from "@/components/ui";
import { getOrCreateDeviceToken } from "@/lib/device-token";

export default function ReservePage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [cancelToken, setCancelToken] = useState<string | null>(null);

  const [status, setStatus] = useState<
    "reserving" | "ready" | "processing" | "error"
  >("reserving");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const reserveAttemptedRef = useRef(false);

  const canProceed = useMemo(() => Boolean(token) && Boolean(itemId), [token, itemId]);

  useEffect(() => {
    if (!canProceed || status !== "reserving") {
      return;
    }
    if (reserveAttemptedRef.current) {
      return;
    }
    reserveAttemptedRef.current = true;

    const doReserve = async (): Promise<void> => {
      if (!itemId) return;

      setErrorMsg(null);
      const deviceToken = getOrCreateDeviceToken();
      if (!deviceToken) {
        queueMicrotask(() => {
          setStatus("error");
          setErrorMsg("Could not initialize this browser session. Please retry.");
        });
        return;
      }

      const res = await fetch(`/api/gifts/${itemId}/reserve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deviceToken,
          share_token: token,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const reservedUntilValue =
          typeof json?.reserved_until === "string" ? json.reserved_until : null;
        queueMicrotask(() => {
          setStatus("error");
          setReservedUntil(reservedUntilValue);
          setErrorMsg(json?.error ?? "Failed to hold this gift right now.");
        });
        return;
      }

      const reservationCancelToken =
        typeof json?.cancel_token === "string" ? json.cancel_token : null;
      const reservedUntilValue =
        typeof json?.reserved_until === "string" ? json.reserved_until : null;

      if (reservationCancelToken) {
        try {
          localStorage.setItem(
            `desira_cancel_${itemId}`,
            JSON.stringify({
              reservation_id:
                typeof json?.reservation_id === "string" ? json.reservation_id : null,
              cancel_token: reservationCancelToken,
            })
          );
        } catch {
          // Continue without local storage if unavailable.
        }
      }

      queueMicrotask(() => {
        setCancelToken(reservationCancelToken);
        setReservedUntil(reservedUntilValue);
        setStatus("ready");
      });
    };

    void doReserve();
  }, [canProceed, itemId, status, token]);

  async function buyOnStore(): Promise<void> {
    if (!itemId) return;
    setStatus("processing");
    setErrorMsg(null);

    const deviceToken = getOrCreateDeviceToken();
    if (!deviceToken) {
      setStatus("error");
      setErrorMsg("Could not initialize this browser session. Please retry.");
      return;
    }

    const clickRes = await fetch(`/api/gifts/${itemId}/affiliate-click`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceToken,
        cancelToken: cancelToken ?? undefined,
        share_token: token,
      }),
    });
    const clickJson = await clickRes.json().catch(() => ({}));

    if (!clickRes.ok) {
      setStatus("error");
      setErrorMsg(
        clickJson?.error ??
          "Could not open the merchant link right now. Your 24-hour hold is still active."
      );
      return;
    }

    if (typeof clickJson?.affiliate_url !== "string") {
      setStatus("error");
      setErrorMsg("Could not open the merchant link right now. Your hold is still active.");
      return;
    }

    try {
      localStorage.setItem(
        `desira_pending_purchase_${itemId}`,
        JSON.stringify({
          item_id: itemId,
          token,
          clicked_at: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore local storage failures.
    }

    window.location.assign(clickJson.affiliate_url);
  }

  async function markBoughtElsewhere(): Promise<void> {
    if (!itemId) return;
    setStatus("processing");
    setErrorMsg(null);

    const deviceToken = getOrCreateDeviceToken();
    if (!deviceToken) {
      setStatus("error");
      setErrorMsg("Could not initialize this browser session. Please retry.");
      return;
    }

    const purchaseRes = await fetch(`/api/gifts/${itemId}/mark-purchased`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceToken,
        cancelToken: cancelToken ?? undefined,
        share_token: token,
      }),
    });
    const purchaseJson = await purchaseRes.json().catch(() => ({}));

    if (!purchaseRes.ok) {
      setStatus("error");
      setErrorMsg(
        purchaseJson?.error ?? "Gift was reserved, but could not be marked purchased yet."
      );
      return;
    }

    try {
      localStorage.removeItem(`desira_cancel_${itemId}`);
      localStorage.removeItem(`desira_pending_purchase_${itemId}`);
    } catch {
      // Ignore storage cleanup failures.
    }

    router.push(`/u/${token}`);
    router.refresh();
  }

  function reserveOnly(): void {
    router.push(`/u/${token}`);
    router.refresh();
  }

  function formatReservedUntil(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString();
  }

  const reservedUntilLabel = formatReservedUntil(reservedUntil);

  if (!itemId) {
    return (
      <ErrorStateCard
        title="Missing item"
        message="Go back and tap Buy this gift from the list."
        actionLabel="Back to list"
        actionHref={`/u/${token}`}
        className="mx-auto max-w-md"
      />
    );
  }

  if (status === "error") {
    return (
      <ErrorStateCard
        title="Could not hold this gift"
        message={
          reservedUntilLabel
            ? `${errorMsg ?? "This gift is currently reserved."} Reserved until ${reservedUntilLabel}.`
            : (errorMsg ?? "Please go back and try another gift.")
        }
        actionLabel="Back to list"
        actionHref={`/u/${token}`}
        className="mx-auto max-w-md"
      />
    );
  }

  if (status === "reserving") {
    return (
      <GlassCard className="mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#9D8DF1]/20">
          <svg
            className="h-7 w-7 animate-spin text-[#9D8DF1]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v4m0 10v4m9-9h-4M7 12H3m15.364 6.364-2.828-2.828M8.464 8.464 5.636 5.636m12.728 0-2.828 2.828M8.464 15.536l-2.828 2.828"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold tracking-tight text-[#2B2B2B]">
          Holding this gift for 24h
        </h1>
        <p className="mt-2 text-center text-sm text-[#62748e]">
          We&apos;re reserving it now so nobody else can buy or contribute.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mx-auto max-w-md">
      <h1 className="text-center text-xl font-semibold tracking-tight text-[#2B2B2B]">
        Buy gift
      </h1>
      <p className="mt-2 text-center text-sm text-[#62748e]">
        We&apos;ll hold it for 24h. Choose what you want to do next.
      </p>
      {errorMsg ? (
        <div className="mt-4 rounded-xl bg-red-50/80 px-3 py-2 text-center text-sm text-red-600">
          {errorMsg}
        </div>
      ) : null}
      {reservedUntilLabel ? (
        <p className="mt-3 text-center text-xs text-[#62748e]">Hold ends: {reservedUntilLabel}</p>
      ) : null}

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-[#2b2b2b]/15 bg-white/80 p-3">
          <GlassButton
            variant="primary"
            size="md"
            disabled={status === "processing"}
            onClick={() => {
              void buyOnStore();
            }}
            className="w-full justify-center"
          >
            Buy on store
          </GlassButton>
          <p className="mt-2 text-center text-xs text-[#62748e]">
            We&apos;ll hold it for 24h. After checkout, come back to mark purchased.
          </p>
        </div>

        <div className="rounded-2xl border border-[#2b2b2b]/15 bg-white/80 p-3">
          <GlassButton
            variant="secondary"
            size="md"
            disabled={status === "processing"}
            onClick={reserveOnly}
            className="w-full justify-center"
          >
            Reserve only (24h)
          </GlassButton>
          <p className="mt-2 text-center text-xs text-[#62748e]">Hold it while you decide.</p>
        </div>

        <div className="rounded-2xl border border-[#2b2b2b]/15 bg-white/80 p-3">
          <GlassButton
            variant="ghost"
            size="md"
            disabled={status === "processing"}
            onClick={() => {
              void markBoughtElsewhere();
            }}
            className="w-full justify-center"
          >
            I bought it elsewhere
          </GlassButton>
          <p className="mt-2 text-center text-xs text-[#62748e]">Mark as purchased.</p>
        </div>
      </div>
    </GlassCard>
  );
}
