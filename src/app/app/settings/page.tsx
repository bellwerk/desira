import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { SignOutButton } from "../SignOutButton";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

type SettingsActionLinkProps = {
  href: string;
  title: string;
  description: string;
  value?: string;
};

function SettingsActionLink({
  href,
  title,
  description,
  value,
}: SettingsActionLinkProps): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-[#2b2b2b]/10 bg-white/75 px-4 py-3 transition-colors hover:bg-white"
    >
      <div>
        <p className="text-sm font-semibold text-[#2b2b2b]">{title}</p>
        <p className="mt-0.5 text-xs text-[#2b2b2b]/65">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="rounded-full bg-[#f3f4ee] px-2.5 py-1 text-xs font-medium text-[#2b2b2b]/75">
            {value}
          </span>
        )}
        <svg
          className="h-4 w-4 text-[#2b2b2b]/40 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [listCountResult, unreadResult] = await Promise.all([
    supabase.from("lists").select("id", { count: "exact", head: true }),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  const listCount = listCountResult.count ?? 0;
  const unreadNotificationCount = unreadResult.count ?? 0;
  const email = user?.email ?? "No email";

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12 pt-2">
      <PageHeader
        backHref="/app/lists"
        backLabel="Back to lists"
        title="Settings"
        subtitle="Manage your account, list actions, and notifications."
      />

      <GlassCard className="space-y-3 rounded-[24px] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Account</h2>
          <p className="mt-1 text-xs text-[#2b2b2b]/65">Signed in as</p>
          <p className="mt-0.5 text-sm font-medium text-[#2b2b2b]">{email}</p>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3 rounded-[24px] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[#2b2b2b]">Quick actions</h2>
        <SettingsActionLink
          href="/app/notifications"
          title="Notifications"
          description="Review updates and mark alerts as read."
          value={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread` : "Up to date"}
        />
        <SettingsActionLink
          href="/app/lists"
          title="Your lists"
          description="Manage existing lists, visibility, and sharing."
          value={`${listCount} total`}
        />
        <SettingsActionLink
          href="/app/lists/new"
          title="Create new list"
          description="Start a new wishlist, registry, or personal list."
        />
        <SettingsActionLink
          href="/app/feedback"
          title="Report a bug"
          description="Send a reproducible issue report to the team."
        />
        <p className="pt-1 text-xs text-[#2b2b2b]/60">
          Payout and sharing controls are available inside each list&apos;s settings.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3 rounded-[24px] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[#2b2b2b]">Security</h2>
        <SignOutButton />
      </GlassCard>
    </div>
  );
}
