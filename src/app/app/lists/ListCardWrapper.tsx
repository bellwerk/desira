"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
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
}

export function ListCardWrapper({ list, items, totalWishes, receivedCount }: ListCardWrapperProps): React.ReactElement {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      <div className="w-full max-w-[307px] md:max-w-none mx-auto md:mx-0">
        {/* Card container - glass styling with responsive padding */}
        <GlassCard className="rounded-[21px] p-3 md:p-4 lg:p-5">
          {/* Clickable image grid area */}
          <Link href={`/app/lists/${list.id}`} className="block">
            {/* 2x2 Image grid */}
            <div className="grid grid-cols-2 gap-[2px] mb-1 cursor-pointer transition-opacity hover:opacity-90" style={{ border: '2px solid rgba(255, 255, 255, 1)', borderRadius: '18px' }}>
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
                          src="/logo-hollow.svg" 
                          alt="" 
                          className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
                          style={{ opacity: 0.6 }}
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
              className="flex-1 rounded-[26px] border-2 border-[#2b2b2b] bg-transparent px-3 py-2 text-center text-[10px] md:text-xs lg:text-sm font-semibold text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98]"
            >
              Settings
            </button>
            {/* Only show Share button for public/unlisted lists - private lists produce dead links */}
            {list.visibility !== "private" ? (
              <Link
                href={`/u/${list.share_token}`}
                target="_blank"
                className="flex-1 rounded-[26px] bg-[#2b2b2b] px-3 py-2 text-center text-[10px] md:text-xs lg:text-sm font-semibold text-white transition-all hover:bg-[#3a3a3a] active:scale-[0.98]"
              >
                Share
              </Link>
            ) : (
              <span
                className="flex-1 rounded-[26px] bg-[#2b2b2b]/40 px-3 py-2 text-center text-[10px] md:text-xs lg:text-sm font-semibold text-white/60 cursor-not-allowed"
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
