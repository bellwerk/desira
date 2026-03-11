import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  action,
  align = "left",
  className = "",
}: PageHeaderProps): React.ReactElement {
  const textAlignment = align === "center" ? "text-center" : "text-left";

  return (
    <header className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#2b2b2b]/20 bg-white/70 px-4 text-sm font-medium text-[#2b2b2b] transition-colors hover:bg-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {backLabel}
          </Link>
        ) : (
          <div />
        )}
        {action}
      </div>
      <div className={textAlignment}>
        <h1 className="font-asul text-[32px] leading-tight text-[#2b2b2b] sm:text-[40px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm font-medium text-[#4a4a4a]">{subtitle}</p>
        )}
      </div>
    </header>
  );
}

