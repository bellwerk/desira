import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function supabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  );
}

function supabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ""
  );
}

// Routes that require authentication
const PROTECTED_ROUTES = ["/app"];

function getSafeLoginNext(pathname: string, search: string): string {
  if (pathname.startsWith("/app/invite/")) {
    return "/app";
  }

  return `${pathname}${search}`;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const requestPath = `${pathname}${search}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", requestPath);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const url = supabaseUrl();
  const key = supabaseAnonKey();

  // Skip Supabase auth if env vars are missing (let the page handle the error gracefully)
  if (!url || !key) {
    console.error("[middleware] Missing Supabase env vars - NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return response;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh auth cookies for SSR (safe even if not logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if accessing a protected route without auth
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", getSafeLoginNext(pathname, search));
    response = NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login page
  if (pathname === "/login" && user) {
    response = NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}
