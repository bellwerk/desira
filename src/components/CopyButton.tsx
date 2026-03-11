"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  variant?: "light" | "dark";
  onCopied?: () => void;
  className?: string;
  idleLabel?: string;
  copiedLabel?: string;
}

export function CopyButton({
  text,
  variant = "light",
  onCopied,
  className,
  idleLabel = "Copy",
  copiedLabel = "Copied",
}: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy to clipboard");
    }
  }

  const baseClasses = "inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-medium transition-colors font-[family-name:var(--font-urbanist)]";
  const variantClasses = variant === "dark"
    ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
    : "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";
  const copiedClasses = variant === "dark"
    ? "bg-emerald-500 text-white shadow-md"
    : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        variant === "dark"
          ? `${baseClasses} ${copied ? copiedClasses : variantClasses} ${copied ? "scale-[1.02]" : ""} ${className ?? ""}`
          : `${copied ? copiedClasses : variantClasses} ${copied ? "scale-[1.01] shadow-sm" : ""} ${className ?? ""}`
      }
    >
      {copied ? (
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
          {copiedLabel}
        </span>
      ) : (
        idleLabel
      )}
    </button>
  );
}




