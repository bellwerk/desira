"use client";

import { useEffect } from "react";

export type UserListOption = {
  id: string;
  title: string;
  visibility: "private" | "unlisted" | "public";
};

type ListPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectList: (listId: string) => void;
  onCreateNew: () => void;
  lists: UserListOption[];
  suggestionTitle: string;
};

export function ListPickerModal({
  isOpen,
  onClose,
  onSelectList,
  onCreateNew,
  lists,
  suggestionTitle,
}: ListPickerModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[30px] bg-[#2b2b2b] p-4 shadow-2xl sm:p-6"
        style={{ fontFamily: "Urbanist" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 transition-colors hover:bg-[#5a5a5a] hover:text-white sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="pr-10 text-center text-2xl font-bold text-white" style={{ fontFamily: "Asul" }}>
          Add this idea
        </h2>
        <p className="mt-2 text-center text-sm text-white/70">
          Choose a list for{" "}
          <span className="font-medium text-white">{suggestionTitle}</span>.
        </p>

        <div className="mt-4 space-y-2">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelectList(list.id)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-3 text-left transition-colors hover:bg-[#4a4a4a]"
            >
              <span className="min-w-0 truncate pr-3 text-sm font-medium text-white sm:text-base">
                {list.title}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium capitalize text-white/85">
                {list.visibility}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-white/60 transition-all duration-150 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d8df1]/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="h-11 rounded-full bg-[#9d8df1] px-6 text-center text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#8a7ae0] hover:scale-[1.01] active:scale-[0.99]"
          >
            Create New List
          </button>
        </div>
      </div>
    </div>
  );
}

