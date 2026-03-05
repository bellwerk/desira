"use client";

import { GlassCard } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import type { IdeaSuggestion } from "@/lib/ideas/types";

type IdeaCardProps = {
  idea: IdeaSuggestion;
  onAdd: (idea: IdeaSuggestion) => void;
  addLabel?: string;
};

export function IdeaCard({ idea, onAdd, addLabel = "Add" }: IdeaCardProps): React.ReactElement {
  return (
    <GlassCard className="h-full rounded-[24px] p-3 sm:p-4">
      <div className="flex h-full flex-col">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-[18px] bg-white/80">
          <button
            type="button"
            onClick={() => onAdd(idea)}
            aria-label={`${addLabel} ${idea.title}`}
            title={addLabel}
            className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2B2B] text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#1f1f1f] active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {idea.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idea.imageUrl} alt={idea.title} className="h-full w-full object-cover" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f2f2f2] to-[#e2e2e2]">
              <span className="text-sm font-medium text-[#5f5f5f]">Gift idea</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#2b2b2b] sm:text-base">
            {idea.title}
          </h3>

          {typeof idea.priceCents === "number" && idea.priceCents >= 0 ? (
            <p className="text-sm font-medium text-[#4f4f4f]">
              {formatCurrency(idea.priceCents, idea.currency ?? "CAD")}
            </p>
          ) : (
            <p className="text-sm text-[#6b6b6b]">Price not listed</p>
          )}

          {idea.notePublic ? (
            <p className="line-clamp-2 text-xs text-[#6b6b6b]">{idea.notePublic}</p>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

