import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { getRecentPublicIdeas } from "@/lib/ideas/server";
import { IDEA_CATEGORY_FILTERS, type IdeaSuggestion } from "@/lib/ideas/types";

/**
 * GiftSuggestionCard — compact card for the dashboard preview rail
 */
function GiftSuggestionCard({ 
  suggestion
}: { 
  suggestion: IdeaSuggestion;
}): React.ReactElement {
  return (
    <div className="group relative flex-shrink-0 w-[106px] h-[140px] rounded-[15px] bg-white p-1.5">
      <Link
        href="/app/ideas"
        aria-label={`Explore ideas like ${suggestion.title}`}
        className="absolute right-2.5 top-2.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2b2b] shadow-md transition-transform hover:scale-110"
      >
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
      
      {/* Product image */}
      <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 mb-0.5 overflow-hidden">
        {suggestion.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={suggestion.imageUrl}
            alt={suggestion.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      
      {/* Info */}
      <p className="text-xs font-medium text-[#2b2b2b] truncate">{suggestion.title}</p>
      <div className="flex items-center gap-0.5 leading-3">
        <span className="text-xs text-[#4f5f74]" aria-hidden="true">·</span>
        <span className="text-[11px] text-[#2b2b2b]">
          {typeof suggestion.priceCents === "number"
            ? formatCurrency(suggestion.priceCents, suggestion.currency ?? "CAD")
            : "Price n/a"}
        </span>
      </div>
    </div>
  );
}

/**
 * PopularGiftIdeas — Interactive gift ideas section with category pills and product cards
 * Used on the dashboard and empty list state
 */
export async function PopularGiftIdeas(): Promise<React.ReactElement> {
  const mirroredIdeas = (await getRecentPublicIdeas({ poolSize: 24 })).slice(0, 8);
  const previewCategories = IDEA_CATEGORY_FILTERS.filter((category) => category.id !== "all").slice(0, 8);

  return (
    <GlassCard className="w-full max-w-[300px] py-4 sm:max-w-[620px] lg:max-w-[940px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#2b2b2b]">Popular gift ideas</span>
        <Link
          href="/app/ideas"
          className="text-xs font-medium text-[#4a4a4a] hover:text-[#2b2b2b] transition-colors"
        >
          Explore All
        </Link>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        {previewCategories.map((category) => (
          <Link
            key={category.id}
            href={`/app/ideas?category=${category.id}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white text-sm font-medium text-[#2b2b2b] transition-all duration-200 hover:bg-white/80 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-urbanist)]"
          >
            <span>{category.label}</span>
          </Link>
        ))}
      </div>

      {/* Product cards carousel */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {mirroredIdeas.map((suggestion) => (
          <GiftSuggestionCard 
            key={suggestion.id} 
            suggestion={suggestion}
          />
        ))}
      </div>
    </GlassCard>
  );
}

