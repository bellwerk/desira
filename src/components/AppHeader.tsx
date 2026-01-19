"use client";

import Link from "next/link";

interface AppHeaderProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

export function AppHeader({ displayName, username, avatarUrl }: AppHeaderProps): React.ReactElement {
  return (
    <header className="relative flex h-20 items-center justify-between bg-transparent px-8">
      {/* Logo */}
      <Link href="/app" className="flex items-center">
        <span className="font-asul text-3xl font-normal tracking-normal text-slate-800 dark:text-white italic">
          desira
        </span>
      </Link>

      {/* Center navigation - absolutely positioned for true centering */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center rounded-full bg-[#2B2B2B] p-1 text-[#EAEAEA]">
          <Link
            href="/app/lists/new"
            className="flex items-center gap-2 rounded-full bg-[#D4D7C2] px-5 py-2.5 text-center text-sm font-normal text-[#2B2B2B] shadow-none transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New
          </Link>
          <Link
            href="/app/lists"
            className="px-5 py-2.5 text-sm font-medium text-[#EAEAEA] transition-colors hover:text-white"
          >
            My Lists
          </Link>
        </div>
      </div>

      {/* User profile */}
      <Link href="/app/settings" className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-[#2b2b2b]">
            {displayName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{username}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          )}
        </div>
      </Link>
    </header>
  );
}
