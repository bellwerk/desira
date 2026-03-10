import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui";
import { toPublicUrl } from "@/lib/public-site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Public Lists | Desira",
  description: "Browse featured and recent public gift lists on Desira.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Explore Public Lists | Desira",
    description: "Browse featured and recent public gift lists on Desira.",
    url: toPublicUrl("/explore"),
    type: "website",
    siteName: "Desira",
  },
};

type PublicListRow = {
  id: string;
  owner_id: string;
  title: string;
  occasion: string | null;
  share_token: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  handle: string;
};

export default async function ExplorePage(): Promise<React.ReactElement> {
  const { data: lists, error } = await supabaseAdmin
    .from("lists")
    .select("id, owner_id, title, occasion, share_token, created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 text-[#2b2b2b]">
        <h1 className="font-asul text-4xl">Explore</h1>
        <p className="mt-4 text-sm text-[#b23d3d]">Could not load public lists right now.</p>
      </main>
    );
  }

  const typedLists = (lists ?? []) as PublicListRow[];
  const ownerIds = Array.from(new Set(typedLists.map((list) => list.owner_id)));

  let profileMap = new Map<string, ProfileRow>();
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, handle")
      .in("id", ownerIds);

    profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  }

  const featured = typedLists.slice(0, 6);
  const recent = typedLists.slice(6);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 text-[#2b2b2b]">
      <header className="mb-8 text-center">
        <h1 className="font-asul text-4xl sm:text-5xl">Explore Public Lists</h1>
        <p className="mt-3 text-sm text-[#2b2b2b]/75">
          Featured and recent lists shared by the Desira community.
        </p>
      </header>

      {typedLists.length === 0 ? (
        <GlassCard className="rounded-3xl p-8 text-center">
          <p className="text-sm text-[#2b2b2b]/70">No public lists yet. Check back soon.</p>
        </GlassCard>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-xl font-semibold">Featured</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((list) => {
                const profile = profileMap.get(list.owner_id);
                return (
                  <ListCard key={list.id} list={list} profile={profile} />
                );
              })}
            </div>
          </section>

          {recent.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Recent</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((list) => {
                  const profile = profileMap.get(list.owner_id);
                  return (
                    <ListCard key={list.id} list={list} profile={profile} />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function ListCard({
  list,
  profile,
}: {
  list: PublicListRow;
  profile: ProfileRow | undefined;
}): React.ReactElement {
  const displayName = profile?.display_name?.trim() || "Desira member";
  const ownerPath = profile?.handle ? `/@/${profile.handle}` : null;

  return (
    <GlassCard className="rounded-3xl p-5">
      <h3 className="line-clamp-2 text-lg font-semibold text-[#2b2b2b]">{list.title}</h3>
      {list.occasion && <p className="mt-1 text-xs text-[#2b2b2b]/65">Occasion: {list.occasion}</p>}
      <p className="mt-3 text-sm text-[#2b2b2b]/75">By {displayName}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/u/${list.share_token}`}
          className="rounded-full border border-[#2b2b2b]/20 px-3 py-1.5 text-xs font-medium text-[#2b2b2b] transition-colors hover:bg-white"
        >
          View list
        </Link>
        {ownerPath && (
          <Link
            href={ownerPath}
            className="rounded-full border border-[#2b2b2b]/20 px-3 py-1.5 text-xs font-medium text-[#2b2b2b] transition-colors hover:bg-white"
          >
            View profile
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
