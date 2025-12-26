"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ReservePage() {
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

  async function submit() {
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
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {!itemId ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Reserve</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Missing item. Go back and tap Reserve from the list.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
              onClick={() => router.push(`/u/${token}`)}
            >
              Back to list
            </button>
          </>
        ) : status !== "success" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              Reserve this gift
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Reserve this gift so nobody else buys it. You stay anonymous to
              others.
            </p>

            <button
              type="button"
              className="mt-4 text-sm text-neutral-700 underline underline-offset-4"
              onClick={() => setOpenDetails((v) => !v)}
            >
              {openDetails ? "Hide optional details" : "Add optional details"}
            </button>

            {openDetails ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm text-neutral-700">Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="text-sm text-neutral-700">Email</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Optional (only owner can see)"
                  />
                </div>
              </div>
            ) : null}

            {status === "error" ? (
              <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:bg-neutral-300"
                onClick={submit}
                disabled={!canSubmit}
              >
                {status === "submitting" ? "Reserving..." : "Confirm reservation"}
              </button>

              <button
                type="button"
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
                onClick={() => router.push(`/u/${token}`)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Reserved</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Reserved. You stay anonymous to others.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
