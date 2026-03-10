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
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, handle, created_at")
      .in("id", ownerIds);

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      entries.push({
        url: toPublicUrl(`/@/${profile.handle}`),
        lastModified: new Date(profile.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
