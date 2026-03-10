import type { Metadata } from "next";
import { Urbanist, Asul } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PublicLegalLinks } from "@/components/PublicLegalLinks";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

const asul = Asul({
  variable: "--font-asul",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://desira.app"
  ),
  title: "Desira - Gift Coordination Made Simple",
  description:
    "Coordinate gifts with friends and family. Create wishlists, buy gifts, and contribute without duplicates.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${urbanist.variable} ${asul.variable} font-[family-name:var(--font-urbanist)] antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <footer className="space-y-1.5 px-4 py-3 text-center font-[family-name:var(--font-urbanist)] text-[14px] text-white/65">
              <p>We may earn a commission for sales made through links on our site.</p>
              <PublicLegalLinks />
            </footer>
            <CookieConsentBanner />
          </div>
        </Providers>
      </body>
    </html>
  );
}
