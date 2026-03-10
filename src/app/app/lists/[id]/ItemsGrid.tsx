"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ItemCard } from "./ItemCard";
import { EditItemModal } from "./EditItemModal";
import { reorderItems } from "../actions";
import { EmptyState } from "@/components/EmptyState";
import { useToastActions } from "@/components/ui";

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
  const router = useRouter();
  const toast = useToastActions();
  const [items, setItems] = useState(initialItems);
  const [previewMode] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isReordering, startReordering] = useTransition();

  // Sync items when server re-renders with new props (e.g., after router.refresh())
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingItem, setEditingItem] = useState<ItemRow | null>(null);
  const canDrag = statusFilter === "all" && !isReordering;

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

  function moveItem(
    sourceItemId: string,
    targetItemId: string,
    currentItems: ItemRow[]
  ): ItemRow[] {
    const sourceIndex = currentItems.findIndex((item) => item.id === sourceItemId);
    const targetIndex = currentItems.findIndex((item) => item.id === targetItemId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return currentItems;
    }

    const reordered = [...currentItems];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    return reordered.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, itemId: string): void {
    if (!canDrag) {
      e.preventDefault();
      return;
    }

    const target = e.target as HTMLElement;
    if (!target.closest("[data-drag-handle]")) {
      e.preventDefault();
      return;
    }

    setDraggingItemId(itemId);
    setDropTargetId(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, itemId: string): void {
    if (!canDrag || !draggingItemId || draggingItemId === itemId) {
      return;
    }
    e.preventDefault();
    setDropTargetId(itemId);
  }

  function handleDragEnd(): void {
    setDraggingItemId(null);
    setDropTargetId(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetItemId: string): void {
    if (!canDrag) {
      return;
    }

    e.preventDefault();
    const sourceItemId = e.dataTransfer.getData("text/plain") || draggingItemId;
    if (!sourceItemId || sourceItemId === targetItemId) {
      handleDragEnd();
      return;
    }

    const previousItems = items;
    const nextItems = moveItem(sourceItemId, targetItemId, previousItems);
    if (nextItems === previousItems) {
      handleDragEnd();
      return;
    }

    setItems(nextItems);
    handleDragEnd();

    startReordering(async () => {
      const result = await reorderItems(
        listId,
        nextItems.map((item) => item.id)
      );

      if (!result.success) {
        toast.error(result.error ?? "Failed to save new item order");
        setItems(previousItems);
        return;
      }

      toast.success("Item order updated");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          className="animate-slide-up py-16"
          icon={(
            <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center dark:from-slate-800 dark:to-slate-700">
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
          )}
          title={statusFilter === "all" ? "No items yet" : `No ${statusFilter} items`}
          description={
            statusFilter === "all"
              ? "Add your first wish to get started. Paste a product link to auto-fill details."
              : `There are no ${statusFilter} items in this list.`
          }
          action={
            statusFilter !== "all" ? (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
              >
                Show all items
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#2b2b2b]/60">
            {statusFilter === "all"
              ? "Drag the handle on an item card to reorder."
              : "Switch to All items to reorder by drag handle."}
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const isReserved = Boolean(reservedMap[item.id]);
            const funded = fundedMap[item.id] ?? 0;
            const target = item.target_amount_cents ?? item.price_cents ?? 0;
            const isReceived = item.status === "received";
            const isFunded =
              isReceived || item.status === "funded" || (target > 0 && funded >= target);

            return (
              <div
                key={item.id}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`relative transition-all ${
                  dropTargetId === item.id ? "rounded-[22px] ring-2 ring-[#9d8df1]" : ""
                } ${draggingItemId === item.id ? "opacity-70" : ""}`}
              >
                <div
                  data-drag-handle
                  className="absolute left-2 top-2 z-20 flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-white/90 text-[#2b2b2b] shadow-sm active:cursor-grabbing"
                  title={canDrag ? "Drag to reorder" : "Reordering available in All items view"}
                  aria-label="Drag handle"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="8" cy="7" r="1.5" />
                    <circle cx="16" cy="7" r="1.5" />
                    <circle cx="8" cy="12" r="1.5" />
                    <circle cx="16" cy="12" r="1.5" />
                    <circle cx="8" cy="17" r="1.5" />
                    <circle cx="16" cy="17" r="1.5" />
                  </svg>
                </div>
                <ItemCard
                  item={item}
                  isReserved={isReserved}
                  isFunded={isFunded}
                  fundedAmount={funded}
                  currency={currency}
                  isOwner={!previewMode}
                  isPreview={previewMode}
                  listId={listId}
                />
              </div>
            );
          })}
          </div>
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
