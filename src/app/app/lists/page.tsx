import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlassCard, GlassButton, BadgeChip } from "@/components/ui";

interface ListRow {
  id: string;
  title: string;
  recipient_type: string;
  visibility: string;
  occasion: string | null;
  event_date: string | null;
  share_token: string;
  created_at: string;
  owner_id: string;
}

export default async function ListsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          Please sign in to view your lists.
        </p>
      </div>
    );
  }

  // RLS returns all lists where user is an accepted member (includes owned lists)
  const { data: lists, error } = await supabase
    .from("lists")
    .select(
      "id, title, recipient_type, visibility, occasion, event_date, share_token, created_at, owner_id"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <GlassCard className="border-red-200/50 dark:border-red-800/50">
        <h2 className="font-semibold text-red-800 dark:text-red-200">
          Error loading lists
        </h2>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      </GlassCard>
    );
  }

  const typedLists = (lists ?? []) as ListRow[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#343338] dark:text-white">
            My Lists
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your wishlists and share them with friends and family.
          </p>
        </div>
        <Link href="/app/lists/new">
          <GlassButton variant="primary" size="md">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New List
          </GlassButton>
        </Link>
      </div>

      {/* Lists */}
      {typedLists.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/60 dark:bg-slate-800/60">
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
                d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-[#343338] dark:text-white">
            No lists yet
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Create your first wishlist to start organizing gifts.
          </p>
          <Link href="/app/lists/new" className="inline-block mt-6">
            <GlassButton variant="primary" size="md">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create your first list
            </GlassButton>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {typedLists.map((list) => (
            <ListCard key={list.id} list={list} userId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListCard({ list, userId }: { list: ListRow; userId: string }): React.ReactElement {
  const shareUrl = `/u/${list.share_token}`;
  const isOwner = list.owner_id === userId;

  const visibilityVariant =
    list.visibility === "private"
      ? "private"
      : list.visibility === "public"
      ? "public"
      : "unlisted";

  const visibilityLabel =
    list.visibility === "private"
      ? "Private"
      : list.visibility === "public"
      ? "Public"
      : "Unlisted";

  return (
    <GlassCard variant="interactive">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#343338] dark:text-white">
              {list.title}
            </h3>
            <BadgeChip variant={visibilityVariant}>{visibilityLabel}</BadgeChip>
            {!isOwner && (
              <BadgeChip variant="unlisted">Shared with me</BadgeChip>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              {list.recipient_type === "person" ? "Individual" : "Group"}
            </span>
            {list.occasion && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m18-4.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {list.occasion}
              </span>
            )}
            {list.event_date && (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                {new Date(list.event_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={shareUrl} target="_blank">
            <GlassButton variant="ghost" size="sm">
              View
            </GlassButton>
          </Link>
          <Link href={`/app/lists/${list.id}`}>
            <GlassButton variant="secondary" size="sm">
              Manage
            </GlassButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
