"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeChip, GlassCard } from "@/components/ui";
import { AddWishModal } from "@/app/app/lists/[id]/AddWishModal";
import { seededShuffle } from "@/lib/ideas/shuffle";
import {
  IDEA_CATEGORY_FILTERS,
  type IdeaCategory,
  type IdeaSuggestion,
} from "@/lib/ideas/types";
import { IdeaCard } from "./IdeaCard";
import { ListPickerModal, type UserListOption } from "./ListPickerModal";
import { LoginRequiredModal } from "./LoginRequiredModal";

const SESSION_SEED_KEY = "desira_ideas_session_seed";

type GiftFinderClientProps = {
  ideas: IdeaSuggestion[];
  mode: "app" | "public";
  userLists?: UserListOption[];
  initialDisplayCount?: number;
  initialCategory?: IdeaCategory | "all";
  initialSuggestion?: string;
  initialSuggestionId?: string;
};

export function GiftFinderClient({
  ideas,
  mode,
  userLists = [],
  initialDisplayCount = 24,
  initialCategory = "all",
  initialSuggestion = "",
  initialSuggestionId = "",
}: GiftFinderClientProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<IdeaCategory | "all">(initialCategory);
  const [sessionSeed, setSessionSeed] = useState("ideas-seed");
  const hasBootstrappedSuggestionRef = useRef(false);

  const [selectedIdea, setSelectedIdea] = useState<IdeaSuggestion | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isListPickerOpen, setIsListPickerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let seed = window.sessionStorage.getItem(SESSION_SEED_KEY);
    if (!seed) {
      seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(SESSION_SEED_KEY, seed);
    }

    queueMicrotask(() => setSessionSeed(seed ?? "ideas-seed"));
  }, []);

  useEffect(() => {
    queueMicrotask(() => setActiveCategory(initialCategory));
  }, [initialCategory]);

  useEffect(() => {
    if (mode !== "app" || hasBootstrappedSuggestionRef.current) {
      return;
    }

    const suggestionId = initialSuggestionId.trim();
    const suggestionTitle = initialSuggestion.trim();
    if (!suggestionId && !suggestionTitle) {
      return;
    }

    hasBootstrappedSuggestionRef.current = true;

    const matchedIdeaById = suggestionId ? ideas.find((idea) => idea.id === suggestionId) : null;
    const matchedIdeaByTitle = suggestionTitle
      ? ideas.find((idea) => idea.title === suggestionTitle) ??
        ideas.find((idea) => idea.title.toLowerCase() === suggestionTitle.toLowerCase())
      : null;
    const matchedIdea = matchedIdeaById ?? matchedIdeaByTitle;
    const fallbackIdea: IdeaSuggestion | null =
      !matchedIdea && suggestionTitle
        ? {
            id: suggestionId || `suggestion:${suggestionTitle.toLowerCase()}`,
            title: suggestionTitle,
            imageUrl: null,
            priceCents: null,
            currency: null,
            notePublic: null,
            category: "other",
          }
        : null;
    const selectedContinuationIdea = matchedIdea ?? fallbackIdea;

    const params = new URLSearchParams();
    if (initialCategory !== "all") {
      params.set("category", initialCategory);
    }
    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);

    if (!selectedContinuationIdea) {
      return;
    }

    if (userLists.length === 0) {
      router.push(`/app/lists/new?suggestion=${encodeURIComponent(selectedContinuationIdea.title)}`);
      return;
    }

    queueMicrotask(() => {
      setSelectedIdea(selectedContinuationIdea);
      setIsListPickerOpen(true);
    });
  }, [ideas, initialCategory, initialSuggestion, initialSuggestionId, mode, pathname, router, userLists.length]);

  const shuffledIdeas = useMemo(() => seededShuffle(ideas, sessionSeed), [ideas, sessionSeed]);

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return shuffledIdeas.filter((idea) => {
      if (activeCategory !== "all" && idea.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return `${idea.title} ${idea.notePublic ?? ""}`.toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, query, shuffledIdeas]);

  const visibleIdeas = filteredIdeas.slice(0, initialDisplayCount);

  const loginReturnPath = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    if (selectedIdea) {
      params.set("suggestion_id", selectedIdea.id);
      params.set("suggestion", selectedIdea.title);
    }

    return `/app/ideas${params.size > 0 ? `?${params.toString()}` : ""}`;
  }, [activeCategory, selectedIdea]);

  function resetSelection(): void {
    setSelectedIdea(null);
    setSelectedListId(null);
    setIsAddModalOpen(false);
    setIsListPickerOpen(false);
    setIsLoginModalOpen(false);
  }

  function handleAddIdea(idea: IdeaSuggestion): void {
    setSelectedIdea(idea);

    if (mode === "public") {
      setIsLoginModalOpen(true);
      return;
    }

    if (userLists.length === 0) {
      router.push(`/app/lists/new?suggestion=${encodeURIComponent(idea.title)}`);
      return;
    }

    setIsListPickerOpen(true);
  }

  function handleSelectList(listId: string): void {
    setSelectedListId(listId);
    setIsListPickerOpen(false);
    setIsAddModalOpen(true);
  }

  function handleCreateNewListFromPicker(): void {
    if (!selectedIdea) return;
    router.push(`/app/lists/new?suggestion=${encodeURIComponent(selectedIdea.title)}`);
  }

  function handleCategoryChange(category: IdeaCategory | "all"): void {
    setActiveCategory(category);

    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 pb-8 pt-3 sm:gap-6 sm:pt-4">
        <header className="text-center">
          <h1 className="font-asul text-[32px] leading-tight text-[#2b2b2b] sm:text-[42px]">
            Gift Finder
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5f5f5f] sm:text-base">
            Fresh inspiration from recently added public wishes, personalized with quick filters.
          </p>
          {mode === "public" ? (
            <div className="mt-3">
              <BadgeChip variant="public">Public inspiration feed</BadgeChip>
            </div>
          ) : null}
        </header>

        <GlassCard className="rounded-[24px] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ideas..."
              className="h-11 w-full rounded-full border border-[#2b2b2b]/15 bg-white/80 px-4 text-sm text-[#2b2b2b] outline-none transition focus:border-[#2b2b2b]/35 sm:text-base"
            />

            <div className="flex flex-wrap gap-2">
              {IDEA_CATEGORY_FILTERS.map((filter) => {
                const isActive = activeCategory === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleCategoryChange(filter.id)}
                    className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#2b2b2b] text-white"
                        : "border border-[#2b2b2b]/20 bg-white/70 text-[#2b2b2b] hover:bg-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {visibleIdeas.length > 0 ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onAdd={handleAddIdea}
                addLabel={mode === "public" ? "Add idea" : "Add"}
              />
            ))}
          </section>
        ) : (
          <GlassCard className="rounded-[24px] py-10 text-center sm:py-12">
            <h2 className="text-lg font-semibold text-[#2b2b2b]">No ideas match this filter</h2>
            <p className="mt-2 text-sm text-[#5f5f5f]">Try another keyword or category.</p>
          </GlassCard>
        )}
      </div>

      <ListPickerModal
        isOpen={mode === "app" && isListPickerOpen}
        onClose={resetSelection}
        onSelectList={handleSelectList}
        onCreateNew={handleCreateNewListFromPicker}
        lists={userLists}
        suggestionTitle={selectedIdea?.title ?? "this idea"}
      />

      {mode === "app" && isAddModalOpen && selectedListId && selectedIdea ? (
        <AddWishModal
          isOpen={isAddModalOpen}
          onClose={resetSelection}
          listId={selectedListId}
          initialTitle={selectedIdea.title}
        />
      ) : null}

      <LoginRequiredModal
        isOpen={mode === "public" && isLoginModalOpen}
        onClose={resetSelection}
        onSignIn={() => router.push(`/login?next=${encodeURIComponent(loginReturnPath)}`)}
        onCreateList={() =>
          router.push(
            `/login?signup=true&next=${encodeURIComponent(
              selectedIdea
                ? `/app/lists/new?suggestion=${encodeURIComponent(selectedIdea.title)}`
                : "/app/lists/new"
            )}`
          )
        }
      />
    </>
  );
}

