import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import type { Metadata } from "next";

/**
 * App layout — authenticated area
 *
 * This layout:
 * - Protects routes by requiring authentication
 * - Prevents indexing of authenticated app pages
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
  },
};

// Force dynamic rendering - auth pages should never be statically generated
export const dynamic = "force-dynamic";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // During build, env vars may not be available - redirect to login
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userData.user.id)
    .single<Profile>();

  const email = userData.user.email ?? "";
  const displayName = profile?.display_name ?? email.split("@")[0];
  const username = email.split("@")[0];

  return (
    <div className="min-h-screen bg-[#EAEAEA] dark:bg-[#eaeaea]">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <AppHeader 
          displayName={displayName} 
          username={username}
          avatarUrl={profile?.avatar_url}
        />
        <main className="flex-1 px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
