import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getRecentPublicIdeas } from "@/lib/ideas/server";
import { GiftFinderClient } from "@/components/ideas/GiftFinderClient";
import { parseIdeaCategoryFilter } from "@/lib/ideas/types";

export const dynamic = "force-dynamic";

type PublicIdeasPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

function getSingleCategoryParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function PublicIdeasPage({
  searchParams,
}: PublicIdeasPageProps): Promise<React.ReactElement> {
  const { category } = await searchParams;
  const categoryParam = getSingleCategoryParam(category);
  const initialCategory = parseIdeaCategoryFilter(categoryParam);
  const appIdeasPath = categoryParam
    ? `/app/ideas?category=${encodeURIComponent(initialCategory)}`
    : "/app/ideas";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(appIdeasPath);
    }
  }

  const ideas = await getRecentPublicIdeas();

  return (
    <div className="min-h-screen bg-[#EAEAEA] px-3 pb-8 pt-4 text-[#2b2b2b] sm:px-4 sm:pt-6">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-end gap-2">
        <Link
          href={`/login?next=${encodeURIComponent(appIdeasPath)}`}
          className="inline-flex h-11 items-center rounded-full border border-[#2b2b2b]/20 bg-white/70 px-5 text-sm font-medium text-[#2b2b2b] transition hover:bg-white"
        >
          Sign in
        </Link>
        <Link
          href="/login?signup=true&next=%2Fapp%2Flists%2Fnew"
          className="inline-flex h-11 items-center rounded-full bg-[#2b2b2b] px-5 text-sm font-medium text-white transition hover:bg-[#1f1f1f]"
        >
          Create your list
        </Link>
      </div>

      <GiftFinderClient
        ideas={ideas}
        mode="public"
        initialDisplayCount={24}
        initialCategory={initialCategory}
      />
    </div>
  );
}

