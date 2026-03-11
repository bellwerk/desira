import type { MetadataRoute } from "next";
import { tryGetSupabaseAdmin } from "@/lib/supabase/admin";
import { toPublicUrl } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type PublicListRow = {
  share_token: string;
  owner_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  handle: string;
  created_at: string;
};

const STATIC_PUBLIC_PATHS = [
  "/",
  "/explore",
  "/affiliate-disclosure",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
];
const PROFILE_ID_BATCH_SIZE = 200;
const PROFILE_PAGE_SIZE = 200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PUBLIC_PATHS.map((path) => ({
    url: toPublicUrl(path),
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const supabaseAdmin = tryGetSupabaseAdmin();
  if (!supabaseAdmin) {
    return entries;
  }

  const { data: publicLists, error } = await supabaseAdmin
    .from("lists")
    .select("share_token, owner_id, created_at")
    .eq("visibility", "public")
    .limit(5000);

  if (error || !publicLists) {
    return entries;
  }

  const typedLists = publicLists as PublicListRow[];
  const ownerIds = Array.from(new Set(typedLists.map((list) => list.owner_id)));

  for (const list of typedLists) {
    entries.push({
      url: toPublicUrl(`/u/${list.share_token}`),
      lastModified: new Date(list.created_at),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  if (ownerIds.length > 0) {
    const seenProfileIds = new Set<string>();

    for (let batchStart = 0; batchStart < ownerIds.length; batchStart += PROFILE_ID_BATCH_SIZE) {
      const ownerBatch = ownerIds.slice(batchStart, batchStart + PROFILE_ID_BATCH_SIZE);
      let pageStart = 0;

      while (true) {
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("id, handle, created_at")
          .in("id", ownerBatch)
          .range(pageStart, pageStart + PROFILE_PAGE_SIZE - 1);

        if (profilesError || !profiles) {
          break;
        }

        const typedProfiles = profiles as ProfileRow[];

        for (const profile of typedProfiles) {
          if (!profile.handle || seenProfileIds.has(profile.id)) {
            continue;
          }

          seenProfileIds.add(profile.id);
          entries.push({
            url: toPublicUrl(`/@/${profile.handle}`),
            lastModified: new Date(profile.created_at),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }

        if (typedProfiles.length < PROFILE_PAGE_SIZE) {
          break;
        }

        pageStart += PROFILE_PAGE_SIZE;
      }
    }
  }

  return entries;
}
