import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Root page for app.desira.gift
 *
 * Smart redirect:
 * - Authenticated users → /app (dashboard)
 * - Unauthenticated users → /login
 *
 * The main marketing landing page lives at desira.gift (separate site).
 * This prevents duplicate content/SEO issues.
 */

// Force dynamic - always check auth state at runtime
export const dynamic = "force-dynamic";

export default async function RootPage(): Promise<never> {
  // If Supabase not configured, go to login (which shows config error)
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  } else {
    redirect("/login");
  }
}
