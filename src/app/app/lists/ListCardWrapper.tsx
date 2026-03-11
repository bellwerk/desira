"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeChip, GlassCard } from "@/components/ui";
import { ListSettingsModal } from "./ListSettingsModal";

interface ListRow {
  id: string;
  title: string;
  recipient_type: string;
  visibility: string;
  occasion: string | null;
  event_date: string | null;
  share_token: string;
  created_at: string;
  owner_id: string;
  allow_reservations: boolean;
  allow_contributions: boolean;
  allow_anonymous: boolean;
}

interface ItemRow {
  id: string;
  list_id: string;
  image_url: string | null;
  status: string;
}

interface ListCardWrapperProps {
  list: ListRow;
  items: ItemRow[];
  totalWishes: number;
  receivedCount: number;
  ownership: "owner" | "shared";
}

function getListTypeMeta(recipientType: string): {
  label: string;
  icon: React.ReactElement;
} {
  const normalized = recipientType.toLowerCase();
  if (normalized === "registry") {
    return {
      label: "Registry",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v13H4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h20M12 7V4a2 2 0 1 0-4 0v3m4 0V4a2 2 0 1 1 4 0v3" />
        </svg>
      ),
    };
  }
  if (normalized === "personal") {
    return {
      label: "Personal",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13H7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
      ),
    };
  }
  return {
    label: "Wishlist",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h20v5H2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V7M12 7H8.5a2.5 2.5 0 1 1 0-5C10.4 2 12 4.2 12 7Zm0 0h3.5a2.5 2.5 0 1 0 0-5C13.6 2 12 4.2 12 7Z" />
      </svg>
    ),
  };
}

export function ListCardWrapper({
  list,
  items,
  totalWishes,
  receivedCount,
  ownership,
}: ListCardWrapperProps): React.ReactElement {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const listType = getListTypeMeta(list.recipient_type);
  const visibilityVariant = (list.visibility === "private" || list.visibility === "unlisted" || list.visibility === "public")
    ? list.visibility
    : "neutral";
  const visibilityLabel = list.visibility === "public"
    ? "Public"
    : list.visibility === "unlisted"
      ? "Unlisted"
      : list.visibility === "private"
        ? "Private"
        : "Visible";

  // Take first 4 items for the 2x2 grid
  const gridItems = items.slice(0, 4);
  // Pad with empty slots if less than 4 items
  while (gridItems.length < 4) {
    gridItems.push({ id: `empty-${gridItems.length}`, list_id: list.id, image_url: null, status: "active" });
  }

  // Calculate progress percentage
  const progressPercent = totalWishes > 0 ? (receivedCount / totalWishes) * 100 : 0;

  return (
    <>
      <div className="w-full min-w-0">
        {/* Card container - glass styling with responsive padding */}
        <GlassCard className="rounded-[21px] p-3 md:p-4 lg:p-5">
          {/* Clickable image grid area */}
          <Link href={`/app/lists/${list.id}`} className="block">
            {/* 2x2 Image grid */}
            <div className="mb-1 grid grid-cols-2 gap-[2px] rounded-[18px] border-2 border-white cursor-pointer transition-opacity hover:opacity-90">
              {gridItems.map((item, index) => {
                // Calculate border radius based on position in 2x2 grid
                let borderRadius = '0px';
                if (index === 0) borderRadius = '16px 0px 0px 0px'; // top-left
                else if (index === 1) borderRadius = '0px 16px 0px 0px'; // top-right
                else if (index === 2) borderRadius = '0px 0px 0px 16px'; // bottom-left
                else if (index === 3) borderRadius = '0px 0px 16px 0px'; // bottom-right

                return (
                  <div
                    key={item.id}
                    className="aspect-square bg-white overflow-hidden"
                    style={{ borderRadius }}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-white flex items-center justify-center" style={{ borderRadius }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/logo.svg" 
                          alt="" 
                          className="h-8 w-8 opacity-60 md:h-10 md:w-10 lg:h-12 lg:w-12"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Title - responsive sizing */}
            <h3 className="text-[18px] md:text-[22px] lg:text-[24px] font-bold text-[#2b2b2b] mb-0 leading-tight hover:text-[#3a3a3a] transition-colors">
              {list.title}
            </h3>
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <BadgeChip variant="neutral" icon={listType.icon}>
              {listType.label}
            </BadgeChip>
            <BadgeChip variant={visibilityVariant}>{visibilityLabel}</BadgeChip>
            {ownership === "shared" && (
              <BadgeChip variant="shared">Shared with me</BadgeChip>
            )}
          </div>

          {/* Stats */}
          <p className="text-[10px] md:text-[12px] lg:text-[13px] text-[#2b2b2b] font-medium" style={{ marginBottom: '6px' }}>
            {totalWishes} wishes • {receivedCount} of {totalWishes} received
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: '10px' }}>
            <div className="h-1 md:h-1.5 w-full rounded-full bg-[#505050] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#9d8df1] to-[#b8a8ff] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action buttons - responsive sizing */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex h-11 flex-1 items-center justify-center rounded-[26px] border-2 border-[#2b2b2b] bg-transparent px-3 text-center text-[10px] font-semibold text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98] md:text-xs lg:text-sm"
            >
              Settings
            </button>
            {/* Only show Share button for public/unlisted lists - private lists produce dead links */}
            {list.visibility !== "private" ? (
              <Link
                href={`/u/${list.share_token}`}
                target="_blank"
                className="flex h-11 flex-1 items-center justify-center rounded-[26px] bg-[#2b2b2b] px-3 text-center text-[10px] font-semibold text-white transition-all hover:bg-[#3a3a3a] active:scale-[0.98] md:text-xs lg:text-sm"
              >
                Share
              </Link>
            ) : (
              <span
                className="flex h-11 flex-1 items-center justify-center rounded-[26px] bg-[#2b2b2b]/40 px-3 text-center text-[10px] font-semibold text-white/80 cursor-not-allowed md:text-xs lg:text-sm"
                title="Private lists cannot be shared via link"
              >
                Share
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Settings Modal */}
      <ListSettingsModal
        list={{
          id: list.id,
          title: list.title,
          recipient_type: list.recipient_type,
          visibility: list.visibility,
          occasion: list.occasion,
          event_date: list.event_date,
          allow_reservations: list.allow_reservations,
          allow_contributions: list.allow_contributions,
          allow_anonymous: list.allow_anonymous,
        }}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

