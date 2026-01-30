"use client";

import { useState, useEffect } from "react";
import { ItemCard } from "./ItemCard";
import { EditItemModal } from "./EditItemModal";
import { GlassCard } from "@/components/ui";

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

type StatusFilter = "all" | "available" | "reserved" | "funded";

type ItemsGridProps = {
  items: ItemRow[];
  reservedMap: Record<string, boolean>;
  fundedMap: Record<string, number>;
  currency: string;
  listId: string;
};

export function ItemsGrid({
  items: initialItems,
  reservedMap,
  fundedMap,
  currency,
  listId,
}: ItemsGridProps): React.ReactElement {
  const [items, setItems] = useState(initialItems);
  const [previewMode] = useState(false);

  // Sync items when server re-renders with new props (e.g., after router.refresh())
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingItem, setEditingItem] = useState<ItemRow | null>(null);

  // Compute item statuses
  function getItemStatus(itemId: string): "available" | "reserved" | "funded" {
    const item = items.find((i) => i.id === itemId);
    const target = item?.target_amount_cents ?? item?.price_cents ?? 0;
    const funded = fundedMap[itemId] ?? 0;
    const isReserved = Boolean(reservedMap[itemId]);
    const isReceived = item?.status === "received";
    const isFunded =
      isReceived || item?.status === "funded" || (target > 0 && funded >= target);

    if (isFunded) return "funded";
    if (isReserved) return "reserved";
    return "available";
  }

  // Filter items by status
  const filteredItems =
    statusFilter === "all"
      ? items
      : items.filter((item) => getItemStatus(item.id) === statusFilter);

  function handleCloseEdit(): void {
    setEditingItem(null);
  }

  return (
    <div>
      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <GlassCard className="py-16 text-center animate-slide-up">
          {/* Empty state illustration */}
          <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center dark:from-slate-800 dark:to-slate-700">
            <svg
              className="h-10 w-10 text-slate-400 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#343338] dark:text-white">
            {statusFilter === "all" ? "No items yet" : `No ${statusFilter} items`}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "Add your first wish to get started. Paste a product link to auto-fill details."
              : `There are no ${statusFilter} items in this list.`}
          </p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="mt-4 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
            >
              Show all items
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const isReserved = Boolean(reservedMap[item.id]);
            const funded = fundedMap[item.id] ?? 0;
            const target = item.target_amount_cents ?? item.price_cents ?? 0;
            const isReceived = item.status === "received";
            const isFunded =
              isReceived || item.status === "funded" || (target > 0 && funded >= target);

            return (
              <ItemCard
                key={item.id}
                item={item}
                isReserved={isReserved}
                isFunded={isFunded}
                fundedAmount={funded}
                currency={currency}
                isOwner={!previewMode}
                isPreview={previewMode}
                listId={listId}
              />
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          isOpen={true}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
}
