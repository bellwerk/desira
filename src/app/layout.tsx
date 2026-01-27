import type { Metadata } from "next";
import { Urbanist, Asul } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
    "Coordinate gifts with friends and family. Create wishlists, reserve items, and contribute to gifts without duplicates.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
