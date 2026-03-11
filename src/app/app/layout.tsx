import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { trackServerError } from "@/lib/error-tracking";
import { APP_DESKTOP_CONTENT_OFFSET_PX } from "@/lib/app-shell";
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

function normalizeCandidatePath(value: string | null): string | null {
  if (!value) return null;

  let candidate = value.trim();
  if (!candidate) return null;

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      candidate = `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  return candidate;
}

function getSafeLoginNext(headerStore: Awaited<ReturnType<typeof headers>>): string {
  const candidates = [
    headerStore.get("x-pathname"),
    headerStore.get("x-invoke-path"),
    headerStore.get("next-url"),
    headerStore.get("x-matched-path"),
  ];

  for (const raw of candidates) {
    const normalized = normalizeCandidatePath(raw);
    if (normalized && (normalized === "/app" || normalized.startsWith("/app/"))) {
      return normalized;
    }
  }

  return "/app";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const safeLoginNext = getSafeLoginNext(headerStore);
  const loginHref = `/login?next=${encodeURIComponent(safeLoginNext)}`;

  try {
    // During build, env vars may not be available - redirect to login
    if (!isSupabaseConfigured()) {
      console.error("[AppLayout] Supabase not configured");
      redirect(loginHref);
    }

    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("[AppLayout] Auth error:", authError.message, authError.code);
    }

    if (!userData?.user) {
      redirect(loginHref);
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
    let unreadNotificationCount = 0;

    try {
      const { count, error: notificationError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
        .eq("is_read", false);

      if (notificationError) {
        console.error(
          "[AppLayout] Notification unread-count fetch error:",
          notificationError.message,
          notificationError.code,
          notificationError.details
        );
      } else {
        unreadNotificationCount = count ?? 0;
      }
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      console.error("[AppLayout] Notification unread-count exception:", err);
    }

    return (
      <div
        className="min-h-screen bg-[#EAEAEA] dark:bg-[#eaeaea]"
        style={
          {
            "--app-desktop-content-offset": `${APP_DESKTOP_CONTENT_OFFSET_PX}px`,
          } as Record<string, string>
        }
      >
        <Sidebar unreadNotificationCount={unreadNotificationCount} />
        <div className="flex min-h-screen flex-col md:pl-[var(--app-desktop-content-offset)]">
          <AppHeader
            displayName={displayName}
            username={username}
            avatarUrl={profile?.avatar_url}
          />
          <main className="flex-1 px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-2 sm:px-4 md:px-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    // Let Next.js redirect errors pass through — never swallow them
    if (isNextRedirect(error)) throw error;
    await trackServerError(error, {
      scope: "app.layout.unexpected",
      metadata: { safe_login_next: safeLoginNext },
    });
    // Safest fallback: send to login
    redirect(loginHref);
  }
}
