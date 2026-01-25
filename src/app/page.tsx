import Link from "next/link";
import type { Metadata } from "next";
import { FAQSection } from "@/components/landing/FAQSection";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";

export const metadata: Metadata = {
  title: "Desira — Single-link wishlists",
  description:
    "Create wish lists, gift lists, and registries. Share one link so friends can reserve gifts or contribute instantly — no sign-up needed.",
  openGraph: {
    title: "Desira — Single-link wishlists",
    description:
      "Create wish lists, gift lists, and registries. Share one link so friends can reserve gifts or contribute instantly — no sign-up needed.",
    type: "website",
    url: "https://desira.app",
    siteName: "Desira",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Desira — Single-link wishlists",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desira — Single-link wishlists",
    description:
      "Create wish lists, gift lists, and registries. Share one link so friends can reserve gifts or contribute instantly — no sign-up needed.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://desira.app",
  },
};

/* ====================
   Icon Components
==================== */

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StoreIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UserCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

function HandCoinsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 16 6 6" />
      <circle cx="16" cy="9" r="2.9" />
      <circle cx="6" cy="5" r="3" />
    </svg>
  );
}

function UsersIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function LinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

/* ====================
   Why Desira Features
==================== */

const WHY_DESIRA_FEATURES = [
  {
    icon: StoreIcon,
    title: "Any Store",
    description: "Just paste a product link and we will do the rest.",
  },
  {
    icon: UserCheckIcon,
    title: "No guest sign-up",
    description: "Your guests just open the link and gift immediately.",
  },
  {
    icon: HandCoinsIcon,
    title: "Reserve or chip in",
    description: "Guests can reserve or contribute if a gift is too expensive.",
  },
  {
    icon: UsersIcon,
    title: "Shared wishlists",
    description: "Create a shared one and add items together.",
  },
];

/* ====================
   How It Works Steps
==================== */

const HOW_IT_WORKS_STEPS = [
  {
    number: "1",
    title: "Create a wishlist & add wishes",
    description:
      "Just paste a link from any store, details will load automatically, add notes (sizes, colors, \"anything but candles\")",
  },
  {
    number: "2",
    title: "Share your wishlist link",
    description:
      "Send it to friends, family or anyone else. Guests can view, reserve or contribute instantly, without account needed",
  },
  {
    number: "3",
    title: "Collect gifts or contributions",
    description:
      "Friends reserve your wishes or contribute anonymously. Surprise always kept!",
  },
];

/* ====================
   Features List
==================== */

const FEATURE_BULLETS = [
  "Reserve gifts to avoid duplicate buys",
  "Contributions for bigger wish list items",
  "Private-by-link sharing (not searchable)",
  "Works with any store (your wanted list stays universal)",
];

/* ====================
   Main Page Component
==================== */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border-color)]/50 bg-[var(--background)]/95 backdrop-blur-xl">
        <nav className="container-wide mx-auto flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#9D8DF1] to-[#FF6F59]">
              <HeartIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              Desira
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              FAQ
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 !px-5 !py-2.5 text-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Nav */}
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 !px-4 !py-2 text-sm md:hidden"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-40"
      >
        <div className="container-narrow mx-auto text-center">
          {/* Headline */}
          <h1 className="text-h1 text-[var(--text-primary)]">
            Single-link wishlists{" "}
            <span className="gradient-text">
              Friends can reserve gifts or chip in without sign-up
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
            Create wish lists, gift lists, and registries — private or shared.
            Share one link so friends can reserve gifts or contribute instantly.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Create a wishlist
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary inline-flex items-center gap-2 text-base"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Why Desira Section */}
      <section className="section-padding border-y border-[var(--border-color)] bg-[var(--surface-soft)] px-5 sm:px-8">
        <div className="container-wide mx-auto">
          {/* Section Header */}
          <div className="mb-10 text-center">
            <h2 className="text-h2 text-[var(--text-primary)]">Why Desira</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-[var(--text-secondary)]">
              Made for real-life gifting. Create one gift list link for
              families, friends, weddings, parents and any occasions. Get what
              you actually want with fewer messages, fewer mix-ups, and better
              gifts.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_DESIRA_FEATURES.map((feature) => (
              <div key={feature.title} className="card group text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9D8DF1]/20 to-[#FF6F59]/20">
                  <feature.icon className="h-7 w-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-h3 mb-2 text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Create a wishlist
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="section-padding px-5 sm:px-8"
      >
        <div className="container-wide mx-auto">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="text-h2 text-[var(--text-primary)]">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-[var(--text-secondary)]">
              Make a list of your wishes, share the link, and let others reserve
              or contribute without coordination chaos
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#9D8DF1] to-[#FF6F59] text-xl font-bold text-white shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-h3 mb-3 text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Try for free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Get Fewer Duplicates - Features Section */}
      <section className="section-padding bg-[var(--surface-soft)] px-5 sm:px-8">
        <div className="container-wide mx-auto">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Text Content */}
            <div>
              <h2 className="text-h2 mb-4 text-[var(--text-primary)]">
                Get fewer duplicates
              </h2>
              <p className="mb-8 text-lg text-[var(--text-secondary)]">
                Small features that make a big difference. Designed so your
                saved items become real gifts — without extra steps.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-4">
                {FEATURE_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15">
                      <CheckIcon className="h-4 w-4 text-[var(--success)]" />
                    </div>
                    <span className="text-[var(--text-primary)] font-medium">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Link
                  href="/login"
                  className="btn-primary inline-flex items-center gap-2 text-base"
                >
                  Create a wishlist
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right: Visual/Illustration */}
            <div className="relative">
              <div className="card mx-auto max-w-sm !p-6">
                {/* Mock wishlist item */}
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#9D8DF1]/20 to-[#FF6F59]/20">
                    <GiftIcon className="h-8 w-8 text-[var(--primary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-[var(--border-color)]" />
                    <div className="mt-2 h-3 w-20 rounded bg-[var(--border-light)]" />
                  </div>
                </div>

                {/* Reserved badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-sm font-medium text-[var(--primary)]">
                  <CheckIcon className="h-4 w-4" />
                  Reserved
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Contributions
                    </span>
                    <span className="font-medium text-[var(--text-primary)]">
                      $75 / $100
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border-color)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#9D8DF1] to-[#FF6F59]"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
                    Reserved
                  </button>
                  <button className="flex-1 rounded-full bg-gradient-to-r from-[#9D8DF1] to-[#FF6F59] px-4 py-2 text-sm font-medium text-white">
                    Chip in
                  </button>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] shadow-lg">
                <LinkIcon className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div className="absolute -bottom-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] shadow-lg">
                <ShareIcon className="h-6 w-6 text-[var(--secondary)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <section className="section-padding px-5 sm:px-8">
        <div className="container-narrow mx-auto text-center">
          <h2 className="text-h2 text-[var(--text-primary)]">
            Help your friends get you better gifts!
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[var(--text-secondary)]">
            Create your wishlist, then send one link. Perfect for birthdays,
            weddings, baby showers, and everyday &ldquo;things to buy.&rdquo;
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Create a wishlist
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--surface-soft)] px-5 py-10 sm:px-8">
        <div className="container-wide mx-auto">
          {/* Top Row */}
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#9D8DF1] to-[#FF6F59]">
                <HeartIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-[var(--text-primary)]">
                Desira
              </span>
            </Link>

            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Terms
              </Link>
              <Link
                href="/affiliate"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Affiliate disclosure
              </Link>
              <Link
                href="mailto:hello@desira.app"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Support
              </Link>
            </nav>
          </div>

          {/* Bottom Row */}
          <div className="mt-8 border-t border-[var(--border-color)] pt-6 text-center text-sm text-[var(--text-muted)]">
            <p>© {new Date().getFullYear()} Desira. All rights reserved</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA />
    </div>
  );
}
