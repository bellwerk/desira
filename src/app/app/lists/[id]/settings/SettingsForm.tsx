"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateList, deleteList, ActionResult } from "../../actions";
import { useToastActions } from "@/components/ui";
import type { ListSettings } from "./page";

type SettingsFormProps = {
  list: ListSettings;
};

const initialState: ActionResult = { success: false };

export function SettingsForm({ list }: SettingsFormProps): React.ReactElement {
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
        router.push(`/app/lists/${list.id}`);
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
      }
      // On success, the action redirects to /app/lists
    } catch {
      setDeleteError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Update Form */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={list.id} />

        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </div>
        )}

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-[#343338] dark:text-white"
          >
            List title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={100}
            defaultValue={list.title}
            placeholder="e.g., Birthday Wishlist, Holiday Gifts"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[#343338] placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-[#343338] dark:text-white">
            Who is this list for?
          </label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <label className="relative flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-4 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <input
                type="radio"
                name="recipient_type"
                value="person"
                defaultChecked={list.recipient_type === "person"}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <svg
                    className="h-5 w-5 text-slate-600 dark:text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#343338] dark:text-white">
                    Individual
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For one person
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-rose-500"></div>
            </label>
            <label className="relative flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-4 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <input
                type="radio"
                name="recipient_type"
                value="group"
                defaultChecked={list.recipient_type === "group"}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <svg
                    className="h-5 w-5 text-slate-600 dark:text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#343338] dark:text-white">
                    Group
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Family or friends
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-rose-500"></div>
            </label>
            <label className="relative flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-4 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <input
                type="radio"
                name="recipient_type"
                value="shared"
                defaultChecked={list.recipient_type === "shared"}
                className="peer sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <svg
                    className="h-5 w-5 text-slate-600 dark:text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#343338] dark:text-white">
                    Collaborative
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Everyone can add
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-rose-500"></div>
            </label>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-[#343338] dark:text-white">
            Visibility
          </label>
          <select
            name="visibility"
            defaultValue={list.visibility}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[#343338] focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="unlisted">Unlisted — Only people with the link</option>
            <option value="private">Private — Only invited members</option>
            <option value="public">Public — Anyone can find it</option>
          </select>
        </div>

        {/* Occasion (optional) */}
        <div>
          <label
            htmlFor="occasion"
            className="block text-sm font-medium text-[#343338] dark:text-white"
          >
            Occasion <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            id="occasion"
            name="occasion"
            maxLength={100}
            defaultValue={list.occasion ?? ""}
            placeholder="e.g., Birthday, Christmas, Wedding"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[#343338] placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Event Date (optional) */}
        <div>
          <label
            htmlFor="event_date"
            className="block text-sm font-medium text-[#343338] dark:text-white"
          >
            Event date <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            id="event_date"
            name="event_date"
            defaultValue={list.event_date ?? ""}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-[#343338] focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Feature toggles */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-[#343338] dark:text-white">
            Features
          </p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_reservations"
                value="true"
                defaultChecked={list.allow_reservations}
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-[#343338] dark:text-white">
                  Allow reservations
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  People can reserve items to avoid duplicates
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_contributions"
                value="true"
                defaultChecked={list.allow_contributions}
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-[#343338] dark:text-white">
                  Allow contributions
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  People can contribute money toward items
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_anonymous"
                value="true"
                defaultChecked={list.allow_anonymous}
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-[#343338] dark:text-white">
                  Allow anonymous
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contributors can remain anonymous
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
          <Link
            href={`/app/lists/${list.id}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-rose-600 hover:to-orange-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>Save changes</>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-12 rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          Deleting a list is permanent. All items, reservations, and contributions
          will be lost.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Delete this list
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            {deleteError && (
              <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
                {deleteError}
              </div>
            )}
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>Yes, delete list</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}



