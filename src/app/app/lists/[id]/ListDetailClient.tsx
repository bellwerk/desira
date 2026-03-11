"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui";
import { ItemsGrid } from "./ItemsGrid";
import { ShareModal } from "./ShareModal";
import { ListSettingsModal } from "../ListSettingsModal";
import { AddWishModal } from "./AddWishModal";

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
  quantity: number | null;
  most_desired: boolean | null;
};

type ListDetailClientProps = {
  listId: string;
  listTitle: string;
  shareToken: string;
  items: ItemRow[];
  reservedMap: Record<string, boolean>;
  fundedMap: Record<string, number>;
  currency: string;
  initialSuggestion?: string;
  listSettings: {
    id: string;
    title: string;
    recipient_type: string;
    visibility: string;
    occasion: string | null;
    event_date: string | null;
    allow_reservations: boolean;
    allow_contributions: boolean;
    allow_anonymous: boolean;
  };
};

export function ListDetailClient({
  listId,
  listTitle,
  shareToken,
  items,
  reservedMap,
  fundedMap,
  currency,
  initialSuggestion,
  listSettings,
}: ListDetailClientProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [prefillSuggestion, setPrefillSuggestion] = useState(initialSuggestion);
  const [isAddWishModalOpen, setIsAddWishModalOpen] = useState(Boolean(initialSuggestion));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (!initialSuggestion) {
      return;
    }

    router.replace(pathname);
  }, [initialSuggestion, pathname, router]);

  function handleCloseAddWishModal(): void {
    setIsAddWishModalOpen(false);
    setPrefillSuggestion(undefined);
  }

  return (
    <>
      <div className="mt-6 flex flex-col justify-start sm:mt-8 md:mt-10">
        <div className="mb-3 flex justify-start sm:mb-4">
          <Link
            href="/app/lists"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#2b2b2b]/20 bg-white/70 px-4 text-sm font-medium text-[#2b2b2b] transition-colors hover:bg-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to lists
          </Link>
        </div>
        {/* Header section with Add New Wish button and Edit/Share buttons */}
        <div>
          <header className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            {/* Add New Wish button - left side */}
            <div className="flex items-center justify-center lg:justify-start">
              <GlassButton
                onClick={() => setIsAddWishModalOpen(true)}
                variant="primary"
                size="md"
                className="h-11 rounded-full px-5"
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add New Wish
              </GlassButton>
            </div>

            {/* Title centered */}
            <h1 className="text-center text-xl font-semibold text-[#2b2b2b] sm:text-2xl">
              {listTitle}
            </h1>

            {/* Settings/Share buttons - right side */}
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end lg:gap-3">
              <GlassButton
                onClick={() => setIsSettingsModalOpen(true)}
                variant="secondary"
                size="md"
                className="h-11 rounded-full px-5 text-[#2b2b2b]"
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
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                List Settings
              </GlassButton>
              <GlassButton
                onClick={() => setIsShareModalOpen(true)}
                variant="secondary"
                size="md"
                className="h-11 rounded-full px-5 text-[#2b2b2b]"
              >
                Share list
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
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </GlassButton>
            </div>
          </header>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            ITEMS SECTION
            Grid with drag-to-reorder, filtering, and edit capabilities
        ───────────────────────────────────────────────────────────── */}
        <section>
          <ItemsGrid
            items={items}
            reservedMap={reservedMap}
            fundedMap={fundedMap}
            currency={currency}
            listId={listId}
          />
        </section>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareToken={shareToken}
        listTitle={listTitle}
      />

      {/* Settings Modal */}
      <ListSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        list={listSettings}
      />

      <AddWishModal
        isOpen={isAddWishModalOpen}
        onClose={handleCloseAddWishModal}
        listId={listId}
        initialTitle={prefillSuggestion}
      />
    </>
  );
}
