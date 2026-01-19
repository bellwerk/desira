"use client";

import { GlassCard } from "./GlassCard";

type LinkPreviewStatus = "idle" | "loading" | "success" | "error";

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  price?: { amount: number; currency: string };
  favicon?: string;
}

interface LinkPreviewCardProps {
  status: LinkPreviewStatus;
  data?: LinkPreviewData;
  error?: string;
  onRefresh?: () => void;
  className?: string;
}

/**
 * LinkPreviewCard — shows URL metadata preview (M3)
 *
 * States:
 * - idle: nothing shown
 * - loading: skeleton
 * - success: image + title + domain + price
 * - error: error message + manual entry prompt
 *
 * TODO: Wire to /api/link-preview when implemented
 */
export function LinkPreviewCard({
  status,
  data,
  error,
  onRefresh,
  className = "",
}: LinkPreviewCardProps): React.ReactElement | null {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <GlassCard variant="dense" className={`animate-pulse ${className}`}>
        <div className="flex gap-3">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-200/60 dark:bg-slate-700/60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200/60 dark:bg-slate-700/60" />
            <div className="h-3 w-1/2 rounded bg-slate-200/60 dark:bg-slate-700/60" />
            <div className="h-3 w-1/4 rounded bg-slate-200/60 dark:bg-slate-700/60" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "error") {
    return (
      <GlassCard variant="dense" className={`border-amber-200/50 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span className="text-xs">
              {error || "Couldn't fetch details. You can still add this item manually."}
            </span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Retry
            </button>
          )}
        </div>
      </GlassCard>
    );
  }

  // success
  return (
    <GlassCard variant="dense" className={className}>
      <div className="flex gap-3">
        {data?.image && (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {data?.title && (
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {data.title}
            </p>
          )}
          {data?.domain && (
            <div className="flex items-center gap-1.5">
              {data.favicon && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={data.favicon}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 rounded-sm"
                  onError={(e) => {
                    // Hide on error
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {data.domain}
              </p>
            </div>
          )}
          {data?.price && (
            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              {data.price.currency} {data.price.amount.toFixed(2)}
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="shrink-0 self-start text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Refresh preview"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        )}
      </div>
    </GlassCard>
  );
}



