import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Shared list layout — privacy protections + branding
 *
 * This layout ensures that shared lists are NOT discoverable by search engines.
 * - noindex, nofollow, noarchive prevents indexing
 * - referrer policy is set to prevent token leakage to external sites
 */
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
};

export default function SharedListLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="min-h-screen bg-[#ececec] text-[#2B2B2B]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_center,rgba(236,193,203,0.32)_0%,rgba(236,236,236,0)_68%)]"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-3 pb-8 sm:px-4 lg:px-6">
        <header className="flex h-14 items-center justify-end sm:h-16">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="rounded-full px-5 py-1.5 text-base font-semibold text-[#2B2B2B] transition-colors hover:bg-white/65 sm:py-2"
            >
              Sign in
            </Link>
            <Link
              href="/login?signup=true"
              className="flex h-11 flex-col items-center justify-center rounded-full bg-[#2b2b2b] px-3 text-[11px] font-normal text-white transition-colors hover:bg-[#2b2b2b] sm:px-4 sm:text-xs"
            >
              Create your list
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

