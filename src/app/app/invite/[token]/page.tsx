import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { acceptInvite } from "../../lists/actions";
import { GlassCard, GlassButton } from "@/components/ui";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcceptInvitePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login with return URL
  if (!user) {
    const returnUrl = encodeURIComponent(`/app/invite/${token}`);
    redirect(`/login?returnUrl=${returnUrl}`);
  }

  // Validate the invite token exists
  // Use admin client to bypass RLS - pending invites have user_id = null
  // and the invitee cannot SELECT them with the regular client.
  // The invite_token itself acts as the credential.
  const { data: invite } = await supabaseAdmin
    .from("list_members")
    .select(`
      id,
      status,
      list_id,
      lists!inner(title, owner_id)
    `)
    .eq("invite_token", token)
    .single();

  if (!invite) {
    return <InvalidInvite />;
  }

  const listTitle = (invite.lists as unknown as { title: string })?.title ?? "Unknown List";
  const listOwnerId = (invite.lists as unknown as { owner_id: string })?.owner_id;

  // If user is the owner, show a message
  if (listOwnerId === user.id) {
    return (
      <div className="mx-auto max-w-md py-12">
        <GlassCard className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
            You own this list
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            You can&apos;t accept an invite to your own list.
          </p>
          <Link href={`/app/lists/${invite.list_id}`} className="mt-6 inline-block">
            <GlassButton variant="primary" size="md">
              Go to list
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // Process the invite
  const result = await acceptInvite(token);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-md py-12">
        <GlassCard className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
            Invite error
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {result.error}
          </p>
          <Link href="/app/lists" className="mt-6 inline-block">
            <GlassButton variant="secondary" size="md">
              Go to my lists
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const { listId, alreadyMember } = result.data as { listId: string; alreadyMember?: boolean };

  return (
    <div className="mx-auto max-w-md py-12">
      <GlassCard className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          {alreadyMember ? "Already a member" : "Invite accepted!"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {alreadyMember
            ? `You're already a member of "${listTitle}".`
            : `You've been added to "${listTitle}".`}
        </p>
        <Link href={`/app/lists/${listId}`} className="mt-6 inline-block">
          <GlassButton variant="primary" size="md">
            View list
          </GlassButton>
        </Link>
      </GlassCard>
    </div>
  );
}

function InvalidInvite(): React.ReactElement {
  return (
    <div className="mx-auto max-w-md py-12">
      <GlassCard className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <svg
            className="h-8 w-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          Invalid invite
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          This invite link is invalid or has already been used.
        </p>
        <Link href="/app/lists" className="mt-6 inline-block">
          <GlassButton variant="secondary" size="md">
            Go to my lists
          </GlassButton>
        </Link>
      </GlassCard>
    </div>
  );
}

