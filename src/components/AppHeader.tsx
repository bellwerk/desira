"use client";

import { SignOutButton } from "@/app/app/SignOutButton";
import { NotificationBell } from "@/components/NotificationBell";

interface AppHeaderProps {
  userEmail: string;
}

export function AppHeader({ userEmail }: AppHeaderProps): React.ReactElement {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-4">
        {/* Page title could go here - passed as prop or from context */}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-xs font-medium text-white">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {userEmail}
          </span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}






