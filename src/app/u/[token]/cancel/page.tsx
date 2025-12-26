"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CancelReservationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [status, setStatus] = useState<
    "idle" | "missing" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) setStatus("missing");
  }, [itemId]);

  async function cancel() {
    if (!itemId) return;

    const stored = localStorage.getItem(`desira_cancel_${itemId}`);
    if (!stored) {
      setStatus("error");
      setErrorMsg("No cancel ticket found in this browser.");
      return;
    }

    let parsed: { reservation_id: string; cancel_token: string } | null = null;
    try {
      parsed = JSON.parse(stored);
    } catch {
      parsed = null;
    }

    if (!parsed?.reservation_id || !parsed?.cancel_token) {
      setStatus("error");
      setErrorMsg("Cancel ticket is corrupted.");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    const res = await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(json?.error ?? "Failed to cancel");
      return;
    }

    localStorage.removeItem(`desira_cancel_${itemId}`);

    setStatus("success");
    setTimeout(() => router.push(`/u/${token}`), 600);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {status === "missing" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Cancel</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Missing item. Go back and tap Cancel from the list.
            </p>
            <button
              className="mt-5 w-full rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
              onClick={() => router.push(`/u/${token}`)}
            >
              Back to list
            </button>
          </>
        ) : status !== "success" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              Cancel reservation
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              This will free the item so others can reserve it. Only works from
              the same browser/device that reserved it.
            </p>

            {status === "error" ? (
              <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:bg-neutral-300"
                onClick={cancel}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Canceling..." : "Confirm cancel"}
              </button>

              <button
                className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300"
                onClick={() => router.push(`/u/${token}`)}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Canceled</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Reservation canceled. Item is available again.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
