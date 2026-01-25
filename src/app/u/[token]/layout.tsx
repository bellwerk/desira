import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Shared list layout — privacy protections
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
  return <>{children}</>;
}

