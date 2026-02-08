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
    <div className="min-h-screen bg-[#EAEAEA]">
      {/* Header with Desira branding */}
      <header className="sticky top-0 z-10 glass-1 border-b border-white/20">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-7 w-7" />
            <span className="font-asul text-2xl font-semibold tracking-normal text-[#2B2B2B]">
              desira
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#2B2B2B] transition-all hover:bg-white/50"
            >
              Sign in
            </Link>
            <Link
              href="/login?signup=true"
              className="rounded-full bg-[#2B2B2B] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#3a3a3a]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/20 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2 text-[#2B2B2B]/60 transition-colors hover:text-[#2B2B2B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-5 w-5 opacity-60" />
              <span className="text-sm">Powered by Desira</span>
            </Link>
            <p className="text-xs text-[#2B2B2B]/50">
              Some links may be affiliate links.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

