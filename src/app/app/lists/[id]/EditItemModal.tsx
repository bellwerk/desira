"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "../actions";
import { GlassButton, useToastActions } from "@/components/ui";

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

type EditItemModalProps = {
  item: ItemRow;
  isOpen: boolean;
  onClose: () => void;
};

function formatCentsToInput(cents: number | null | undefined): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2);
}

export function EditItemModal({
  item,
  isOpen,
  onClose,
}: EditItemModalProps): React.ReactElement | null {
  const router = useRouter();
  const toast = useToastActions();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap and escape handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus first input when modal opens
    setTimeout(() => firstInputRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const form = modalRef.current?.querySelector("form");
        if (form) {
          form.requestSubmit();
        }
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

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      formData.set("id", item.id);
      setError(null);

      startTransition(async () => {
        const result = await updateItem(formData);
        if (result.success) {
          toast.success("Item updated");
          onClose();
          router.refresh();
        } else {
          setError(result.error ?? "Failed to update item");
        }
      });
    },
    [item.id, onClose, router, toast]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg glass-1 rounded-[30px] p-6 shadow-2xl animate-modal-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        {/* Gradient overlay for visual depth */}
        <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-violet-500/5 via-transparent to-rose-500/5 pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-violet-600 dark:text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
            </div>
            <h2
              id="edit-modal-title"
              className="text-lg font-semibold text-[#343338] dark:text-white"
            >
              Edit item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="relative z-10 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form action={handleSubmit} className="relative z-10 space-y-5">
          {/* Preserve quantity and most_desired values during edit */}
          <input
            type="hidden"
            name="quantity"
            value={item.quantity ?? 1}
          />
          <input
            type="hidden"
            name="most_desired"
            value={item.most_desired ? "true" : "false"}
          />

          {/* Title */}
          <div>
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
            >
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="edit-title"
              name="title"
              required
              maxLength={200}
              defaultValue={item.title}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500"
            />
          </div>

          {/* Product URL */}
          <div>
            <label
              htmlFor="edit-product_url"
              className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
            >
              Product URL
              <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                optional
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
              </div>
              <input
                type="url"
                id="edit-product_url"
                name="product_url"
                defaultValue={item.product_url ?? ""}
                placeholder="https://example.com/product"
                className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Price */}
            <div>
              <label
                htmlFor="edit-price"
                className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
              >
                Price (CAD)
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  optional
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  $
                </div>
                <input
                  type="number"
                  id="edit-price"
                  name="price"
                  min="0"
                  step="0.01"
                  defaultValue={formatCentsToInput(item.price_cents)}
                  placeholder="0.00"
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label
                htmlFor="edit-image_url"
                className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
              >
                Image URL
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  optional
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </svg>
                </div>
                <input
                  type="url"
                  id="edit-image_url"
                  name="image_url"
                  defaultValue={item.image_url ?? ""}
                  placeholder="https://..."
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Notes section */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Public note */}
            <div>
              <label
                htmlFor="edit-note_public"
                className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
              >
                Public note
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  visible to all
                </span>
              </label>
              <textarea
                id="edit-note_public"
                name="note_public"
                rows={2}
                maxLength={500}
                defaultValue={item.note_public ?? ""}
                placeholder="e.g., Size M, color blue"
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500 resize-none"
              />
            </div>

            {/* Private note */}
            <div>
              <label
                htmlFor="edit-note_private"
                className="block text-sm font-medium text-[#343338] dark:text-slate-200 mb-1.5"
              >
                Private note
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  only you
                </span>
              </label>
              <textarea
                id="edit-note_private"
                name="note_private"
                rows={2}
                maxLength={500}
                defaultValue={item.note_private ?? ""}
                placeholder="e.g., Alternative options"
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#343338] placeholder:text-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500 resize-none"
              />
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono">Enter</kbd> to save
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <GlassButton type="submit" variant="primary" size="md" loading={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
