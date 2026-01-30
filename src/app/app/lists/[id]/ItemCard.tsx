"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, useToastActions } from "@/components/ui";
import { getItemRedirectPath } from "@/lib/affiliate";
import { deleteItem, markItemReceived, toggleMostDesired } from "../actions";
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

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * ItemCard — displays a wish item with glass styling
 * 
 * Features:
 * - Edit and delete icon buttons for owners
 * - Fixed touch targets (32x32 minimum)
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
  const [isPending, startTransition] = useTransition();

  const target = item.target_amount_cents ?? item.price_cents ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((fundedAmount / target) * 100)) : 0;

  // Business rule: disable reserve if contributions exist
  const hasContributions = fundedAmount > 0;
  const isReceived = item.status === "received";

  // Don't render if deleted
  if (isDeleted) return <></>;

  /**
   * Handle card click to open product link
   * Opens in new tab via affiliate redirect route
   */
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      !item.product_url
    ) {
      return;
    }

    // Open affiliate link in new tab
    const affiliateUrl = getItemRedirectPath(item.id);
    window.open(affiliateUrl, "_blank", "noopener,noreferrer");
  };

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
      const result = await markItemReceived(item.id);
      if (result.success) {
        toast.success("Marked as received");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to mark as received");
      }
    });
  };

  return (
    <div className="stagger-item">
      <GlassCard 
        variant="default" 
        className="rounded-[20px] sm:rounded-[24px] p-2 sm:p-[10px] md:p-3 group bg-[#c5c5c5] cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.99]"
        onClick={handleCardClick}
      >
        {/* White container for image with rounded corners */}
        <div className="relative bg-white rounded-[16px] sm:rounded-[20px] mb-2 sm:mb-3 overflow-hidden aspect-square">
          {/* Mark as Most Desired toggle */}
          {isOwner && !isPreview && (
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
              <button 
                onClick={handleToggleMostDesired}
                disabled={isPending}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#f5a623] text-[#2b2b2b] text-[8px] sm:text-[10px] md:text-xs font-semibold hover:bg-[#f5b647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={item.most_desired ? "Remove from most desired" : "Mark as most desired"}
              >
                <div className="w-3 h-3 sm:w-[14px] sm:h-[14px] rounded-full border-2 border-[#2b2b2b] bg-white flex items-center justify-center">
                  {item.most_desired && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2b2b2b]" />
                  )}
                </div>
                <span className="hidden sm:inline">{item.most_desired ? "Most Desired" : "Mark as Most Desired"}</span>
                <span className="sm:hidden">Most Desired</span>
              </button>
            </div>
          )}

          {/* Product image - covers entire container */}
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo-hollow.svg" 
                alt="" 
                className="h-24 w-24 opacity-20"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Title and Price on same line */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-[#2b2b2b] leading-tight line-clamp-2">
                {item.title}
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
              <div className="h-1 w-full rounded-full bg-[#b8a8ff] overflow-hidden flex">
                <div 
                  className="h-full bg-[#3a3a3a] rounded-l-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
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
          <div className="flex items-center gap-2">
            {/* Owner actions */}
            {isOwner && !isPreview && (
              <>
                {/* Edit and Delete icon buttons */}
                <button
                  onClick={handleEdit}
                  disabled={isPending}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-[#2b2b2b] bg-transparent transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit item"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2b2b2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-[#2b2b2b] bg-transparent transition-all hover:bg-red-50 hover:border-red-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete item"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2b2b2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                {/* Mark Received button */}
                <button
                  onClick={handleMarkReceived}
                  disabled={isPending || isReceived}
                  className="flex-1 rounded-full bg-[#3a3a3a] px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-white transition-all hover:bg-[#2b2b2b] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3a3a3a]"
                  title={isReceived ? "Already marked as received" : "Mark as received"}
                >
                  {isReceived ? "Received" : "Mark Received"}
                </button>
              </>
            )}

            {/* Non-owner actions: Reserve / Contribute */}
            {!isOwner && (
              <>
                <button
                  disabled={isPreview || isReserved || isFunded || hasContributions}
                  className="flex-1 rounded-full border border-[#2b2b2b] bg-transparent px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[#2b2b2b] transition-all hover:bg-[#2b2b2b]/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    isPreview
                      ? "Preview mode — use public link to test"
                      : hasContributions
                      ? "Can't reserve — this item already has contributions"
                      : isReserved
                      ? "Already reserved"
                      : isFunded
                      ? "Fully funded"
                      : "Reserve this item"
                  }
                >
                  {isReserved ? "Reserved" : "Reserve"}
                </button>

                <button
                  disabled={isPreview || isReserved || isFunded}
                  className="flex-1 rounded-full bg-[#3a3a3a] px-3 sm:px-4 py-1.5 sm:py-2 text-center text-[10px] sm:text-xs md:text-sm font-medium text-white transition-all hover:bg-[#2b2b2b] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    isPreview
                      ? "Preview mode — use public link to test"
                      : isReserved
                      ? "Can't contribute — this item is reserved"
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
    </div>
  );
}
