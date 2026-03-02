import Link from "next/link";
import { GlassCard } from "./GlassCard";

type ErrorStateCardProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  showIcon?: boolean;
};

/**
 * Reusable error/empty-state card for shared public pages.
 */
export function ErrorStateCard({
  title,
  message,
  actionLabel,
  actionHref,
  className = "",
  showIcon = true,
}: ErrorStateCardProps): React.ReactElement {
  const shouldShowAction = Boolean(actionLabel && actionHref);

  return (
    <GlassCard className={`py-8 text-center ${className}`}>
      {showIcon ? (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/60">
          <svg
            className="h-8 w-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
      ) : null}

      <h1 className="mt-4 text-lg font-semibold text-[#2B2B2B]">{title}</h1>
      <p className="mt-2 text-sm text-[#62748e]">{message}</p>

      {shouldShowAction ? (
        <div className="mt-5">
          <Link
            href={actionHref ?? "#"}
            className="inline-flex rounded-full border border-[#2B2B2B]/20 px-4 py-2 text-sm font-medium text-[#2B2B2B] transition-all hover:bg-white/70"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </GlassCard>
  );
}

