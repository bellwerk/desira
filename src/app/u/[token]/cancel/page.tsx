"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErrorStateCard, GlassCard, GlassButton } from "@/components/ui";
import { getOrCreateDeviceToken } from "@/lib/device-token";

export default function CancelPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const itemId = search.get("item");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!itemId) {
    return (
      <ErrorStateCard
        title="Missing item"
        message="Missing item reference."
        actionLabel="Back to list"
        actionHref={`/u/${token}`}
        className="mx-auto max-w-md"
      />
    );
  }

  async function confirmCancel(): Promise<void> {
    if (!itemId) return;

    const deviceToken = getOrCreateDeviceToken();
    if (!deviceToken) {
      setErrorMessage("Could not initialize this browser session.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    let cancelToken: string | undefined;
    try {
      const raw = localStorage.getItem(`desira_cancel_${itemId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { cancel_token?: string };
        if (typeof parsed.cancel_token === "string" && parsed.cancel_token.length > 10) {
          cancelToken = parsed.cancel_token;
        }
      }
    } catch {
      // Ignore malformed local storage values.
    }

    const res = await fetch(`/api/gifts/${itemId}/cancel-reservation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deviceToken,
        cancelToken,
        share_token: token,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setIsSubmitting(false);
      setErrorMessage(json?.error ?? "Cancel failed.");
      return;
    }

    try {
      localStorage.removeItem(`desira_cancel_${itemId}`);
    } catch {
      // ignore local storage cleanup errors
    }

    router.push(`/u/${token}`);
    router.refresh();
  }

  return (
    <GlassCard className="mx-auto max-w-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100/80">
        <svg
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <h1 className="mt-4 text-center text-xl font-semibold tracking-tight text-[#2B2B2B]">
        Undo buy mark
      </h1>
      <p className="mt-2 text-center text-sm text-[#4f5f74]">
        This will make the gift available again so others can buy or contribute.
        This only works from the same browser/device that reserved it.
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-xl bg-red-50/80 px-3 py-2 text-center text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        <GlassButton
          variant="primary"
          size="md"
          onClick={confirmCancel}
          loading={isSubmitting}
          className="flex-1 justify-center"
        >
          Confirm cancellation
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="md"
          onClick={() => router.push(`/u/${token}`)}
          className="flex-1 justify-center"
        >
          Back
        </GlassButton>
      </div>
    </GlassCard>
  );
}

