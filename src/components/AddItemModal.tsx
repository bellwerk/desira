"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createItem } from "@/app/app/lists/actions";

interface AddItemModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemModal({ listId, isOpen, onClose }: AddItemModalProps): React.ReactElement | null {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createItem(formData);
      if (result.success) {
        formRef.current?.reset();
        onClose();
      } else {
        setError(result.error ?? "Failed to add item");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Add wish
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="list_id" value={listId} />

          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g., Wireless headphones"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Product URL */}
          <div>
            <label htmlFor="product_url" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Product link
            </label>
            <input
              type="url"
              id="product_url"
              name="product_url"
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Price and Merchant row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price (CAD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  max="100000"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-7 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="merchant" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Store / Merchant
              </label>
              <input
                type="text"
                id="merchant"
                name="merchant"
                maxLength={100}
                placeholder="e.g., Amazon"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Optional. Paste a link to an image of this item.
            </p>
          </div>

          {/* Public note */}
          <div>
            <label htmlFor="note_public" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Note for gift-givers
            </label>
            <textarea
              id="note_public"
              name="note_public"
              rows={2}
              maxLength={500}
              placeholder="e.g., Size M, color blue preferred"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Private note */}
          <div>
            <label htmlFor="note_private" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Private note
            </label>
            <textarea
              id="note_private"
              name="note_private"
              rows={2}
              maxLength={500}
              placeholder="Only you will see this"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This note is only visible to you.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-rose-600 hover:to-orange-500 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                "Add wish"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

