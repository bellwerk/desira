"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorStateCard, GlassCard, GlassButton } from "@/components/ui";

export default function ReservePage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");
  const shouldRedirectToMerchant = search.get("go") === "1";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [openDetails, setOpenDetails] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(token) && Boolean(itemId) && status !== "submitting",
    [token, itemId, status]
  );

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

  async function submit(): Promise<void> {
    if (!itemId) return;
    setStatus("submitting");
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        item_id: itemId,
        reserved_by_name: openDetails && name.trim() ? name.trim() : undefined,
        reserved_by_email: openDetails && email.trim() ? email.trim() : undefined,
        share_token: token,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(json?.error ?? "Failed to mark this gift as bought");
      return;
    }

    const reservationId =
      typeof json?.reservation_id === "string"
        ? json.reservation_id
        : typeof json?.reservation?.id === "string"
          ? json.reservation.id
          : null;
    const cancelToken =
      typeof json?.cancel_token === "string" ? json.cancel_token : null;

    // Store cancel ticket locally (same browser/device can cancel)
    if (reservationId && cancelToken) {
      try {
        localStorage.setItem(
          `desira_cancel_${itemId}`,
          JSON.stringify({
            reservation_id: reservationId,
            cancel_token: cancelToken,
          })
        );
      } catch {
        // Continue without local cancel credentials if browser storage is unavailable.
      }
    }

    if (shouldRedirectToMerchant) {
      const merchantRedirectPath = `/api/go/${itemId}?token=${encodeURIComponent(token)}`;
      const resolveRes = await fetch(`${merchantRedirectPath}&resolve=1`, {
        cache: "no-store",
      });
      const resolveJson = await resolveRes.json().catch(() => ({}));

      if (resolveRes.ok && typeof resolveJson?.redirect_url === "string") {
        setStatus("success");
        window.location.assign(merchantRedirectPath);
        return;
      }

      if (reservationId && cancelToken) {
        await fetch("/api/reservations", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reservation_id: reservationId,
            cancel_token: cancelToken,
          }),
        }).catch(() => null);
      }

      try {
        localStorage.removeItem(`desira_cancel_${itemId}`);
      } catch {
        // Ignore storage cleanup failures.
      }

      setStatus("error");
      setErrorMsg(
        resolveJson?.error ??
          "Could not open the merchant link right now. The buy mark was removed, so the gift is still available."
      );
      return;
    }

    setStatus("success");
    setTimeout(() => router.push(`/u/${token}`), 600);
  }

  return (
    <GlassCard className="mx-auto max-w-md">
      {status !== "success" ? (
        <>
          {/* Buy-lock icon */}
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
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#2B2B2B] text-center">
            Mark gift as bought
          </h1>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            Mark this gift as bought so nobody duplicates it. You stay
            anonymous to others.
          </p>

          <button
            type="button"
            className="mt-4 w-full text-sm text-[#62748e] underline underline-offset-4 hover:text-[#2B2B2B] transition-colors"
            onClick={() => setOpenDetails((v) => !v)}
          >
            {openDetails ? "Hide optional details" : "Add optional details"}
          </button>

          {openDetails ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-[#62748e]">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#62748e] focus:border-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="text-sm text-[#62748e]">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#62748e] focus:border-[#2B2B2B]/30 focus:outline-none focus:ring-2 focus:ring-[#2B2B2B]/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional (only owner can see)"
                />
              </div>
            </div>
          ) : null}

          {status === "error" && errorMsg ? (
            <div className="mt-4 rounded-xl bg-red-50/80 px-3 py-2 text-sm text-red-600 text-center">
              {errorMsg}
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <GlassButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={!canSubmit}
              loading={status === "submitting"}
              className="flex-1 justify-center"
            >
              {status === "submitting" ? "Saving..." : "Confirm buy mark"}
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => router.push(`/u/${token}`)}
              className="flex-1 justify-center"
            >
              Cancel
            </GlassButton>
          </div>
        </>
      ) : (
        <>
          {/* Success icon */}
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

          <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#2B2B2B] text-center">
            Marked as bought
          </h1>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            This gift is now marked as bought and hidden from other shoppers.
          </p>
          {successMsg ? (
            <div className="mt-4 rounded-xl bg-amber-50/80 px-3 py-2 text-sm text-amber-700 text-center">
              {successMsg}
            </div>
          ) : null}
        </>
      )}
    </GlassCard>
  );
}
