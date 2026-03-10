"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "desira_cookie_consent";

type ConsentState = "loading" | "pending" | "accepted" | "declined";

export function CookieConsentBanner(): React.ReactElement | null {
  const [state, setState] = useState<ConsentState>("loading");
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const nextState: ConsentState =
      stored === "accepted" || stored === "declined" ? stored : "pending";

    queueMicrotask(() => {
      setState(nextState);
    });
  }, []);

  function handleChoice(choice: "accepted" | "declined"): void {
    window.localStorage.setItem(STORAGE_KEY, choice);
    setState(choice);
  }

  const hideOnAppSurfaces =
    pathname.startsWith("/app") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth");

  if (state !== "pending" || hideOnAppSurfaces) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-[#2b2b2b]/20 bg-white/95 p-4 shadow-xl backdrop-blur">
      <p className="text-sm text-[#2b2b2b]/80">
        We use cookies and similar technologies to improve product experience and affiliate-link
        attribution.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleChoice("accepted")}
          className="rounded-full bg-[#2b2b2b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => handleChoice("declined")}
          className="rounded-full border border-[#2b2b2b]/25 px-4 py-2 text-xs font-semibold text-[#2b2b2b] transition-colors hover:bg-white"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
