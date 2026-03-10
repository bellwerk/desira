import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | Desira",
  description: "How to contact the Desira team.",
};

const SUPPORT_EMAIL = "support@desira.gift";

export default function ContactPage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[#2b2b2b]">
      <h1 className="font-asul text-4xl">Contact</h1>
      <p className="mt-4 text-sm leading-7 text-[#2b2b2b]/80">
        For support, bug reports, or account/privacy requests, contact us at{" "}
        <Link className="underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </Link>
        .
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        If your message is about a payment issue, include the list URL and approximate timestamp so
        we can investigate faster.
      </p>
    </main>
  );
}
