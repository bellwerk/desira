import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desira — Gifts without duplicates",
  description:
    "Reserve a gift secretly so no one buys the same thing — or contribute money so they can buy it later. Perfect for families and group gifting.",
  openGraph: {
    title: "Desira — Gifts without duplicates",
    description:
      "Reserve a gift secretly so no one buys the same thing — or contribute money so they can buy it later.",
    type: "website",
    url: "https://desira.app",
    siteName: "Desira",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Desira — Gifts without duplicates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desira — Gifts without duplicates",
    description:
      "Reserve a gift secretly so no one buys the same thing — or contribute money so they can buy it later.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://desira.app",
  },
};

/* ====================
   Icon Components
==================== */

function GiftBoxIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="24" width="48" height="36" rx="4" fill="#f472b6" />
      <rect x="4" y="16" width="56" height="12" rx="3" fill="#a78bfa" />
      <rect x="28" y="16" width="8" height="44" fill="#fbbf24" />
      <path
        d="M32 16C32 16 24 8 18 8C12 8 10 12 10 14C10 18 16 20 32 16Z"
        fill="#fcd34d"
      />
      <path
        d="M32 16C32 16 40 8 46 8C52 8 54 12 54 14C54 18 48 20 32 16Z"
        fill="#fcd34d"
      />
    </svg>
  );
}

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

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


function LockIcon({ className = "" }: { className?: string }) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function WalletIcon({ className = "" }: { className?: string }) {
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
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="16" cy="14" r="2" />
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

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ====================
   Decorative Components
==================== */

function FloatingGifts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large floating gift */}
      <div className="animate-float absolute right-[10%] top-[15%]">
        <GiftBoxIcon className="h-24 w-24 opacity-20 sm:h-32 sm:w-32 md:h-40 md:w-40" />
      </div>
      
      {/* Small floating hearts */}
      <div className="animate-float-delayed absolute left-[5%] top-[25%]">
        <HeartIcon className="h-8 w-8 text-pink-300 opacity-40" />
      </div>
      <div className="animate-float absolute bottom-[30%] right-[15%]">
        <HeartIcon className="h-6 w-6 text-pink-400 opacity-30" />
      </div>
      
      {/* Sparkles */}
      <div className="animate-pulse-soft absolute left-[15%] top-[40%]">
        <SparkleIcon className="h-6 w-6 text-yellow-400 opacity-50" />
      </div>
      <div className="animate-pulse-soft absolute right-[25%] top-[60%]" style={{ animationDelay: "1s" }}>
        <SparkleIcon className="h-5 w-5 text-purple-400 opacity-40" />
      </div>
      
      {/* Gradient blobs */}
      <div className="blob absolute -left-20 top-20 h-72 w-72 bg-purple-300/30" />
      <div className="blob absolute -right-20 top-40 h-80 w-80 bg-pink-300/25" />
      <div className="blob absolute bottom-20 left-1/3 h-60 w-60 bg-yellow-300/20" />
    </div>
  );
}

/* ====================
   Main Page Component
==================== */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border-color)]/50 bg-[var(--background)]/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <HeartIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              Desira
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/u/demo"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:block"
            >
              View Demo
            </Link>
            <Link
              href="/login"
              className="btn-primary text-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40">
        <FloatingGifts />
        
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 dark:border-purple-800 dark:bg-purple-900/30">
            <SparkleIcon className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              The smarter way to gift
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl">
            Gift-giving,{" "}
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              without the duplicates
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
            Create wishlists, reserve gifts secretly, and let friends chip in together. 
            No more awkward double-ups or ruined surprises.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              <HeartIcon className="h-5 w-5" />
              Create Your Wishlist
            </Link>
            <Link
              href="/u/demo"
              className="btn-secondary inline-flex items-center gap-2 text-base"
            >
              See How It Works
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span>No account needed to view</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span>Reservations stay secret</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-[var(--bg-soft)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Everything you need for perfect gifting
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
              Simple tools that make coordinating gifts with family and friends a breeze.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1: Secret Reservations */}
            <div className="feature-card group">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50">
                <LockIcon className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Secret Reservations
              </h3>
              <p className="leading-relaxed text-[var(--text-secondary)]">
                Claim a gift without anyone knowing it was you. Prevent duplicates while keeping the surprise intact.
              </p>
            </div>

            {/* Feature 2: Group Contributions */}
            <div className="feature-card group">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50">
                <WalletIcon className="h-7 w-7 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Group Contributions
              </h3>
              <p className="leading-relaxed text-[var(--text-secondary)]">
                Chip in together for bigger gifts. See the funding progress without revealing who contributed what.
              </p>
            </div>

            {/* Feature 3: Easy Sharing */}
            <div className="feature-card group">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50">
                <LinkIcon className="h-7 w-7 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Easy Sharing
              </h3>
              <p className="leading-relaxed text-[var(--text-secondary)]">
                Share your list with a single link. Friends and family can view and participate without creating an account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
              Get started in minutes — it&apos;s that simple.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Create a wishlist
              </h3>
              <p className="text-[var(--text-secondary)]">
                Start a list for yourself or someone you love. Add items with links, prices, and notes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Share the link
              </h3>
              <p className="text-[var(--text-secondary)]">
                Send your wishlist to friends and family. They can view it instantly — no signup required.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                Receive perfect gifts
              </h3>
              <p className="text-[var(--text-secondary)]">
                Friends reserve or contribute to gifts. You get exactly what you wanted — no duplicates!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="bg-gradient-to-b from-[var(--bg-pink)] to-[var(--background)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Loved by families everywhere
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
              Join thousands of people who&apos;ve made gift-giving stress-free.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-white p-6 dark:bg-[var(--bg-soft)]">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-[var(--text-secondary)]">
                &ldquo;Finally, no more awkward moments when two people show up with the same gift. This is exactly what our family needed!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-sm font-bold text-white">
                  SM
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Sarah M.</p>
                  <p className="text-sm text-[var(--text-muted)]">Mom of 3</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-white p-6 dark:bg-[var(--bg-soft)]">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-[var(--text-secondary)]">
                &ldquo;The group contribution feature is genius. We pooled together for mom&apos;s big birthday gift without any coordination headaches.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-sm font-bold text-white">
                  JK
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">James K.</p>
                  <p className="text-sm text-[var(--text-muted)]">Gift coordinator</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-white p-6 dark:bg-[var(--bg-soft)]">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <p className="mb-4 text-[var(--text-secondary)]">
                &ldquo;So simple! I shared my wishlist link and my in-laws could immediately see what to get. No apps to download, no accounts to create.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-400 text-sm font-bold text-white">
                  EL
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Emily L.</p>
                  <p className="text-sm text-[var(--text-muted)]">Newlywed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative">
            {/* Decorative elements */}
            <div className="absolute -left-8 -top-8">
              <SparkleIcon className="h-8 w-8 text-yellow-400 opacity-60" />
            </div>
            <div className="absolute -bottom-4 -right-4">
              <HeartIcon className="h-10 w-10 text-pink-400 opacity-50" />
            </div>
            
            <h2 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
              Ready to make gifting easier?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--text-secondary)]">
              Create your first wishlist in seconds. It&apos;s free, and your friends will thank you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2 text-base"
              >
                <HeartIcon className="h-5 w-5" />
                Get Started — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <HeartIcon className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Desira
              </span>
            </div>

            <nav className="flex gap-6 text-sm">
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
                href="/u/demo"
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Demo
              </Link>
            </nav>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-color)] pt-8 sm:flex-row">
            <p className="text-sm text-[var(--text-muted)]">
              © {new Date().getFullYear()} Desira. All rights reserved.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Some product links may earn us a small commission at no extra cost to you.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
