"use client";

import { ModalShell } from "@/components/ModalShell";
import { ShareCard } from "./ShareCard";

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shareToken: string;
  listTitle: string;
};

export function ShareModal({
  isOpen,
  onClose,
  shareToken,
  listTitle,
}: ShareModalProps): React.ReactElement | null {
  // Construct the full share URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${shareToken}`
      : `/u/${shareToken}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      panelClassName="rounded-[30px] bg-[#2b2b2b] p-4 shadow-2xl animate-modal-in sm:p-6"
      titleId="share-modal-title"
    >
      {/* Title */}
      <h2
        id="share-modal-title"
        className="mb-6 text-center text-2xl font-bold text-white"
        style={{ fontFamily: "Asul" }}
      >
        Share your list
      </h2>

      {/* Share Card Content */}
      <div className="relative">
        <ShareCard
          shareToken={shareToken}
          shareUrl={shareUrl}
          listTitle={listTitle}
        />
      </div>
    </ModalShell>
  );
}
