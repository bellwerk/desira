"use client";

import { useState, useEffect, useCallback } from "react";
import { AddItemForm } from "./AddItemForm";

type ModalStep = "url" | "form";

type AddWishModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  initialTitle?: string;
};

export function AddWishModal({
  isOpen,
  onClose,
  listId,
  initialTitle,
}: AddWishModalProps): React.ReactElement | null {
  const [step, setStep] = useState<ModalStep>("url");
  const [url, setUrl] = useState("");

  // Pre-filled ideas should land on the form immediately; manual adds still begin with the URL step.
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setStep(initialTitle ? "form" : "url");
      });
      return;
    }

    queueMicrotask(() => {
      setStep("url");
      setUrl("");
    });
  }, [initialTitle, isOpen]);

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

  const handleNext = useCallback(() => {
    setStep("form");
  }, []);

  const handleAddManually = useCallback(() => {
    setUrl("");
    setStep("form");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 mx-3 w-full max-w-md animate-modal-in sm:mx-4">
        {step === "url" ? (
          <div className="rounded-[30px] bg-[#2b2b2b] p-4 shadow-2xl sm:p-6">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 transition-colors hover:bg-[#5a5a5a] hover:text-white sm:right-4 sm:top-4"
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

            <h2 className="text-2xl font-bold text-white text-center mb-2 font-[family-name:var(--font-asul)]">
              Add Wish
            </h2>

            <p className="text-white/70 text-center mb-6 font-[family-name:var(--font-urbanist)]">
              Paste a link from anywhere on the web
            </p>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              autoFocus
              className="w-full rounded-xl bg-[#3a3a3a] border-0 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 mb-4 font-[family-name:var(--font-urbanist)]"
            />

            <button
              onClick={handleNext}
              className="w-full rounded-full bg-white py-3 text-center text-base font-semibold text-[#2b2b2b] shadow-sm transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] font-[family-name:var(--font-urbanist)]"
            >
              Next
            </button>

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
          <div className="max-h-[85vh] overflow-y-auto">
            <AddItemForm
              listId={listId}
              initialUrl={url}
              initialTitle={initialTitle}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
