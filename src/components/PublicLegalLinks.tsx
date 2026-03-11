import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function PublicLegalLinks(): React.ReactElement {
  return (
    <nav aria-label="Legal and disclosure links" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-[#3f2f38]/90 underline-offset-4 transition-colors hover:text-[#2b1f27] hover:underline dark:text-white/85 dark:hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

