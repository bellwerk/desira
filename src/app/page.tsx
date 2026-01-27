import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
export default async function RootPage(): Promise<never> {
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
