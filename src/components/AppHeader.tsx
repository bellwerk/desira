"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

export function AppHeader({ displayName, username, avatarUrl }: AppHeaderProps): React.ReactElement {
  const pathname = usePathname();
  
  // Determine which tab is active - Create New is default unless on My Lists page
  const isMyLists = pathname === "/app/lists" || (pathname.startsWith("/app/lists/") && pathname !== "/app/lists/new");
  const isCreateNew = !isMyLists;

  return (
    <header className="relative flex h-20 items-center justify-between bg-transparent px-8">
      {/* Logo */}
      <Link href="/app" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="font-asul text-3xl font-semibold tracking-normal text-[#2B2B2B]">
          desira
        </span>
      </Link>

      {/* Center navigation - absolutely positioned for true centering */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center rounded-full bg-[#2B2B2B] p-1 text-[#EAEAEA]">
          <Link
            href="/app/lists/new"
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-center text-sm font-normal transition-all ${
              isCreateNew
                ? "bg-[#D4D7C2] text-[#2B2B2B] shadow-none"
                : "text-[#EAEAEA] hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New
          </Link>
          <Link
            href="/app/lists"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              isMyLists
                ? "bg-[#D4D7C2] text-[#2B2B2B] shadow-none"
                : "text-[#EAEAEA] hover:text-white"
            }`}
          >
            My Lists
          </Link>
        </div>
      </div>

      {/* User profile */}
      <Link 
        href="/app/settings" 
        className="group relative flex h-11 items-center gap-3 overflow-hidden rounded-full border border-[#2B2B2B]/20 bg-white/80 pl-4 pr-1.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[#2B2B2B]/40 hover:bg-white/90 hover:shadow-md active:scale-[0.98]"
      >
        {/* Gradient hover effect */}
        <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4D7C2]/10 to-transparent" />
        </div>
        
        {/* User info */}
        <div className="flex flex-col text-right">
          <span className="text-xs font-semibold leading-tight tracking-tight text-[#2B2B2B] transition-colors duration-200 group-hover:text-[#1a1a1a]">
            {displayName}
          </span>
          <span className="text-[10px] leading-tight text-[#2B2B2B]/50 transition-colors duration-200 group-hover:text-[#2B2B2B]/70">
            @{username}
          </span>
        </div>
        
        {/* Avatar with ring effect */}
        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#D4D7C2] to-[#c5c9b3] shadow-inner ring-2 ring-[#2B2B2B]/10 transition-all duration-300 group-hover:ring-[#2B2B2B]/20 group-hover:shadow-md">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <svg 
              className="h-4 w-4 text-[#2B2B2B]/70 transition-transform duration-300 group-hover:scale-110" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          )}
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </Link>
    </header>
  );
}
