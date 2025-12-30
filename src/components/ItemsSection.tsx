"use client";

import { useState, useTransition } from "react";
import { AddItemModal } from "./AddItemModal";
import { deleteItem } from "@/app/app/lists/actions";

interface ItemData {
  id: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  price_cents: number | null;
  target_amount_cents: number | null;
  note_public: string | null;
  note_private: string | null;
  merchant: string | null;
  status: "active" | "funded" | "archived";
  is_reserved: boolean;
  funded_amount_cents: number;
}

interface ItemsSectionProps {
  listId: string;
  items: ItemData[];
  currency: string;
}

function formatCents(cents: number | null): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

function ItemCard({ item, listId, currency }: { item: ItemData; listId: string; currency: string }): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const target = item.target_amount_cents ?? item.price_cents ?? null;
  const isFunded = item.status === "funded" || (target !== null && item.funded_amount_cents >= target);

  const statusLabel = isFunded
    ? "Funded"
    : item.is_reserved
    ? "Reserved"
    : "Available";

  const statusColor = isFunded
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : item.is_reserved
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  const pct = target && target > 0 ? Math.min(100, Math.round((item.funded_amount_cents / target) * 100)) : 0;

  function handleDelete() {
    const formData = new FormData();
    formData.set("item_id", item.id);
    formData.set("list_id", listId);
    startTransition(async () => {
      await deleteItem(formData);
      setShowConfirmDelete(false);
    });
  }

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      {/* Image */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url || "https://picsum.photos/seed/placeholder/400/300"}
          alt={item.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-medium text-slate-900 dark:text-white">
            {item.title}
          </h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Price / Target */}
        {(item.price_cents || item.target_amount_cents) && (
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            ${formatCents(target)} {currency}
          </div>
        )}

        {/* Merchant */}
        {item.merchant && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {item.merchant}
          </div>
        )}

        {/* Funding progress (if any contributions) */}
        {target && target > 0 && item.funded_amount_cents > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ${formatCents(item.funded_amount_cents)} of ${formatCents(target)} funded ({pct}%)
            </div>
          </div>
        )}

        {/* Public note */}
        {item.note_public && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {item.note_public}
          </p>
        )}

        {/* Private note (owner only) */}
        {item.note_private && (
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Private note</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.note_private}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {item.product_url && (
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-slate-600 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showConfirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Delete this item?</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function ItemsSection({ listId, items, currency }: ItemsSectionProps): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Items</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {items.length === 0
              ? "Add items to your wishlist."
              : `${items.length} item${items.length !== 1 ? "s" : ""} in this list`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-rose-600 hover:to-orange-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
            No items yet
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add your first wish to get started.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add your first wish
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} listId={listId} currency={currency} />
          ))}
        </div>
      )}

      <AddItemModal listId={listId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

