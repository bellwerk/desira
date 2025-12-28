"use client";

import { useState } from "react";

export function EnablePayoutsButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setErr(json?.error ?? "Failed to start onboarding");
      return;
    }

    window.location.href = json.url;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-900 ring-1 ring-inset ring-neutral-300 disabled:opacity-50"
        title="Dev-only: connect a Stripe Express account for payouts"
      >
        {loading ? "Opening Stripe…" : "Enable payouts (dev)"}
      </button>
      {err ? <div className="text-xs text-red-600">{err}</div> : null}
    </div>
  );
}
