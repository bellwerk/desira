import Link from "next/link";

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Welcome card */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Welcome to Desira
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your gift coordination hub. Create lists, share with loved ones, and never give duplicate gifts again.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/app/lists"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 text-white transition-transform group-hover:scale-105">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">My Lists</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View and manage your gift wishlists
          </p>
        </Link>

        <Link
          href="/app/lists/new"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 text-white transition-transform group-hover:scale-105">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Create List</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Start a new wishlist for yourself or a group
          </p>
        </Link>

        <Link
          href="/app/settings"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-rose-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 text-white transition-transform group-hover:scale-105">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Settings</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your account and preferences
          </p>
        </Link>
      </div>

      {/* Getting started checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Getting Started
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Complete these steps to set up your gift coordination.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-slate-600 dark:text-slate-400">Create your account</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 text-slate-400 dark:border-slate-600">
              2
            </span>
            <span className="text-slate-900 dark:text-white">Create your first wishlist</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 text-slate-400 dark:border-slate-600">
              3
            </span>
            <span className="text-slate-900 dark:text-white">Add items to your list</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 text-slate-400 dark:border-slate-600">
              4
            </span>
            <span className="text-slate-900 dark:text-white">Share with friends and family</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
