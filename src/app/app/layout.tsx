import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import type { Metadata } from "next";

/** Check if an error is a Next.js redirect (must be re-thrown, never swallowed) */
function isNextRedirect(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

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
  try {
    // During build, env vars may not be available - redirect to login
    if (!isSupabaseConfigured()) {
      console.error("[AppLayout] Supabase not configured");
      redirect("/login");
    }

    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("[AppLayout] Auth error:", authError.message, authError.code);
    }

    if (!userData?.user) {
      redirect("/login");
    }

    // Fetch profile data - use maybeSingle to handle missing profiles gracefully
    let profile: Profile | null = null;
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[AppLayout] Profile fetch error:", profileError.message, profileError.code, profileError.details);
      } else {
        profile = data;
      }
    } catch (err) {
      // Don't swallow redirect errors from inner code
      if (isNextRedirect(err)) throw err;
      console.error("[AppLayout] Profile fetch exception:", err);
    }

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
  } catch (error) {
    // Let Next.js redirect errors pass through — never swallow them
    if (isNextRedirect(error)) throw error;
    console.error("[AppLayout] Unexpected error:", error);
    // Safest fallback: send to login
    redirect("/login");
  }
}
