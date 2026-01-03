"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteItem } from "../actions";
import { GlassCard, GlassButton, BadgeChip, ProgressBar } from "@/components/ui";

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
};

type ItemCardProps = {
  item: ItemRow;
  isReserved: boolean;
  isFunded: boolean;
  fundedAmount: number;
  currency: string;
  isOwner?: boolean; // Owner mode: read-only, no actions
};

function formatCents(cents: number | null | undefined): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2);
}

function getDomainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

/**
 * ItemCard — displays a wish item with glass styling
 *
 * Business rules:
 * - If isOwner: show "You own this list" label, hide Reserve/Contribute
 * - If isReserved: show Reserved chip, Contribute disabled
 * - If fundedAmount > 0: Reserve disabled
 * - If isFunded: show Funded chip, both actions disabled
 */
export function ItemCard({
  item,
  isReserved,
  isFunded,
  fundedAmount,
  currency,
  isOwner = true, // Default to owner view in /app/lists/[id]
}: ItemCardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const target = item.target_amount_cents ?? item.price_cents ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((fundedAmount / target) * 100)) : 0;
  const domain = getDomainFromUrl(item.product_url);

  // Status determination
  const statusVariant = isFunded ? "funded" : isReserved ? "reserved" : "available";
  const statusLabel = isFunded ? "Funded" : isReserved ? "Reserved" : "Available";

  // Business rule: disable reserve if contributions exist
  const hasContributions = fundedAmount > 0;

  function handleDelete(): void {
    startTransition(async () => {
      await deleteItem(item.id);
      router.refresh();
    });
  }

  return (
    <GlassCard variant="default" className="overflow-hidden p-0">
      {/* Image */}
      <div className="aspect-video w-full bg-slate-100/50 dark:bg-slate-800/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url ?? "https://picsum.photos/seed/fallback/600/400"}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-medium text-slate-900 dark:text-white">
              {item.title}
            </h3>
            {domain && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {domain}
              </p>
            )}
          </div>
          <BadgeChip variant={statusVariant}>{statusLabel}</BadgeChip>
        </div>

        {/* Price */}
        {target > 0 && (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ${formatCents(target)} {currency}
          </p>
        )}

        {/* Progress bar (if contributions exist) */}
        {target > 0 && fundedAmount > 0 && (
          <ProgressBar
            value={pct}
            label={isFunded ? "Fully funded" : `$${formatCents(fundedAmount)} of $${formatCents(target)}`}
          />
        )}

        {/* Notes */}
        {item.note_public && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {item.note_public}
          </p>
        )}
        {item.note_private && (
          <p className="text-sm italic text-slate-500 dark:text-slate-500">
            <span className="font-medium">[Private]</span> {item.note_private}
          </p>
        )}

        {/* Owner mode indicator */}
        {isOwner && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You own this list
            </p>
          </div>
        )}

        {/* Actions (owner view: product link + delete) */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          {item.product_url && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GlassButton variant="ghost" size="sm">
                View product
              </GlassButton>
            </a>
          )}

          <div className="flex-1" />

          {/* Delete action (owner only) */}
          {isOwner && (
            <>
              {showConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Delete?</span>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleDelete}
                    loading={isPending}
                    className="!from-red-500 !to-red-600"
                  >
                    Yes
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                  >
                    No
                  </GlassButton>
                </div>
              ) : (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  title="Delete item"
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
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </GlassButton>
              )}
            </>
          )}

          {/* Non-owner actions: Reserve / Contribute */}
          {!isOwner && (
            <div className="flex items-center gap-2">
              {/* Reserve button */}
              <GlassButton
                variant="secondary"
                size="sm"
                disabled={isReserved || isFunded || hasContributions}
                title={
                  hasContributions
                    ? "Can't reserve — this item already has contributions"
                    : isReserved
                    ? "Already reserved"
                    : isFunded
                    ? "Fully funded"
                    : "Reserve this item"
                }
              >
                Reserve
              </GlassButton>

              {/* Contribute button */}
              <GlassButton
                variant="primary"
                size="sm"
                disabled={isReserved || isFunded}
                title={
                  isReserved
                    ? "Can't contribute — this item is reserved"
                    : isFunded
                    ? "Fully funded"
                    : "Contribute to this item"
                }
              >
                Contribute
              </GlassButton>
            </div>
          )}
        </div>

        {/* Helper text for disabled actions */}
        {!isOwner && hasContributions && !isReserved && !isFunded && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Can&apos;t reserve — this item already has contributions.
          </p>
        )}
        {!isOwner && isReserved && !isFunded && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Can&apos;t contribute — this item is reserved.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
