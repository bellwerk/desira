import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-rose-50/30 to-amber-50/30 dark:from-slate-900 dark:via-rose-950/20 dark:to-amber-950/20">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AppHeader userEmail={data.user.email ?? ""} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
