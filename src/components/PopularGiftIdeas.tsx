"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";

type GiftCategory = {
  id: string;
  emoji: string;
  label: string;
};

const GIFT_CATEGORIES: GiftCategory[] = [
  { id: "headphones", emoji: "🎧", label: "Headphones" },
  { id: "skincare", emoji: "✨", label: "Skincare" },
  { id: "books", emoji: "📚", label: "Books" },
  { id: "sneakers", emoji: "👟", label: "Sneakers" },
  { id: "watch", emoji: "⌚", label: "Watches" },
  { id: "bags", emoji: "👜", label: "Bags" },
  { id: "gaming", emoji: "🎮", label: "Gaming" },
  { id: "jewelry", emoji: "💍", label: "Jewelry" },
];

type GiftSuggestion = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
};

// Static gift suggestions for MVP - these could come from an API later
const GIFT_SUGGESTIONS: GiftSuggestion[] = [
  { id: "1", name: "Sony WH-1000XM5 Headphones", price: "CA$449.99", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop" },
  { id: "2", name: "Apple Watch Series 9", price: "CA$549.00", imageUrl: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200&h=200&fit=crop" },
  { id: "3", name: "Nike Air Max 90", price: "CA$189.99", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop" },
  { id: "4", name: "Kindle Paperwhite", price: "CA$169.99", imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop" },
  { id: "5", name: "Dyson Airwrap", price: "CA$699.99", imageUrl: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=200&h=200&fit=crop" },
  { id: "6", name: "Nintendo Switch OLED", price: "CA$449.99", imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=200&h=200&fit=crop" },
];

/**
 * GiftSuggestionCard — displays a gift suggestion with image, name, and price
 */
function GiftSuggestionCard({ 
  suggestion, 
  onAdd 
}: { 
  suggestion: GiftSuggestion; 
  onAdd: (name: string) => void;
}): React.ReactElement {
  return (
    <div className="group relative flex-shrink-0 w-[106px] h-[140px] rounded-[15px] bg-white p-1.5">
      {/* Add button */}
      <button 
        onClick={() => onAdd(suggestion.name)}
        className="absolute right-2.5 top-2.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2b2b] shadow-md transition-transform hover:scale-110"
        aria-label={`Add ${suggestion.name} to a list`}
      >
        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      
      {/* Product image */}
      <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 mb-0.5 overflow-hidden">
        {suggestion.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={suggestion.imageUrl}
            alt={suggestion.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      
      {/* Info */}
      <p className="text-xs font-medium text-[#2b2b2b] truncate">{suggestion.name}</p>
      <div className="flex items-center gap-0.5 leading-3">
        <span className="text-xs text-[#62748e]" aria-hidden="true">·</span>
        <span className="text-[11px] text-[#2b2b2b]">{suggestion.price}</span>
      </div>
    </div>
  );
}

/**
 * PopularGiftIdeas — Interactive gift ideas section with category pills and product cards
 * Used on the dashboard and empty list state
 */
export function PopularGiftIdeas(): React.ReactElement {
  const router = useRouter();

  // Navigate to create list page with pre-filled gift idea
  const handleCategoryClick = useCallback((category: GiftCategory) => {
    // Navigate to create list with the category as a suggested item
    router.push(`/app/lists/new?suggestion=${encodeURIComponent(category.label)}`);
  }, [router]);

  const handleSuggestionAdd = useCallback((name: string) => {
    // Navigate to create list with the product name as a suggested item
    router.push(`/app/lists/new?suggestion=${encodeURIComponent(name)}`);
  }, [router]);

  return (
    <GlassCard className="w-full max-w-[740px] py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#2b2b2b]">Popular gift ideas</span>
        <button className="text-xs font-medium text-[#2b2b2b]/70 hover:text-[#2b2b2b] transition-colors">
          Explore All
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        {GIFT_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white text-sm font-medium text-[#2b2b2b] transition-all duration-200 hover:bg-white/80 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-urbanist)]"
          >
            <span>{category.emoji}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Product cards carousel */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {GIFT_SUGGESTIONS.map((suggestion) => (
          <GiftSuggestionCard 
            key={suggestion.id} 
            suggestion={suggestion} 
            onAdd={handleSuggestionAdd}
          />
        ))}
      </div>
    </GlassCard>
  );
}
