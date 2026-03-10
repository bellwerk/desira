import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Desira",
  description: "How Desira uses affiliate links and commissions.",
};

export default function AffiliateDisclosurePage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[#2b2b2b]">
      <h1 className="font-asul text-4xl">Affiliate Disclosure</h1>
      <p className="mt-4 text-sm leading-7 text-[#2b2b2b]/80">
        Some outbound product links on Desira are affiliate links. If you purchase through one of
        those links, Desira may receive a commission at no extra cost to you.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        We use affiliate relationships to support operating costs and product development. Affiliate
        links do not change your price and do not affect whether you can buy or contribute to an
        item.
      </p>
    </main>
  );
}
