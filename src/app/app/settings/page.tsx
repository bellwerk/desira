import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "../SignOutButton";

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#343338] dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#eaeaea]">
        <h2 className="text-lg font-semibold text-[#343338] dark:text-white">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
              Email
            </label>
            <p className="mt-1 text-[#343338] dark:text-white">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for more settings */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          More settings coming soon: payment setup, notification preferences, and account management.
        </p>
      </div>

      {/* Account actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#eaeaea]">
        <h2 className="text-lg font-semibold text-[#343338] dark:text-white">Account</h2>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}











