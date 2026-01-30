"use client";

import { useTransition } from "react";
import { signout } from "../login/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      signout();
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="
        group relative w-full overflow-hidden
        rounded-[14px] bg-gradient-to-b from-[#1a1a1a] to-[#151515]
        px-5 py-3.5 
        text-[14px] font-medium text-white/90
        border border-white/[0.06]
        shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]
        transition-all duration-300 ease-out
        hover:border-red-500/30 hover:bg-gradient-to-b hover:from-red-500/[0.08] hover:to-red-500/[0.12]
        hover:shadow-[0_4px_12px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]
        hover:scale-[1.01]
        active:scale-[0.99] active:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b2b2b]
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
      "
      style={{ fontFamily: "Urbanist" }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
      
      <span className="relative flex items-center justify-center gap-2.5">
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin text-white/70" viewBox="0 0 24 24" fill="none">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-white/70">Signing out...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4 text-white/60 transition-all duration-300 group-hover:text-red-400 group-hover:rotate-12" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" 
              />
            </svg>
            <span className="transition-colors duration-300 group-hover:text-red-300">
              Sign Out
            </span>
          </>
        )}
      </span>
    </button>
  );
}

