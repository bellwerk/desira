"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalShellProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
  titleId?: string;
  closeButtonClassName?: string;
};

export function ModalShell({
  isOpen,
  onClose,
  children,
  maxWidthClass = "max-w-2xl",
  panelClassName = "rounded-[30px] bg-[#2b2b2b] p-4 shadow-2xl animate-modal-in sm:p-6",
  showCloseButton = true,
  titleId,
  closeButtonClassName = "absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#4a4a4a] text-white/85 transition-colors hover:bg-[#5a5a5a] hover:text-white sm:right-4 sm:top-4",
}: ModalShellProps): React.ReactElement | null {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        className={`relative z-10 w-full ${maxWidthClass} ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {showCloseButton && (
          <button onClick={onClose} className={closeButtonClassName} aria-label="Close modal">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

