"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GlassCard, BadgeChip } from "@/components/ui";
import { AddItemForm } from "./AddItemForm";

type EmptyListStateProps = {
  listId: string;
  listTitle: string;
  visibilityVariant: "private" | "public" | "unlisted";
  visibilityLabel: string;
};

type ModalStep = "url" | "form";

type GiftIdea = {
  id: string;
  emoji: string;
  label: string;
};

const GIFT_CATEGORIES: GiftIdea[] = [
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
    <div className="group relative flex-shrink-0 w-[106px] h-[140px] rounded-[15px] bg-[#2b2b2b]/15 p-1.5">
      {/* Add button */}
      <button 
        onClick={() => onAdd(suggestion.name)}
        className="absolute right-2.5 top-2.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-[#2b2b2b] shadow-md transition-transform hover:scale-110"
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

function AddWishModal({
  isOpen,
  onClose,
  listId,
  initialTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  initialTitle?: string;
}): React.ReactElement | null {
  const [step, setStep] = useState<ModalStep>(initialTitle ? "form" : "url");
  const [url, setUrl] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // When opening, start at form step if we have an initial title (from gift idea)
      queueMicrotask(() => {
        setStep(initialTitle ? "form" : "url");
      });
    } else {
      queueMicrotask(() => {
        setStep("url");
        setUrl("");
      });
    }
  }, [isOpen, initialTitle]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNext = useCallback(() => {
    setStep("form");
  }, []);

  const handleAddManually = useCallback(() => {
    setUrl("");
    setStep("form");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-modal-in">
        {step === "url" ? (
          /* Step 1: URL Input */
          <div className="rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 hover:text-white hover:bg-[#5a5a5a] transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Title */}
            <h2
              className="text-2xl font-bold text-white text-center mb-2 font-[family-name:var(--font-asul)]"
            >
              Add Wish
            </h2>

            {/* Subtitle */}
            <p className="text-white/70 text-center mb-6 font-[family-name:var(--font-urbanist)]">
              Paste a link from anywhere on the web
            </p>

            {/* URL Input */}
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              autoFocus
              className="w-full rounded-xl bg-[#3a3a3a] border-0 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 mb-4 font-[family-name:var(--font-urbanist)]"
            />

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="w-full rounded-full bg-white py-3 text-center text-base font-semibold text-[#2b2b2b] shadow-sm transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] font-[family-name:var(--font-urbanist)]"
            >
              Next
            </button>

            {/* Add Manually link */}
            <p className="text-center mt-5 text-white/60 font-[family-name:var(--font-urbanist)]">
              Don&apos;t have a link?{" "}
              <button
                onClick={handleAddManually}
                className="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
              >
                Add Manually
              </button>
            </p>
          </div>
        ) : (
          /* Step 2: Full Form */
          <div className="max-h-[85vh] overflow-y-auto">
            <AddItemForm listId={listId} initialUrl={url} initialTitle={initialTitle} onClose={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyListState({
  listId,
  listTitle,
  visibilityVariant,
  visibilityLabel,
}: EmptyListStateProps): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<GiftIdea | null>(null);

  const handleOpenModal = useCallback(() => {
    setSelectedIdea(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedIdea(null);
  }, []);

  const handleIdeaClick = useCallback((idea: GiftIdea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  }, []);

  const handleSuggestionAdd = useCallback((name: string) => {
    // Create a temporary idea object with the product name
    setSelectedIdea({ id: "suggestion", emoji: "", label: name });
    setIsModalOpen(true);
  }, []);

  return (
    <div className="mx-auto max-w-3xl pt-[140px]">
      {/* Floating decorative elements — static for stillness */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/8 to-rose-500/8 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-gradient-to-br from-rose-500/8 to-amber-500/8 blur-3xl" />
      </div>

      {/* Top bar: Back + Settings — subtle, receding */}
      <div className="flex items-center justify-between mb-6 text-[#2b2b2b] font-[family-name:var(--font-urbanist)]">
        <Link
          href="/app/lists"
          className="group inline-flex items-center gap-1.5 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200"
        >
          <svg
            className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <span>Back</span>
        </Link>

        <Link
          href={`/app/lists/${listId}/settings`}
          className="inline-flex items-center gap-1.5 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          <span>Settings</span>
        </Link>
      </div>

      {/* List title + badge — outside card for clear hierarchy */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2b2b2b]">
          {listTitle}
        </h1>
        <BadgeChip variant={visibilityVariant}>
          {visibilityVariant === "private" && (
            <svg
              className="h-3 w-3 mr-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          )}
          {visibilityLabel}
        </BadgeChip>
      </div>

      {/* Main empty state card */}
      <GlassCard className="h-[220px] overflow-hidden py-0 pt-[70px]">
        <div className="flex flex-col items-center justify-center text-center py-0 px-4">
          {/* Empty state illustration */}


          {/* Empty state message - Asul font */}
          <p
            className="text-xl text-[#2b2b2b]/60 font-semibold mb-2.5 max-w-md"
            style={{ fontFamily: "var(--font-asul), serif" }}
          >
            Add your first wish
          </p>

          {/* Add item button - opens modal */}
          <button
            onClick={handleOpenModal}
            className="rounded-full bg-[#9d8df1] px-6 py-2 text-center text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#8a7ae0] hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-urbanist)]"
          >
            Add an item
          </button>
        </div>
      </GlassCard>

      {/* Popular Gift Ideas */}
      <GlassCard className="mt-8 w-full py-4">
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
              onClick={() => handleIdeaClick(category)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-white/20 border border-white/80 dark:border-white/30 text-sm font-medium text-[#2b2b2b] transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/30 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-urbanist)]"
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

      {/* Add Wish Modal */}
      <AddWishModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        listId={listId}
        initialTitle={selectedIdea?.label}
      />
    </div>
  );
}
