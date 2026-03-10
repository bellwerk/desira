"use client";

import { useState, useEffect, useCallback } from "react";
import { ModalShell } from "@/components/ModalShell";
import { GlassButton } from "@/components/ui";
import { DARK_INPUT_BASE_CLASS } from "@/lib/dark-form-styles";
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

  const handleNext = useCallback(() => {
    setStep("form");
  }, []);

  const handleAddManually = useCallback(() => {
    setUrl("");
    setStep("form");
  }, []);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass={step === "url" ? "max-w-md" : "max-w-3xl"}
      panelClassName={step === "url"
        ? "mx-3 rounded-[30px] bg-[#2b2b2b] p-4 shadow-2xl animate-modal-in sm:mx-4 sm:p-6"
        : "mx-3 max-h-[85vh] overflow-y-auto animate-modal-in sm:mx-4"}
      showCloseButton={step === "url"}
    >
      {step === "url" ? (
        <div>
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
            className={`${DARK_INPUT_BASE_CLASS} mb-4 rounded-xl`}
          />

          <GlassButton
            onClick={handleNext}
            variant="secondary"
            size="lg"
            className="h-11 w-full rounded-full bg-white text-[#2b2b2b] hover:bg-gray-100"
          >
            Next
          </GlassButton>

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
        <AddItemForm
          listId={listId}
          initialUrl={url}
          initialTitle={initialTitle}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}
