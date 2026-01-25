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
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

