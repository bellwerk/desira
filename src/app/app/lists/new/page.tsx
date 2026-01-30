"use client";

import { useState, useActionState, useId, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { createList, ActionResult } from "../actions";
import { Toggle } from "@/components/ui";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const initialState: ActionResult = { success: false };

type ListType = "wishlist" | "household" | "collaborative";
type Visibility = "private_link" | "public";

/** Maps UI list type to database recipient_type */
const LIST_TYPE_TO_RECIPIENT: Record<ListType, string> = {
  wishlist: "person",
  household: "group",
  collaborative: "shared",
} as const;

const LIST_TYPE_CONFIG: Record<
  ListType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  wishlist: {
    label: "Wishlist",
    description: "One person's wishes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  household: {
    label: "Household",
    description: "Couple / family gifts",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  collaborative: {
    label: "Collaborative",
    description: "Everyone adds items",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
};

const VISIBILITY_OPTIONS: Array<{
  value: Visibility;
  label: string;
  helper: string;
}> = [
  {
    value: "private_link",
    label: "Private link",
    helper: "Only people with the link can view.",
  },
  {
    value: "public",
    label: "Public",
    helper: "Visible to anyone and search engines.",
  },
];

/** Quick-start templates for common occasions */
const TEMPLATES = [
  { label: "Birthday", icon: "🎂", name: "'s Birthday", offset: 30 },
  { label: "Wedding", icon: "💒", name: " Wedding Registry", offset: 90 },
  { label: "Baby", icon: "👶", name: " Baby Shower", offset: 60 },
  { label: "Holiday", icon: "🎄", name: " Holiday Wishlist", offset: 0 },
  { label: "Shopping", icon: "🛒", name: " Shopping List", offset: 0 },
] as const;

const MAX_NAME_LENGTH = 100;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewListPage(): React.ReactElement {
  const formId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form action state
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createList(formData),
    initialState
  );

  // Form field state
  const [listName, setListName] = useState("");
  const [listNameTouched, setListNameTouched] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [listType, setListType] = useState<ListType>("wishlist");
  const [visibility, setVisibility] = useState<Visibility>("private_link");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowReservations, setAllowReservations] = useState(true);
  const [allowContributions, setAllowContributions] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(true);

  // Auto-focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Derived state
  const showListNameError = listNameTouched && !listName.trim();
  const isFormValid = listName.trim().length > 0;
  const visibilityHelper =
    VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.helper ?? "";
  const charactersRemaining = MAX_NAME_LENGTH - listName.length;

  // Handlers
  const handleListNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= MAX_NAME_LENGTH) {
        setListName(e.target.value);
      }
    },
    []
  );

  const handleListNameBlur = useCallback(() => setListNameTouched(true), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && isFormValid) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    },
    [isFormValid]
  );

  const handleTemplateClick = useCallback((template: (typeof TEMPLATES)[number]) => {
    setListName(template.name);
    if (template.offset > 0) {
      const date = new Date();
      date.setDate(date.getDate() + template.offset);
      setEventDate(date.toISOString().split("T")[0]);
    }
    nameInputRef.current?.focus();
    nameInputRef.current?.setSelectionRange(0, 0);
  }, []);

  return (
    <div className="flex min-h-full items-start justify-center px-4 pt-6 pb-16 sm:pt-10">
      {/* Modal Container — Dark style matching Add Wish modal */}
      <div className="relative rounded-[30px] bg-[#2b2b2b] p-6 w-full max-w-lg overflow-hidden shadow-2xl" style={{ fontFamily: "Urbanist" }}>
        {/* Header */}
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-white text-center" style={{ fontFamily: "Asul" }}>
            Create a new list
          </h1>
          <p className="mt-2 text-center text-sm text-white/70">
            Start with a template or customize your own
          </p>
        </header>

        <form id={formId} action={formAction}>
          {/* Error Alert */}
          {state.error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {state.error}
            </div>
          )}

          {/* Quick Templates */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
              Quick start
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  className="
                    inline-flex items-center gap-1.5 rounded-full border border-white/10
                    bg-[#3a3a3a] px-3 py-1.5 text-sm font-medium text-white
                    transition-all duration-150
                    hover:bg-[#4a4a4a]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d8df1]/50
                    active:scale-[0.98]
                  "
                >
                  <span>{template.icon}</span>
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Basics */}
          <fieldset className="space-y-4">
            <legend className="sr-only">List basics</legend>

            {/* List Name */}
            <div>
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor={`${formId}-title`}
                  className="block text-sm font-medium tracking-normal text-white mb-2"
                >
                  List name{" "}
                  <span className="text-red-400" aria-label="required">
                    *
                  </span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    charactersRemaining < 20
                      ? "text-amber-400"
                      : "text-white/50"
                  }`}
                  aria-live="polite"
                >
                  {charactersRemaining}
                </span>
              </div>
              <input
                ref={nameInputRef}
                type="text"
                id={`${formId}-title`}
                name="title"
                required
                maxLength={MAX_NAME_LENGTH}
                placeholder="e.g. Tony's 30th Birthday"
                autoComplete="off"
                value={listName}
                onChange={handleListNameChange}
                onBlur={handleListNameBlur}
                onKeyDown={handleKeyDown}
                aria-invalid={showListNameError}
                aria-describedby={showListNameError ? `${formId}-title-error` : undefined}
                className={`
                  block w-full rounded-xl border-0 bg-[#3a3a3a] px-4 py-3.5
                  text-white placeholder:text-white/40
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50
                  ${
                    showListNameError
                      ? "ring-2 ring-red-500/50"
                      : ""
                  }
                `}
              />
              {showListNameError && (
                <p
                  id={`${formId}-title-error`}
                  role="alert"
                  className="mt-1.5 text-xs text-red-300"
                >
                  Give your list a name
                </p>
              )}
            </div>

            {/* Event Date */}
            <div>
              <label
                htmlFor={`${formId}-event-date`}
                className="block text-sm font-medium text-white mb-2"
              >
                Event date{" "}
                <span className="font-normal text-white/50">(optional)</span>
              </label>
              <input
                type="date"
                id={`${formId}-event-date`}
                name="event_date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="
                  block w-full rounded-xl border-0 bg-[#3a3a3a] px-4 py-3.5
                  text-white
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#9d8df1]/50
                "
              />
            </div>
          </fieldset>

          {/* Section: List Type */}
          <fieldset className="mt-6">
            <legend className="block text-sm font-medium text-white mb-3">
              What kind of list?
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LIST_TYPE_CONFIG) as ListType[]).map((type) => {
                const config = LIST_TYPE_CONFIG[type];
                const isSelected = listType === type;
                return (
                  <label
                    key={type}
                    className={`
                      relative flex cursor-pointer flex-col items-center text-center rounded-xl border p-3
                      transition-all duration-150
                      focus-within:ring-2 focus-within:ring-[#9d8df1]/50
                      ${
                        isSelected
                          ? "border-[#9d8df1]/50 bg-[#9d8df1]/20"
                          : "border-white/10 bg-[#3a3a3a] hover:bg-[#4a4a4a]"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="recipient_type"
                      value={LIST_TYPE_TO_RECIPIENT[type]}
                      checked={isSelected}
                      onChange={() => setListType(type)}
                      className="sr-only"
                    />
                    <span
                      className={`
                        shrink-0 rounded-xl p-2 transition-colors
                        ${isSelected ? "bg-[#9d8df1] text-white" : "bg-[#4a4a4a] text-white/70"}
                      `}
                    >
                      {config.icon}
                    </span>
                    <p className="mt-2 text-sm font-medium text-white">
                      {config.label}
                    </p>
                    <p className="mt-0.5 text-xs text-white/60 leading-tight">
                      {config.description}
                    </p>
                    {isSelected && (
                      <svg
                        className="absolute top-2 right-2 h-4 w-4 text-[#9d8df1]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Section: Visibility */}
          <fieldset className="mt-6">
            <legend className="block text-sm font-medium text-white mb-3">
              Who can see it?
            </legend>

            <div className="inline-flex rounded-full border border-white/10 bg-[#3a3a3a] p-1">
              {VISIBILITY_OPTIONS.map((option) => {
                const isSelected = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setVisibility(option.value)}
                    className={`
                      rounded-full px-4 py-2 text-sm font-medium
                      transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d8df1]/50
                      ${
                        isSelected
                          ? "bg-[#9d8df1] text-white shadow-sm"
                          : "text-white/60 hover:text-white"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-white/50">{visibilityHelper}</p>
            <input
              type="hidden"
              name="visibility"
              value={visibility === "private_link" ? "unlisted" : visibility}
            />
          </fieldset>

          {/* Section: Advanced Options (Collapsible) */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="
                flex w-full items-center justify-between rounded-xl border border-white/10
                bg-[#3a3a3a] px-4 py-3 text-left text-sm font-medium text-white
                transition-all duration-150
                hover:bg-[#4a4a4a]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9d8df1]/50
              "
              aria-expanded={showAdvanced}
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gift controls
              </span>
              <svg
                className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
                  showAdvanced ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-1 rounded-xl border border-white/10 bg-[#3a3a3a] p-4">
                <Toggle
                  name="allow_reservations"
                  label="Reservations"
                  helperText="Guests can claim items to prevent duplicates"
                  checked={allowReservations}
                  onCheckedChange={setAllowReservations}
                />

                <Toggle
                  name="allow_contributions"
                  label="Contributions"
                  helperText="Multiple people can chip in on one gift"
                  checked={allowContributions}
                  onCheckedChange={setAllowContributions}
                />

                <Toggle
                  name="allow_anonymous"
                  label="Anonymous givers"
                  helperText="Hide contributor names from others"
                  checked={allowAnonymous}
                  onCheckedChange={setAllowAnonymous}
                />
              </div>
            )}
          </div>

          {/* Hidden fields to preserve toggle state when panel is collapsed */}
          {!showAdvanced && (
            <>
              <input type="hidden" name="allow_reservations" value={String(allowReservations)} />
              <input type="hidden" name="allow_contributions" value={String(allowContributions)} />
              <input type="hidden" name="allow_anonymous" value={String(allowAnonymous)} />
            </>
          )}

          {/* Footer Actions */}
          <footer className="mt-8 flex items-center justify-between">
            <Link
              href="/app/lists"
              className="
                rounded-xl px-4 py-2 text-sm font-medium text-white/60
                transition-all duration-150
                hover:bg-white/5 hover:text-white
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#9d8df1]/50
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className="
                rounded-full bg-[#9d8df1] px-6 py-3 text-center text-base font-semibold text-white
                shadow-sm transition-all duration-200
                hover:bg-[#8a7ae0] hover:scale-[1.01]
                active:scale-[0.99]
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create list"
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
