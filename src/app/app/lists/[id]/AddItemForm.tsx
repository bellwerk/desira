"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "../actions";
import { useLinkPreview } from "@/hooks/useLinkPreview";

type AddItemFormProps = {
  listId: string;
  /** Pre-filled URL from the modal's first step */
  initialUrl?: string;
  /** Pre-filled title (e.g., from gift idea suggestion) */
  initialTitle?: string;
  /** Callback when form should close (used in modal context) */
  onClose?: () => void;
};

type ImageOption = "url" | "camera" | "none";
type ModalStep = "url" | "form";

export function AddItemForm({ listId, initialUrl, initialTitle, onClose }: AddItemFormProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // If used in modal context (onClose provided), start with form step; otherwise closed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("url");
  const [modalUrl, setModalUrl] = useState("");
  const [productUrlInput, setProductUrlInput] = useState(initialUrl ?? "");
  // Standalone mode: when used without onClose, we manage our own modal
  const isStandaloneMode = !onClose;
  // Effective URL: user-editable product URL from the form
  const effectiveUrl = productUrlInput;
  
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [imageOption, setImageOption] = useState<ImageOption>("camera");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isMostDesired, setIsMostDesired] = useState(false);

  // Form field refs for autofill
  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  // Track which fields were autofilled (for visual feedback)
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());

  // Link preview hook
  const {
    status: previewStatus,
    data: previewData,
    error: previewError,
    reset: resetPreview,
    fetch: fetchPreview,
  } = useLinkPreview();

  // Compute final image URL based on selected option
  const imageUrlValue = (() => {
    switch (imageOption) {
      case "camera":
        return previewData?.image ?? "";
      case "url":
        return manualImageUrl;
      case "none":
      default:
        return "";
    }
  })();

  // Autofill fields from preview data
  const handleAutofill = useCallback(() => {
    if (!previewData) return;

    const filled = new Set<string>();

    // Autofill title if empty
    if (titleRef.current && !titleRef.current.value && previewData.title) {
      titleRef.current.value = previewData.title;
      filled.add("title");
    }

    // Only mark image as autofilled when using the URL option
    if (previewData.image && imageOption === "camera") {
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
  }, [previewData, imageOption]);

  // Auto-fill when preview data arrives
  useEffect(() => {
    if (previewStatus === "success" && previewData) {
      // Use queueMicrotask to avoid calling setState directly in effect
      queueMicrotask(() => handleAutofill());
    }
  }, [previewStatus, previewData, handleAutofill]);

  // Reset form state when closing
  const handleClose = useCallback(() => {
    if (onClose) {
      // Modal context: call parent's close handler
      onClose();
    } else {
      // Standalone mode: close our own modal
      setIsModalOpen(false);
    }
    // Reset all state
    queueMicrotask(() => {
      setModalStep("url");
      setModalUrl("");
      setProductUrlInput("");
      setError(null);
      resetPreview();
      setAutofilledFields(new Set());
      setQuantity(1);
      setImageOption("camera");
      setManualImageUrl("");
      setIsMostDesired(false);
    });
  }, [onClose, resetPreview]);

  // Trigger link preview for initialUrl from modal (non-standalone mode)
  useEffect(() => {
    if (initialUrl) {
      fetchPreview(initialUrl);
      queueMicrotask(() => setProductUrlInput(initialUrl));
    }
  }, [initialUrl, fetchPreview]);

  // Handle modal step navigation
  const handleNext = useCallback(() => {
    if (modalUrl) {
      fetchPreview(modalUrl);
    }
    setProductUrlInput(modalUrl);
    setModalStep("form");
  }, [modalUrl, fetchPreview]);

  const handleAddManually = useCallback(() => {
    setModalUrl("");
    setProductUrlInput("");
    setModalStep("form");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const isOpen = isStandaloneMode ? isModalOpen : true;
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      // Cmd/Ctrl + Enter to submit (only on form step)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && modalStep === "form") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isStandaloneMode, isModalOpen, modalStep, handleClose]);

  // Prevent body scroll when modal is open (only in standalone mode)
  // In embedded mode, the parent modal manages body scroll lock
  useEffect(() => {
    if (!isStandaloneMode) return;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isStandaloneMode, isModalOpen]);

  async function handleSubmit(formData: FormData): Promise<void> {
    formData.set("list_id", listId);
    formData.set("quantity", quantity.toString());
    formData.set("most_desired", isMostDesired.toString());
    if (effectiveUrl) {
      formData.set("product_url", effectiveUrl);
    }
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

  // Quantity controls
  const decrementQuantity = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const incrementQuantity = useCallback(() => {
    setQuantity((q) => q + 1);
  }, []);

  // Helper for autofill highlight class
  const getAutofillClass = (field: string) =>
    autofilledFields.has(field)
      ? "ring-2 ring-emerald-500/50"
      : "";

  // Input base classes for dark modal style
  const inputBaseClass = "block w-full rounded-xl bg-[#3a3a3a] border-0 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 font-[family-name:var(--font-urbanist)]";
  const textareaClass = "block w-full rounded-xl bg-[#3a3a3a] border-0 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 font-[family-name:var(--font-urbanist)] resize-y min-h-[80px]";

  // Form rendering function
  const formContent = (
      <div className="rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={handleClose}
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
          className="text-2xl font-bold text-white text-center mb-6"
          style={{ fontFamily: "Asul" }}
        >
          Wish Details
        </h2>

        {/* Loading indicator */}
        {previewStatus === "loading" && (
          <div className="mb-5 rounded-xl bg-[#9d8df1]/20 px-4 py-3 text-sm text-white/90">
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="font-[family-name:var(--font-urbanist)]">
                Loading product details...
              </span>
            </div>
          </div>
        )}

        {previewStatus === "error" && previewError && (
          <div className="mb-5 rounded-xl bg-amber-500/20 px-4 py-3 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>{previewError}</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form ref={formRef} action={handleSubmit} className="space-y-5">
          {/* Product URL */}
          <div>
            <label htmlFor="product_url" className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
              Product URL <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="url"
              id="product_url"
              name="product_url"
              value={productUrlInput}
              onChange={(e) => {
                const url = e.target.value;
                setProductUrlInput(url);
                fetchPreview(url);
              }}
              placeholder="https://example.com/product"
              className={`${inputBaseClass} ${getAutofillClass("product_url")}`}
            />
          </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
            Title
          </label>
          <input
            ref={titleRef}
            type="text"
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={initialTitle ?? ""}
            placeholder="e.g., Wireless headphones"
            className={`${inputBaseClass} ${getAutofillClass("title")}`}
          />
        </div>

        {/* Price + Quantity row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
              Price
            </label>
            <div className="flex rounded-xl bg-[#3a3a3a] overflow-hidden">
              <div className="flex items-center justify-center px-4 bg-[#4a4a4a] text-white font-medium">
                $
              </div>
              <input
                ref={priceRef}
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`flex-1 bg-transparent border-0 px-3 py-3.5 text-white placeholder:text-white/40 focus:outline-none font-[family-name:var(--font-urbanist)] ${getAutofillClass("price")}`}
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
              Quantity
            </label>
            <div className="flex rounded-xl bg-[#3a3a3a] overflow-hidden">
              <button
                type="button"
                onClick={decrementQuantity}
                className="flex items-center justify-center w-12 bg-[#4a4a4a] text-white hover:bg-[#5a5a5a] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <div className="flex-1 flex items-center justify-center py-3.5 text-white font-medium font-[family-name:var(--font-urbanist)]">
                {quantity}
              </div>
              <button
                type="button"
                onClick={incrementQuantity}
                className="flex items-center justify-center w-12 bg-[#4a4a4a] text-white hover:bg-[#5a5a5a] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="note_public" className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
            Description
          </label>
          <textarea
            id="note_public"
            name="note_public"
            maxLength={500}
            placeholder="e.g. Size Medium, The one in red, etc."
            className={textareaClass}
          />
        </div>

        {/* Image section */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 font-[family-name:var(--font-urbanist)]">
            Image
          </label>
          
          {/* Hidden input for image URL */}
          <input
            ref={imageUrlRef}
            type="hidden"
            id="image_url"
            name="image_url"
            value={imageUrlValue}
          />

          <div className="flex gap-3">
            {/* From product link option (camera icon) */}
            <button
              type="button"
              onClick={() => setImageOption("camera")}
              title="Use image from product link"
              className={`relative flex-shrink-0 w-20 h-16 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                imageOption === "camera"
                  ? "bg-white/20 ring-2 ring-[#9d8df1]"
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
              }`}
            >
              {previewData?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewData.image}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <svg className="h-6 w-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0a.225.225 0 11-.45 0 .225.225 0 01.45 0z" />
                </svg>
              )}
              {imageOption === "camera" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#9d8df1] rounded-full flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>

            {/* Manual URL option (link icon) */}
            <button
              type="button"
              onClick={() => setImageOption("url")}
              title="Paste image URL"
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                imageOption === "url"
                  ? "bg-white/20 ring-2 ring-[#9d8df1]"
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
              }`}
            >
              {imageOption === "url" && manualImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manualImageUrl}
                  alt="Custom"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Hide broken image, show icon instead
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <svg className={`h-6 w-6 text-white/70 ${imageOption === "url" && manualImageUrl ? "hidden" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {imageOption === "url" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#9d8df1] rounded-full flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>

            {/* No image option (X icon) */}
            <button
              type="button"
              onClick={() => setImageOption("none")}
              title="No image"
              className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                imageOption === "none"
                  ? "bg-white/20 ring-2 ring-[#9d8df1]"
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
              }`}
            >
              <svg className="h-6 w-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              {imageOption === "none" && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#9d8df1] rounded-full flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Manual URL input - shown when "url" option is selected */}
          {imageOption === "url" && (
            <div className="mt-3">
              <input
                type="url"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={inputBaseClass}
              />
            </div>
          )}
        </div>

        {/* Most Desired toggle */}
        <button
          type="button"
          onClick={() => setIsMostDesired(!isMostDesired)}
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
            isMostDesired
              ? "bg-[#9d8df1]/20"
              : "bg-transparent hover:bg-white/5"
          }`}
        >
          <svg
            className={`h-5 w-5 transition-colors ${
              isMostDesired ? "text-yellow-400 fill-yellow-400" : "text-white/50"
            }`}
            viewBox="0 0 24 24"
            fill={isMostDesired ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
          <span className="text-white font-medium font-[family-name:var(--font-urbanist)]">
            Most Desired
          </span>
        </button>

        {/* Save button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-[#9D8DF1] py-3.5 text-center text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#8A7AE0] hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 font-[family-name:var(--font-urbanist)]"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            "Save Wish"
          )}
        </button>
      </form>
    </div>
  );

  // Standalone mode: render button + modal
  if (isStandaloneMode) {
    return (
      <>
        {/* Purple pill button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#9d8df1] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#8a7be0] active:scale-[0.98]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add New Wish
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={handleClose}
            />

            {/* Modal content */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-modal-in">
              {modalStep === "url" ? (
                /* Step 1: URL Input */
                <div className="rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl relative">
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 hover:text-white hover:bg-[#5a5a5a] transition-colors"
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
                    className="text-2xl font-bold text-white text-center mb-2"
                    style={{ fontFamily: "Asul" }}
                  >
                    Add Wish
                  </h2>

                  {/* Subtitle */}
                  <p className="text-white/70 text-center mb-6 font-[family-name:var(--font-urbanist)]">
                    Paste a link from anywhere on the web
                  </p>

                  {/* URL Input */}
                  <input
                    type="url"
                    value={modalUrl}
                    onChange={(e) => setModalUrl(e.target.value)}
                    placeholder="https://"
                    autoFocus
                    className="w-full rounded-xl bg-[#3a3a3a] border-0 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 mb-4 font-[family-name:var(--font-urbanist)]"
                  />

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    className="w-full rounded-full bg-white py-3 text-center text-base font-semibold text-[#2b2b2b] shadow-sm transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] font-[family-name:var(--font-urbanist)]"
                  >
                    Next
                  </button>

                  {/* Add Manually link */}
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
                /* Step 2: Full Form */
                <div className="max-h-[85vh] overflow-y-auto">
                  {formContent}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Non-standalone mode (used inside parent modal): just render the form
  return formContent;
}
