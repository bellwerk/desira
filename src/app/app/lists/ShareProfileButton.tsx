"use client";

import { useState } from "react";
import { ShareModal } from "./[id]/ShareModal";

type ShareProfileButtonProps = {
  shareToken: string;
  userName: string;
};

export function ShareProfileButton({ shareToken, userName }: ShareProfileButtonProps): React.ReactElement {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsShareModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[#2b2b2b]/20 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#2b2b2b] transition-all hover:bg-white/80 active:scale-[0.98]"
      >
        Share Your Profile
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </button>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareToken={shareToken}
        listTitle={userName}
      />
    </>
  );
}
