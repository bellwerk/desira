import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms | Desira",
  description: "Terms of use for the Desira platform.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[#2b2b2b]">
      <h1 className="font-asul text-4xl">Terms</h1>
      <p className="mt-4 text-sm leading-7 text-[#2b2b2b]/80">
        By using Desira, you agree to use the service lawfully and not misuse shared links, payment
        flows, or account access.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        You are responsible for the content you add to lists and for ensuring you have rights to
        share that content. Desira may suspend access for abuse, fraud, or policy violations.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        Desira is provided as-is. We work to keep the service reliable but do not guarantee
        uninterrupted availability.
      </p>
    </main>
  );
}
