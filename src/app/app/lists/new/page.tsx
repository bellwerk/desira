"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { createList, ActionResult } from "../actions";
import { GlassButton } from "@/components/ui";

const initialState: ActionResult = { success: false };

type ListType = "wishlist" | "household" | "collaborative";
type Visibility = "private_link" | "public";

const LIST_TYPE_CONFIG: Record<ListType, { label: string; description: string }> = {
  wishlist: { label: "Wishlist", description: "One person's wishes" },
  household: { label: "Household", description: "Gifts for couple / family" },
  collaborative: { label: "Collaborative", description: "Everyone can add items" },
};

const VISIBILITY_CONFIG: Record<Visibility, { label: string; helper: string }> = {
  private_link: { label: "Private link", helper: "Only people with the link can view." },
  public: { label: "Public", helper: "Anyone with the link — and search engines if indexed." },
};

export default function NewListPage(): React.ReactElement {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      return createList(formData);
    },
    initialState
  );

  const [listName, setListName] = useState("");
  const [listNameTouched, setListNameTouched] = useState(false);
  const [listType, setListType] = useState<ListType>("wishlist");
  const [visibility, setVisibility] = useState<Visibility>("private_link");
  const [allowReservations, setAllowReservations] = useState(true);
  const [allowContributions, setAllowContributions] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(true);

  const showListNameError = listNameTouched && !listName.trim();
  const isFormValid = listName.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isFormValid) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="flex min-h-full items-start justify-center pt-8 pb-16">
      {/* Modal Container */}
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-lg font-semibold text-[#2b2b2b]">Create a list</h1>
          <p className="mt-0.5 text-sm text-[#2b2b2b]/60">You can change settings later.</p>
        </div>

        <form action={formAction} className="px-6 py-6">
          {state.error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* SECTION: BASICS */}
          <div className="space-y-4">
            {/* List Name */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#2b2b2b]">
                List name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                maxLength={100}
                placeholder="Tony's Birthday"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onBlur={() => setListNameTouched(true)}
                onKeyDown={handleKeyDown}
                className={`mt-2 block w-full rounded-[14px] border bg-gray-50/50 px-4 py-3 text-[#2b2b2b] placeholder:text-[#2b2b2b]/40 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                  showListNameError
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-rose-400"
                }`}
              />
              {showListNameError && (
                <p className="mt-1.5 text-xs text-red-500">List name is required</p>
              )}
            </div>

            {/* Event Date */}
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-[#2b2b2b]">
                Event date <span className="font-normal text-[#2b2b2b]/50">(optional)</span>
              </label>
              <div className="relative mt-2">
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  className="block w-full rounded-[14px] border border-gray-200 bg-gray-50/50 px-4 py-3 text-[#2b2b2b] transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* List Type */}
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b]">List type</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(LIST_TYPE_CONFIG) as ListType[]).map((type) => {
                  const config = LIST_TYPE_CONFIG[type];
                  const isSelected = listType === type;
                  return (
                    <label
                      key={type}
                      className={`relative flex cursor-pointer flex-col rounded-[14px] border p-3 transition-all ${
                        isSelected
                          ? "border-[#9D8DF1] bg-[#9D8DF1]/10"
                          : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipient_type"
                        value={type === "wishlist" ? "person" : type === "household" ? "group" : "shared"}
                        checked={isSelected}
                        onChange={() => setListType(type)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#2b2b2b]">{config.label}</span>
                        {isSelected && (
                          <svg className="h-4 w-4 text-[#9D8DF1]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="mt-0.5 text-xs text-[#2b2b2b]/60">{config.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION: SHARE SETTINGS */}
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-[#2b2b2b]">Visibility</label>
            
            {/* Segmented Control */}
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50/50 p-1">
              {(Object.keys(VISIBILITY_CONFIG) as Visibility[]).map((vis) => {
                const config = VISIBILITY_CONFIG[vis];
                const isSelected = visibility === vis;
                return (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => setVisibility(vis)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-white text-[#2b2b2b] shadow-sm"
                        : "text-[#2b2b2b]/60 hover:text-[#2b2b2b]"
                    }`}
                  >
                    {config.label}
                    {vis === "private_link" && !isSelected && (
                      <span className="ml-1 text-xs text-[#2b2b2b]/40">(Rec.)</span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#2b2b2b]/60">{VISIBILITY_CONFIG[visibility].helper}</p>

            {/* Hidden field for form submission */}
            <input type="hidden" name="visibility" value={visibility === "private_link" ? "unlisted" : visibility} />
          </div>

          {/* SECTION: GIFT CONTROLS */}
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-[#2b2b2b]">Gift controls</label>

            {/* Reservations */}
            <ToggleRow
              name="allow_reservations"
              label="Reservations"
              helper="Prevent duplicate gifts."
              checked={allowReservations}
              onChange={setAllowReservations}
            />

            {/* Contributions */}
            <ToggleRow
              name="allow_contributions"
              label="Contributions"
              helper="Chip in toward an item."
              checked={allowContributions}
              onChange={setAllowContributions}
            />

            {/* Allow Anonymous */}
            <ToggleRow
              name="allow_anonymous"
              label="Allow anonymous"
              helper="Hide names from other guests."
              checked={allowAnonymous}
              onChange={setAllowAnonymous}
            />
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between pt-4">
            <Link href="/app/lists">
              <button
                type="button"
                className="text-sm font-medium text-[#2b2b2b]/60 hover:text-[#2b2b2b] transition-colors"
              >
                Cancel
              </button>
            </Link>
            <GlassButton
              variant="primary"
              size="md"
              type="submit"
              disabled={!isFormValid}
              loading={isPending}
            >
              {isPending ? "Creating..." : "Create list"}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  name: string;
  label: string;
  helper: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ name, label, helper, checked, onChange }: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-[#2b2b2b]">{label}</p>
        <p className="text-xs text-[#2b2b2b]/60">{helper}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          name={name}
          value="true"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-[#9D8DF1]" : "bg-gray-200"}`}>
          <div
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </label>
    </div>
  );
}
