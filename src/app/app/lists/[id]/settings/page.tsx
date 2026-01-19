import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import { InvitesSection } from "./InvitesSection";

type PageProps = {
  params: Promise<{ id: string }>;
};

export type ListSettings = {
  id: string;
  title: string;
  recipient_type: "person" | "group";
  visibility: "unlisted" | "private" | "public";
  occasion: string | null;
  event_date: string | null;
  allow_reservations: boolean;
  allow_contributions: boolean;
  allow_anonymous: boolean;
};

export default async function ListSettingsPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load list (owner only)
  const { data: list, error: listErr } = await supabase
    .from("lists")
    .select(
      `
      id,
      title,
      recipient_type,
      visibility,
      occasion,
      event_date,
      allow_reservations,
      allow_contributions,
      allow_anonymous
    `
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (listErr || !list) {
    notFound();
  }

  const listSettings: ListSettings = {
    id: list.id as string,
    title: list.title as string,
    recipient_type: (list.recipient_type as "person" | "group") ?? "person",
    visibility: (list.visibility as "unlisted" | "private" | "public") ?? "unlisted",
    occasion: list.occasion as string | null,
    event_date: list.event_date as string | null,
    allow_reservations: (list.allow_reservations as boolean | null) ?? true,
    allow_contributions: (list.allow_contributions as boolean | null) ?? true,
    allow_anonymous: (list.allow_anonymous as boolean | null) ?? true,
  };

  // Build base URL for invite links
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/app/lists/${id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[#343338] dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Back to list
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[#343338] dark:text-white">
          List settings
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Update your list details and preferences.
        </p>
      </div>

      <SettingsForm list={listSettings} />
      
      <InvitesSection listId={id} baseUrl={baseUrl} />
    </div>
  );
}

