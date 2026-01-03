"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "../actions";
import { useLinkPreview } from "@/hooks/useLinkPreview";
import { LinkPreviewCard } from "@/components/ui/LinkPreviewCard";

export function AddItemForm({ listId }: { listId: string }): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form field refs for autofill
  const titleRef = useRef<HTMLInputElement>(null);
  const productUrlRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  // Track which fields were autofilled (for visual feedback)
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());

  // Link preview hook
  const {
    status: previewStatus,
    data: previewData,
    error: previewError,
    fetch: fetchPreview,
    reset: resetPreview,
  } = useLinkPreview();

  // Handle URL change with debounced preview
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      fetchPreview(url);
    },
    [fetchPreview]
  );

  // Autofill fields from preview data
  const handleAutofill = useCallback(() => {
    if (!previewData) return;

    const filled = new Set<string>();

    // Autofill title if empty
    if (titleRef.current && !titleRef.current.value && previewData.title) {
      titleRef.current.value = previewData.title;
      filled.add("title");
    }

    // Autofill image URL if empty
    if (imageUrlRef.current && !imageUrlRef.current.value && previewData.image) {
      imageUrlRef.current.value = previewData.image;
      filled.add("image_url");
    }

    // Autofill price if empty and we have price data
    if (priceRef.current && !priceRef.current.value && previewData.price) {
      // Price from API is already in dollars (not cents)
      priceRef.current.value = previewData.price.amount.toFixed(2);
      filled.add("price");
    }

    setAutofilledFields(filled);

    // Clear autofill highlights after a delay
    if (filled.size > 0) {
      setTimeout(() => setAutofilledFields(new Set()), 2000);
    }
  }, [previewData]);

  // Auto-fill when preview data arrives
  useEffect(() => {
    if (previewStatus === "success" && previewData) {
      // Use queueMicrotask to avoid calling setState directly in effect
      queueMicrotask(() => handleAutofill());
    }
  }, [previewStatus, previewData, handleAutofill]);

  // Reset form state when closing
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setError(null);
    resetPreview();
    setAutofilledFields(new Set());
  }, [resetPreview]);

  async function handleSubmit(formData: FormData): Promise<void> {
    formData.set("list_id", listId);
    setError(null);

    startTransition(async () => {
      const result = await addItem(formData);
      if (result.success) {
        handleClose();
        router.refresh();
      } else {
        setError(result.error ?? "Failed to add item");
      }
    });
  }

  // Force refresh preview
  const handleRefreshPreview = useCallback(() => {
    const url = productUrlRef.current?.value;
    if (url) {
      fetchPreview(url, true);
    }
  }, [fetchPreview]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add an item
      </button>
    );
  }

  // Helper for autofill highlight class
  const getAutofillClass = (field: string) =>
    autofilledFields.has(field)
      ? "ring-2 ring-emerald-500/50 border-emerald-400 dark:border-emerald-500"
      : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add new item</h3>
        <button
          onClick={handleClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {/* Product URL — moved to top for link preview flow */}
        <div>
          <label htmlFor="product_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Product URL <span className="text-slate-400">(optional — paste to auto-fill)</span>
          </label>
          <input
            ref={productUrlRef}
            type="url"
            id="product_url"
            name="product_url"
            placeholder="https://example.com/product"
            onChange={handleUrlChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Link Preview Card */}
        {previewStatus !== "idle" && (
          <LinkPreviewCard
            status={previewStatus}
            data={
              previewData
                ? {
                    title: previewData.title ?? undefined,
                    description: previewData.description ?? undefined,
                    image: previewData.image ?? undefined,
                    domain: previewData.domain,
                    price: previewData.price ?? undefined,
                  }
                : undefined
            }
            error={previewError ?? undefined}
            onRefresh={handleRefreshPreview}
            className="mt-2"
          />
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            id="title"
            name="title"
            required
            maxLength={200}
            placeholder="e.g., Wireless headphones"
            className={`mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all ${getAutofillClass("title")}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Price (CAD) <span className="text-slate-400">(optional)</span>
            </label>
            <input
              ref={priceRef}
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all ${getAutofillClass("price")}`}
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Image URL <span className="text-slate-400">(optional)</span>
            </label>
            <input
              ref={imageUrlRef}
              type="url"
              id="image_url"
              name="image_url"
              placeholder="https://..."
              className={`mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all ${getAutofillClass("image_url")}`}
            />
          </div>
        </div>

        {/* Public note */}
        <div>
          <label htmlFor="note_public" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Public note <span className="text-slate-400">(visible to all)</span>
          </label>
          <textarea
            id="note_public"
            name="note_public"
            rows={2}
            maxLength={500}
            placeholder="e.g., Size M, color blue preferred"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Private note */}
        <div>
          <label htmlFor="note_private" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Private note <span className="text-slate-400">(only you)</span>
          </label>
          <textarea
            id="note_private"
            name="note_private"
            rows={2}
            maxLength={500}
            placeholder="e.g., Alternative options, personal reminders"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-rose-600 hover:to-orange-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              "Add item"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
