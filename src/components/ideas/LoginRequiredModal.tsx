"use client";

import { useEffect } from "react";
import { GlassButton, GlassCard } from "@/components/ui";

type LoginRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onCreateList: () => void;
};

export function LoginRequiredModal({
  isOpen,
  onClose,
  onSignIn,
  onCreateList,
}: LoginRequiredModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <GlassCard className="relative z-10 w-full max-w-md rounded-[28px] p-5 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[#2b2b2b] transition-colors hover:bg-white"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="pr-10 text-xl font-semibold text-[#2b2b2b] sm:text-2xl">
          Sign in to add this idea
        </h2>
        <p className="mt-2 text-sm text-[#5b5b5b]">
          Create your own list to save gift ideas.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <GlassButton variant="primary" className="h-11 rounded-full" onClick={onSignIn}>
            Sign In
          </GlassButton>
          <GlassButton variant="secondary" className="h-11 rounded-full" onClick={onCreateList}>
            Create your list
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}

