import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Desira",
  description: "What Desira is and who it is for.",
};

export default function AboutPage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[#2b2b2b]">
      <h1 className="font-asul text-4xl">About Desira</h1>
      <p className="mt-4 text-sm leading-7 text-[#2b2b2b]/80">
        Desira helps people coordinate gifts without duplicates. Create a list, share it, and let
        friends either buy an item directly or contribute toward bigger items.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        Our goal is simple coordination with fewer awkward moments: clear item states, anonymous
        guest actions where appropriate, and transparent contribution tracking.
      </p>
    </main>
  );
}
