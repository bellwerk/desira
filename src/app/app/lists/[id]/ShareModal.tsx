"use client";

import { useEffect, useCallback } from "react";
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
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
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

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  // Construct the full share URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${shareToken}`
      : `/u/${shareToken}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl animate-modal-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 hover:text-white hover:bg-[#5a5a5a] transition-colors z-10"
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
          id="share-modal-title"
          className="text-2xl font-bold text-white text-center mb-6"
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
      </div>
    </div>
  );
}
