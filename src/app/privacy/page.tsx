import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Desira",
  description: "Privacy practices for Desira users and visitors.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 text-[#2b2b2b]">
      <h1 className="font-asul text-4xl">Privacy</h1>
      <p className="mt-4 text-sm leading-7 text-[#2b2b2b]/80">
        Desira collects the minimum data needed to support accounts, list sharing, and payments.
        This includes account identifiers, list content, and operational logs.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        Payment data is processed by Stripe. Desira does not store full card details. We use trusted
        service providers for authentication, hosting, and analytics/operations.
      </p>
      <p className="mt-3 text-sm leading-7 text-[#2b2b2b]/80">
        To request data access or deletion, contact us using the contact page and include the email
        address on your account.
      </p>
    </main>
  );
}
