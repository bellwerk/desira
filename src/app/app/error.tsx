"use client";

import { useEffect } from "react";
import { trackClientError } from "@/lib/error-tracking";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackClientError(error, {
      scope: "app.error-boundary",
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-red-600">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="rounded bg-[#2b2b2b] px-4 py-2 text-sm text-white hover:bg-[#3a3a3a]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
