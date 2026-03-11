"use client";

import { useMemo, useState } from "react";
import { GlassButton } from "@/components/ui";

type BugCategory = "bug" | "ui" | "payments" | "other";

const CATEGORY_OPTIONS: Array<{ value: BugCategory; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "ui", label: "UI" },
  { value: "payments", label: "Payments" },
  { value: "other", label: "Other" },
];

export function BugReportForm(): React.ReactElement {
  const [category, setCategory] = useState<BugCategory>("bug");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const pagePath = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.pathname}${window.location.search}`;
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setResultMessage(null);
    setIsError(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          summary,
          details,
          page: pagePath,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok: true; reportId: string }
        | { ok: false; error?: { message?: string } }
        | null;

      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        setIsError(true);
        setResultMessage(
          payload && "error" in payload && payload.error?.message
            ? payload.error.message
            : "Could not submit your report. Please try again."
        );
        return;
      }

      setSummary("");
      setDetails("");
      setResultMessage(`Thanks. Report ID: ${payload.reportId}`);
    } catch {
      setIsError(true);
      setResultMessage("Could not submit your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="bug-category" className="text-sm font-medium text-[#2b2b2b]">
          Category
        </label>
        <select
          id="bug-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as BugCategory)}
          className="w-full rounded-xl border border-[#2b2b2b]/15 bg-white px-3 py-2.5 text-sm text-[#2b2b2b] outline-none focus:ring-2 focus:ring-[#9d8df1]/45"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bug-summary" className="text-sm font-medium text-[#2b2b2b]">
          Summary
        </label>
        <input
          id="bug-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          minLength={10}
          maxLength={160}
          required
          placeholder="Short summary (what broke?)"
          className="w-full rounded-xl border border-[#2b2b2b]/15 bg-white px-3 py-2.5 text-sm text-[#2b2b2b] placeholder:text-[#2b2b2b]/40 outline-none focus:ring-2 focus:ring-[#9d8df1]/45"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bug-details" className="text-sm font-medium text-[#2b2b2b]">
          Details
        </label>
        <textarea
          id="bug-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          minLength={20}
          maxLength={4000}
          required
          rows={7}
          placeholder="Steps to reproduce, expected result, and what happened."
          className="w-full rounded-xl border border-[#2b2b2b]/15 bg-white px-3 py-2.5 text-sm text-[#2b2b2b] placeholder:text-[#2b2b2b]/40 outline-none focus:ring-2 focus:ring-[#9d8df1]/45"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <GlassButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          Submit report
        </GlassButton>
        <span className="text-xs text-[#4f4f4f]">Current page: {pagePath || "N/A"}</span>
      </div>

      {resultMessage && (
        <p className={`text-sm ${isError ? "text-[#b23d3d]" : "text-[#2f6a3a]"}`}>
          {resultMessage}
        </p>
      )}
    </form>
  );
}

