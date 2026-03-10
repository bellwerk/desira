import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GlassCard } from "@/components/ui";
import { toPublicUrl } from "@/lib/public-site";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ username: string }>;
};

type Profile = {
  id: string;
  display_name: string | null;
  handle: string;
  avatar_url: string | null;
};

type PublicList = {
  id: string;
  title: string;
  occasion: string | null;
  share_token: string;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const handle = username.trim().toLowerCase();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, handle")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) {
    return {
      title: "Profile not found | Desira",
      description: "This public profile is unavailable.",
    };
  }

  const name = profile.display_name?.trim() || profile.handle;
  const title = `${name} (@${profile.handle}) | Desira`;
  const description = `Public gift lists shared by ${name} on Desira.`;
  const canonicalPath = `/@/${profile.handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "Desira",
      url: toPublicUrl(canonicalPath),
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps): Promise<React.ReactElement> {
  const { username } = await params;
  const handle = username.trim().toLowerCase();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, handle, avatar_url")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const typedProfile = profile as Profile;
  const { data: lists } = await supabaseAdmin
    .from("lists")
    .select("id, title, occasion, share_token")
    .eq("owner_id", typedProfile.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  const typedLists = (lists ?? []) as PublicList[];
  const displayName = typedProfile.display_name?.trim() || `@${typedProfile.handle}`;
  const profileUrl = toPublicUrl(`/@/${typedProfile.handle}`);
  const profileStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: profileUrl,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      identifier: `@${typedProfile.handle}`,
      url: profileUrl,
    },
    hasPart: typedLists.map((list, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CollectionPage",
        name: list.title,
        url: toPublicUrl(`/u/${list.share_token}`),
      },
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-[#2b2b2b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileStructuredData),
        }}
      />
      <header className="mb-8 flex flex-col items-center text-center">
        {typedProfile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typedProfile.avatar_url}
            alt={displayName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#2b2b2b]/65">
            <span className="text-xl font-semibold">{displayName.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-3 font-asul text-4xl">{displayName}</h1>
        <p className="mt-1 text-sm text-[#2b2b2b]/70">@{typedProfile.handle}</p>
      </header>

      {typedLists.length === 0 ? (
        <GlassCard className="rounded-3xl p-8 text-center">
          <p className="text-sm text-[#2b2b2b]/70">No public lists shared yet.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {typedLists.map((list) => (
            <GlassCard key={list.id} className="rounded-3xl p-5">
              <h2 className="text-lg font-semibold text-[#2b2b2b]">{list.title}</h2>
              {list.occasion && <p className="mt-1 text-xs text-[#2b2b2b]/65">Occasion: {list.occasion}</p>}
              <Link
                href={`/u/${list.share_token}`}
                className="mt-4 inline-flex rounded-full border border-[#2b2b2b]/20 px-3 py-1.5 text-xs font-medium text-[#2b2b2b] transition-colors hover:bg-white"
              >
                View list
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </main>
  );
}
