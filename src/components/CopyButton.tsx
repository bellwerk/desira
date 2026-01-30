"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  variant?: "light" | "dark";
}

export function CopyButton({ text, variant = "light" }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy to clipboard");
    }
  }

  const baseClasses = "inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-medium transition-colors font-[family-name:var(--font-urbanist)]";
  const variantClasses = variant === "dark"
    ? "bg-[#9D8DF1] hover:bg-[#8A7AE0] text-white"
    : "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={variant === "dark" ? `${baseClasses} ${variantClasses}` : variantClasses}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}








