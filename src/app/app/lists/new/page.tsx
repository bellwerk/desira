"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createList, ActionResult } from "../actions";

const initialState: ActionResult = { success: false };

export default function NewListPage(): React.ReactElement {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      return createList(formData);
    },
    initialState
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/app/lists"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to lists
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Create a new list
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Set up a wishlist for yourself, a loved one, or a group.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-6">
        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-900 dark:text-white">
            List title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={100}
            placeholder="e.g., Birthday Wishlist, Holiday Gifts"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white">
            Who is this list for?
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="relative flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-4 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <input
                type="radio"
                name="recipient_type"
                value="person"
                defaultChecked
                className="peer sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Individual</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">For one person</p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-rose-500"></div>
            </label>
            <label className="relative flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white p-4 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <input
                type="radio"
                name="recipient_type"
                value="group"
                className="peer sr-only"
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Group</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Family or friends</p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-rose-500"></div>
            </label>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white">
            Visibility
          </label>
          <select
            name="visibility"
            defaultValue="unlisted"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="unlisted">Unlisted — Only people with the link</option>
            <option value="private">Private — Only invited members</option>
            <option value="public">Public — Anyone can find it</option>
          </select>
        </div>

        {/* Occasion (optional) */}
        <div>
          <label htmlFor="occasion" className="block text-sm font-medium text-slate-900 dark:text-white">
            Occasion <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            id="occasion"
            name="occasion"
            maxLength={100}
            placeholder="e.g., Birthday, Christmas, Wedding"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Event Date (optional) */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-slate-900 dark:text-white">
            Event date <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="date"
            id="event_date"
            name="event_date"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Feature toggles */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Features</p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_reservations"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Allow reservations</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">People can reserve items to avoid duplicates</p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_contributions"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Allow contributions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">People can contribute money toward items</p>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allow_anonymous"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Allow anonymous</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Contributors can remain anonymous</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
          <Link
            href="/app/lists"
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>Create list</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}






