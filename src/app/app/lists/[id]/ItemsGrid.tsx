"use client";

import { useState } from "react";
import { ItemCard } from "./ItemCard";
import { GlassCard } from "@/components/ui";

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  note_private: string | null;
  status: string;
  sort_order: number | null;
};

type ItemsGridProps = {
  items: ItemRow[];
  reservedMap: Record<string, boolean>;
  fundedMap: Record<string, number>;
  currency: string;
  shareToken: string;
};

export function ItemsGrid({
  items,
  reservedMap,
  fundedMap,
  currency,
  shareToken,
}: ItemsGridProps): React.ReactElement {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div>
      {/* Header with toggle */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Items ({items.length})
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {previewMode ? "Visitor preview" : "Owner view"}
          </span>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`
              relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
              border-2 border-transparent transition-colors duration-200 ease-in-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2
              ${previewMode 
                ? "bg-gradient-to-r from-rose-500 to-amber-500" 
                : "bg-slate-200 dark:bg-slate-700"
              }
            `}
            role="switch"
            aria-checked={previewMode}
            aria-label="Toggle visitor preview mode"
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full 
                bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                ${previewMode ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>
      </div>

      {/* Preview mode banner */}
      {previewMode && (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-200/50 dark:border-rose-500/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-rose-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Visitor Preview Mode
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                This is how visitors see your list. Buttons are shown but disabled in preview.
                Use the{" "}
                <a
                  href={`/u/${shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-rose-600 dark:text-rose-400 hover:text-rose-700"
                >
                  public link
                </a>{" "}
                to fully test actions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 ? (
        <GlassCard className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400">
            No items yet. Add your first wish above!
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const isReserved = Boolean(reservedMap[item.id]);
            const funded = fundedMap[item.id] ?? 0;
            const target = item.target_amount_cents ?? item.price_cents ?? 0;
            const isFunded =
              item.status === "funded" || (target > 0 && funded >= target);

            return (
              <ItemCard
                key={item.id}
                item={item}
                isReserved={isReserved}
                isFunded={isFunded}
                fundedAmount={funded}
                currency={currency}
                isOwner={!previewMode}
                isPreview={previewMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

