"use client";

import { useState, useActionState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateList, deleteList, type ActionResult } from "./actions";
import { useToastActions } from "@/components/ui";

type ListSettingsModalProps = {
  list: {
    id: string;
    title: string;
    recipient_type: string;
    visibility: string;
    occasion: string | null;
    event_date: string | null;
    allow_reservations: boolean;
    allow_contributions: boolean;
    allow_anonymous: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
};

const initialState: ActionResult = { success: false };

export function ListSettingsModal({ list, isOpen, onClose }: ListSettingsModalProps): React.ReactElement | null {
  const router = useRouter();
  const toast = useToastActions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await updateList(formData);
      if (result.success) {
        toast.success("Settings saved successfully!");
        onClose();
        router.refresh();
      }
      return result;
    },
    initialState
  );

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteList(list.id);
      if (!result.success) {
        setDeleteError(result.error ?? "Failed to delete list");
        toast.error(result.error ?? "Failed to delete list");
        setIsDeleting(false);
      } else {
        toast.success("List deleted");
        onClose();
        router.refresh();
      }
    } catch {
      setDeleteError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      setIsDeleting(false);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
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

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const inputBaseClass = "block w-full rounded-[20px] bg-[#3a3a3a] border-0 px-4 py-3.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50 font-[family-name:var(--font-urbanist)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
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
          List Settings
        </h2>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={list.id} />

          {state.error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-200">
              {state.error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white/90 mb-2">
              List title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={100}
              defaultValue={list.title}
              placeholder="e.g., Birthday Wishlist"
              className={inputBaseClass}
            />
          </div>

          {/* Recipient Type */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-3">
              Who is this list for?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="relative flex cursor-pointer flex-col items-center rounded-[20px] bg-[#3a3a3a] p-3 hover:bg-[#4a4a4a] transition-colors">
                <input
                  type="radio"
                  name="recipient_type"
                  value="person"
                  defaultChecked={list.recipient_type === "person"}
                  className="peer sr-only"
                />
                <svg className="h-6 w-6 text-white/60 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <p className="text-xs font-medium text-white/80">Individual</p>
                <div className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-transparent peer-checked:border-[#9d8df1]"></div>
              </label>
              <label className="relative flex cursor-pointer flex-col items-center rounded-[20px] bg-[#3a3a3a] p-3 hover:bg-[#4a4a4a] transition-colors">
                <input
                  type="radio"
                  name="recipient_type"
                  value="group"
                  defaultChecked={list.recipient_type === "group"}
                  className="peer sr-only"
                />
                <svg className="h-6 w-6 text-white/60 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                <p className="text-xs font-medium text-white/80">Group</p>
                <div className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-transparent peer-checked:border-[#9d8df1]"></div>
              </label>
              <label className="relative flex cursor-pointer flex-col items-center rounded-[20px] bg-[#3a3a3a] p-3 hover:bg-[#4a4a4a] transition-colors">
                <input
                  type="radio"
                  name="recipient_type"
                  value="shared"
                  defaultChecked={list.recipient_type === "shared"}
                  className="peer sr-only"
                />
                <svg className="h-6 w-6 text-white/60 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                <p className="text-xs font-medium text-white/80">Collaborative</p>
                <div className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-transparent peer-checked:border-[#9d8df1]"></div>
              </label>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-white/90 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              id="visibility"
              defaultValue={list.visibility}
              className={inputBaseClass}
            >
              <option value="unlisted">Unlisted — Only people with the link</option>
              <option value="private">Private — Only invited members</option>
              <option value="public">Public — Anyone can find it</option>
            </select>
          </div>

          {/* Occasion */}
          <div>
            <label htmlFor="occasion" className="block text-sm font-medium text-white/90 mb-2">
              Occasion <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="text"
              id="occasion"
              name="occasion"
              maxLength={100}
              defaultValue={list.occasion ?? ""}
              placeholder="e.g., Birthday, Christmas"
              className={inputBaseClass}
            />
          </div>

          {/* Event Date */}
          <div>
            <label htmlFor="event_date" className="block text-sm font-medium text-white/90 mb-2">
              Event date <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="date"
              id="event_date"
              name="event_date"
              defaultValue={list.event_date ?? ""}
              className={inputBaseClass}
            />
          </div>

          {/* Feature toggles */}
          <div className="rounded-[20px] bg-[#3a3a3a] p-4">
            <p className="text-sm font-medium text-white/90 mb-3">Features</p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allow_reservations"
                  value="true"
                  defaultChecked={list.allow_reservations}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#2b2b2b] text-[#9d8df1] focus:ring-[#9d8df1]/50"
                />
                <div>
                  <p className="text-sm font-medium text-white">Allow reservations</p>
                  <p className="text-xs text-white/60">People can reserve items to avoid duplicates</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allow_contributions"
                  value="true"
                  defaultChecked={list.allow_contributions}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#2b2b2b] text-[#9d8df1] focus:ring-[#9d8df1]/50"
                />
                <div>
                  <p className="text-sm font-medium text-white">Allow contributions</p>
                  <p className="text-xs text-white/60">People can contribute money toward items</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allow_anonymous"
                  value="true"
                  defaultChecked={list.allow_anonymous}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#2b2b2b] text-[#9d8df1] focus:ring-[#9d8df1]/50"
                />
                <div>
                  <p className="text-sm font-medium text-white">Allow anonymous</p>
                  <p className="text-xs text-white/60">Contributors can remain anonymous</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border-2 border-white/20 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-gradient-to-r from-[#9d8df1] to-[#b8a8ff] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-6 rounded-[20px] border p-4" style={{ backgroundColor: 'rgba(255, 111, 89, 0.10)', borderColor: 'rgba(255, 111, 89, 0.30)' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#FF6F59' }}>Danger zone</h3>
          <p className="mt-1 text-base" style={{ color: 'rgba(255, 111, 89, 0.80)' }}>
            Deleting a list is permanent. All items, reservations, and contributions will be lost.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-3 rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:opacity-90"
              style={{ 
                borderColor: 'rgba(255, 111, 89, 0.50)', 
                backgroundColor: 'rgba(255, 111, 89, 0.15)',
                color: '#FF6F59'
              }}
            >
              Delete this list
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              {deleteError && (
                <div className="rounded-lg border p-2 text-xs" style={{ 
                  backgroundColor: 'rgba(255, 111, 89, 0.20)', 
                  borderColor: 'rgba(255, 111, 89, 0.40)',
                  color: 'rgba(255, 111, 89, 0.95)'
                }}>
                  {deleteError}
                </div>
              )}
              <p className="text-xs font-medium" style={{ color: '#FF6F59' }}>
                Are you sure? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-full px-4 py-2 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: '#FF6F59' }}
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
