"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GlassCard, GlassButton } from "@/components/ui";

export default function ReservePage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [openDetails, setOpenDetails] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(token) && Boolean(itemId) && status !== "submitting",
    [token, itemId, status]
  );

  async function submit(): Promise<void> {
    if (!itemId) return;
    setStatus("submitting");
    setErrorMsg(null);

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
      setErrorMsg(json?.error ?? "Failed to reserve");
      return;
    }

    // Store cancel ticket locally (same browser/device can cancel)
    if (json?.reservation?.id && json?.cancel_token) {
      localStorage.setItem(
        `desira_cancel_${itemId}`,
        JSON.stringify({
          reservation_id: json.reservation.id,
          cancel_token: json.cancel_token,
        })
      );
    }

    setStatus("success");
    setTimeout(() => router.push(`/u/${token}`), 600);
  }

  return (
    <GlassCard className="mx-auto max-w-md">
      {!itemId ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-[#2B2B2B]">
            Reserve
          </h1>
          <p className="mt-2 text-sm text-[#62748e]">
            Missing item. Go back and tap Reserve from the list.
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
      ) : status !== "success" ? (
        <>
          {/* Reserve icon */}
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
            Reserve this gift
          </h1>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            Reserve this gift so nobody else buys it. You stay anonymous to
            others.
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
              {status === "submitting" ? "Reserving..." : "Confirm reservation"}
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
            Reserved
          </h1>
          <p className="mt-2 text-sm text-[#62748e] text-center">
            Reserved. You stay anonymous to others.
          </p>
        </>
      )}
    </GlassCard>
  );
}
