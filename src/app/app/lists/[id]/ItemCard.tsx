"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/IconButton";
import { ItemCardMedia } from "@/components/item-card/ItemCardMedia";
import { LinkedItemTitle } from "@/components/item-card/LinkedItemTitle";
import { MostDesiredBadge } from "@/components/item-card/MostDesiredBadge";
import { ModalShell } from "@/components/ModalShell";
import { GlassCard, ProgressBar, useToastActions } from "@/components/ui";
import { getItemRedirectPath } from "@/lib/affiliate";
import { formatCurrency } from "@/lib/currency";
import { deleteItem, toggleMostDesired } from "../actions";
import { EditItemModal } from "./EditItemModal";

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
  list_id?: string;
  quantity: number | null;
  most_desired: boolean | null;
};

type ItemCardProps = {
  item: ItemRow;
  isReserved: boolean;
  isFunded: boolean;
  fundedAmount: number;
  currency: string;
  isOwner?: boolean;
  isPreview?: boolean;
  listId?: string;
};

const OWNER_RECEIVED_UNDO_WINDOW_MS = 12_000;

function getOwnerUndoStorageKey(itemId: string): string {
  return `desira_owner_undo_received_${itemId}`;
}

/**
 * ItemCard — displays a wish item with glass styling
 * 
 * Features:
 * - Edit and delete icon buttons for owners
 * - Fixed touch targets (44x44 minimum on mobile)
 * - Proper image placeholder with favicon
 * - Funding progress bar with inline withdraw button
 * - Better private note styling
 */
export function ItemCard({
  item,
  isReserved,
  isFunded,
  fundedAmount,
  currency,
  isOwner = true,
  isPreview = false,
}: ItemCardProps): React.ReactElement {
  const router = useRouter();
  const toast = useToastActions();
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOwnerBuySheetOpen, setIsOwnerBuySheetOpen] = useState(false);
  const [undoPreviousStatus, setUndoPreviousStatus] = useState<string | null>(null);
  const [undoExpiresAt, setUndoExpiresAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const target = item.target_amount_cents ?? item.price_cents ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((fundedAmount / target) * 100)) : 0;
  const productRedirectPath = item.product_url ? getItemRedirectPath(item.id) : null;
  const storeLabel = (() => {
    if (!item.product_url) return "Store";
    try {
      const host = new URL(item.product_url).hostname.replace(/^www\./i, "");
      const root = host.split(".")[0] ?? "store";
      return root.charAt(0).toUpperCase() + root.slice(1);
    } catch {
      return "Store";
    }
  })();

  // Business rule: disable buy-lock if contributions exist
  const hasContributions = fundedAmount > 0;
  const isReceived = item.status === "received" || undoExpiresAt !== null;

  useEffect(() => {
    if (!isOwner || isPreview) {
      return;
    }
    try {
      const raw = localStorage.getItem(getOwnerUndoStorageKey(item.id));
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as {
        previous_status?: string;
        expires_at?: number;
      };
      if (
        typeof parsed.previous_status !== "string" ||
        typeof parsed.expires_at !== "number" ||
        parsed.expires_at <= Date.now()
      ) {
        localStorage.removeItem(getOwnerUndoStorageKey(item.id));
        return;
      }
      const previousStatus = parsed.previous_status;
      const expiresAt = parsed.expires_at;
      queueMicrotask(() => {
        setUndoPreviousStatus(previousStatus);
        setUndoExpiresAt(expiresAt);
      });
    } catch {
      // Ignore malformed local storage values.
    }
  }, [isOwner, isPreview, item.id]);

  useEffect(() => {
    if (!undoExpiresAt) {
      return;
    }
    const remaining = undoExpiresAt - Date.now();
    if (remaining <= 0) {
      queueMicrotask(() => {
        setUndoExpiresAt(null);
        setUndoPreviousStatus(null);
      });
      try {
        localStorage.removeItem(getOwnerUndoStorageKey(item.id));
      } catch {
        // Ignore cleanup errors.
      }
      return;
    }
    const timer = window.setTimeout(() => {
      setUndoExpiresAt(null);
      setUndoPreviousStatus(null);
      try {
        localStorage.removeItem(getOwnerUndoStorageKey(item.id));
      } catch {
        // Ignore cleanup errors.
      }
      router.refresh();
    }, remaining);
    return () => {
      window.clearTimeout(timer);
    };
  }, [item.id, router, undoExpiresAt]);

  // Don't render if deleted
  if (isDeleted) return <></>;

  /**
   * Toggle most desired status
   * Uses dedicated mutation to only update most_desired field
   */
  const handleToggleMostDesired = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    startTransition(async () => {
      const newValue = !item.most_desired;
      const result = await toggleMostDesired(item.id, newValue);
      if (result.success) {
        toast.success(newValue ? "Marked as most desired" : "Removed from most desired");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update item");
      }
    });
  };

  /**
   * Handle delete item
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteItem(item.id);
      if (result.success) {
        toast.success("Item deleted");
        setIsDeleted(true);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete item");
      }
    });
  };

  /**
   * Handle edit item
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  /**
   * Mark item as received (owner only)
   */
  const handleMarkReceived = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isReceived) {
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/gifts/${item.id}/mark-received`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const expiresAt = Date.now() + OWNER_RECEIVED_UNDO_WINDOW_MS;
        const previousStatus = item.status;
        setUndoPreviousStatus(previousStatus);
        setUndoExpiresAt(expiresAt);
        try {
          localStorage.setItem(
            getOwnerUndoStorageKey(item.id),
            JSON.stringify({
              previous_status: previousStatus,
              expires_at: expiresAt,
            })
          );
        } catch {
          // Ignore local storage failures.
        }
        toast.success("Marked as received. Undo available for 12 seconds.");
        router.refresh();
      } else {
        toast.error(
          typeof json?.error === "string" ? json.error : "Failed to mark as received"
        );
      }
    });
  };

  const handleUndoReceived = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!undoPreviousStatus) {
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/gifts/${item.id}/undo-received`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setUndoExpiresAt(null);
        setUndoPreviousStatus(null);
        try {
          localStorage.removeItem(getOwnerUndoStorageKey(item.id));
        } catch {
          // Ignore local storage cleanup failures.
        }
        toast.info("Item received mark was undone.");
        router.refresh();
      } else {
        toast.error(
          typeof json?.error === "string" ? json.error : "Failed to undo received state"
        );
      }
    });
  };

  const handleOwnerBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productRedirectPath) return;
    setIsOwnerBuySheetOpen(true);
  };

  const openOwnerStore = (): void => {
    if (!productRedirectPath) return;
    window.location.assign(productRedirectPath);
  };

  return (
    <div className="stagger-item">
      <GlassCard 
        variant="default" 
        className="rounded-[20px] sm:rounded-[24px] p-2 sm:p-[10px] md:p-3 group bg-[#c5c5c5] transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        {/* White container for image with rounded corners */}
        <ItemCardMedia
          title={item.title}
          imageUrl={item.image_url}
          productRedirectPath={productRedirectPath}
          wrapperClassName="relative bg-white rounded-[16px] sm:rounded-[20px] mb-2 sm:mb-3 overflow-hidden aspect-square"
          imageClassName="w-full h-full object-cover transition-opacity hover:opacity-95"
          overlay={
            isOwner && !isPreview ? (
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
                <button
                  onClick={handleToggleMostDesired}
                  disabled={isPending}
                  className="transition-colors hover:bg-[#f5b647] disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                  title={item.most_desired ? "Remove from most desired" : "Mark as most desired"}
                >
                  <MostDesiredBadge active={Boolean(item.most_desired)} interactive />
                </button>
              </div>
            ) : undefined
          }
        />

        <div className="space-y-2">
          {/* Title and Price on same line */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-[#2b2b2b] leading-tight line-clamp-2">
                <LinkedItemTitle
                  title={item.title}
                  productRedirectPath={productRedirectPath}
                  className="underline-offset-2 hover:underline"
                />
              </h3>
            </div>
            
            {/* Price with favicon */}
            {target > 0 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Favicon placeholder - rounded square representing website icon */}
                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded border border-[#2b2b2b]/20 bg-[#f5f5f5] flex items-center justify-center">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-sm bg-[#2b2b2b]/30" />
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-[#2b2b2b]">
                  {formatCurrency(target, currency)}
                </span>
              </div>
            )}
          </div>
          
          {/* Funding status with progress bar */}
          {/* Only show when there's a target amount (price or target set) */}
          {target > 0 && (
            <div className="space-y-1.5">
              {/* Funding text */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-[#505050]">
                  <span className="font-medium">
                    {formatCurrency(fundedAmount, currency)} funded
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    {/* Clamp remaining to 0 when overfunded */}
                    {formatCurrency(Math.max(0, target - fundedAmount), currency)} left
                  </span>
                </div>
              </div>
              
              {/* Progress bar with dual colors */}
              <ProgressBar
                value={pct}
                heightClassName="h-1"
                trackClassName="bg-[#b8a8ff]"
                barClassName="bg-[#3a3a3a]"
              />
            </div>
          )}

          {/* Public note */}
          {item.note_public && (
            <p className="text-[10px] sm:text-xs md:text-sm text-[#505050]">
              {item.note_public}
            </p>
          )}

          {/* Private note (owner only) */}
          {item.note_private && isOwner && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
              <p className="text-[9px] sm:text-[10px] md:text-xs text-amber-900">
                <span className="font-semibold">Private note:</span> {item.note_private}
              </p>
            </div>
          )}

          {/* Action buttons - Compact buttons matching mockup */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Owner actions */}
            {isOwner && !isPreview && (
              <>
                {/* Edit and Delete icon buttons */}
                <IconButton
                  onClick={handleEdit}
                  disabled={isPending}
                  label="Edit item"
                  icon={(
                    <svg className="h-4 w-4 text-[#2b2b2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  )}
                />

                <IconButton
                  onClick={handleDelete}
                  disabled={isPending}
                  variant="danger"
                  label="Delete item"
                  icon={(
                    <svg className="h-4 w-4 text-[#2b2b2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                />

                <button
                  onClick={handleOwnerBuy}
                  disabled={isPending || !productRedirectPath}
                  className="h-11 flex-1 rounded-full border border-[#2b2b2b] bg-white px-3 text-center text-[10px] font-medium text-[#2b2b2b] transition-all hover:bg-[#f4f4f4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-xs md:text-sm"
                  title={productRedirectPath ? "Buy this item" : "No store link available"}
                >
                  Buy item
                </button>

                <button
                  onClick={handleMarkReceived}
                  disabled={isPending || isReceived}
                  className="h-11 flex-1 rounded-full bg-[#3a3a3a] px-3 text-center text-[10px] font-medium text-white transition-all hover:bg-[#2b2b2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#3a3a3a] sm:px-4 sm:text-xs md:text-sm"
                  title={isReceived ? "Already marked as received" : "Mark item as received"}
                >
                  {isReceived ? "Received" : "Item received"}
                </button>

                {undoExpiresAt && (
                  <button
                    onClick={handleUndoReceived}
                    disabled={isPending || !undoPreviousStatus}
                    className="h-11 rounded-full border border-[#2b2b2b] bg-white px-4 text-center text-[10px] font-medium text-[#2b2b2b] transition-all hover:bg-[#f4f4f4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs md:text-sm"
                    title="Undo mark as received"
                  >
                    Undo
                  </button>
                )}
              </>
            )}

            {/* Non-owner actions: Buy / Contribute */}
            {!isOwner && (
              <>
                <button
                  disabled={isPreview || isReserved || isFunded || hasContributions}
                  className="h-11 flex-1 rounded-full border border-[#2b2b2b] bg-transparent px-3 text-center text-[10px] font-medium text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-xs md:text-sm"
                  title={
                    isPreview
                      ? "Preview mode — use public link to test"
                      : hasContributions
                      ? "Can't buy this gift — this item already has contributions"
                      : isReserved
                      ? "Already bought"
                      : isFunded
                      ? "Fully funded"
                      : "Buy this item"
                  }
                >
                  {isReserved ? "Bought" : "Buy"}
                </button>

                <button
                  disabled={isPreview || isReserved || isFunded}
                  className="h-11 flex-1 rounded-full bg-[#3a3a3a] px-3 text-center text-[10px] font-medium text-white transition-all hover:bg-[#2b2b2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-xs md:text-sm"
                  title={
                    isPreview
                      ? "Preview mode — use public link to test"
                      : isReserved
                      ? "Can't contribute — this item is already bought"
                      : isFunded
                      ? "Fully funded"
                      : "Contribute to this item"
                  }
                >
                  Contribute
                </button>
              </>
            )}
          </div>

        </div>
      </GlassCard>

      {/* Edit Modal */}
      <EditItemModal
        item={item}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ModalShell
        isOpen={isOwnerBuySheetOpen}
        onClose={() => setIsOwnerBuySheetOpen(false)}
        maxWidthClass="max-w-md"
        panelClassName="rounded-[24px] bg-[#2b2b2b] p-4 text-white shadow-2xl animate-modal-in sm:p-5"
      >
        <div className="space-y-4 pr-8">
          <h3 className="text-lg font-semibold">Buy item</h3>
          <p className="text-sm text-white/80">
            Buy on {storeLabel}, then come back and tap Item received.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openOwnerStore}
              className="h-11 flex-1 rounded-full bg-white px-4 text-sm font-semibold text-[#2b2b2b] transition-colors hover:bg-[#f2f2f2]"
            >
              Buy on {storeLabel}
            </button>
            <button
              type="button"
              onClick={() => setIsOwnerBuySheetOpen(false)}
              className="h-11 flex-1 rounded-full border border-white/30 bg-transparent px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
