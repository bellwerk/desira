"use client";

import { useState } from "react";
import { useToastActions, Spinner } from "@/components/ui";

/**
 * Dev-only button to seed demo data for quick testing.
 * Only renders in development mode.
 */
export function DevSeedButton(): React.ReactElement | null {
  const toast = useToastActions();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    publicUrl: string;
    email: string;
    password: string;
  } | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  async function handleSeed() {
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/seed");
      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error ?? "Failed to seed demo data");
        return;
      }

      toast.success("Demo data created successfully!");
      setResult({
        publicUrl: json.public_url,
        email: json.demo_owner?.email,
        password: json.demo_owner?.password,
      });
    } catch {
      toast.error("Failed to seed demo data");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <span className="text-sm font-medium">Development Mode</span>
      </div>

      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
        Quick testing: Create a demo list with varied item states (reserved, funded, etc.)
      </p>

      <button
        onClick={handleSeed}
        disabled={isLoading}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Spinner size="xs" />
            Creating demo data…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            Seed Demo Data
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 rounded-lg bg-white p-3 dark:bg-slate-800">
          <p className="text-sm font-medium text-[#343338] dark:text-white">Demo Created!</p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-medium">Public URL:</span>{" "}
              <a
                href={result.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 underline hover:text-amber-700 dark:text-amber-400"
              >
                {result.publicUrl}
              </a>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-medium">Owner email:</span>{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">{result.email}</code>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-medium">Password:</span>{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">{result.password}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}






