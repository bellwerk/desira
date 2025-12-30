import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-check auth (middleware should handle this, but defense-in-depth)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Desira
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Welcome to your Dashboard
            </h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              This is your authenticated area. Here you&apos;ll be able to:
            </p>
            <ul className="list-inside list-disc space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>Create and manage gift lists</li>
              <li>Add wishes with prices and links</li>
              <li>Share lists with friends and family</li>
              <li>Track contributions and reservations</li>
            </ul>

            <div className="mt-8 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              🚧 List management UI coming in M3.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
