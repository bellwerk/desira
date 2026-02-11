import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { buildProfileIdentity } from "@/lib/profile";

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

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/app";

  // On Cloudflare Workers, request.url origin can be internal (http://localhost:8787).
  // Always use the configured site URL for redirects.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  const origin = siteUrl.replace(/\/$/, ""); // strip trailing slash

  console.log("[AuthCallback] request.url origin:", requestUrl.origin);
  console.log("[AuthCallback] using origin:", origin);
  console.log("[AuthCallback] code present:", !!code);

  if (!isSupabaseConfigured()) {
    console.error("[AuthCallback] Supabase not configured");
    return NextResponse.redirect(`${origin}/login?error=config_error`);
  }

  if (!code) {
    console.error("[AuthCallback] No code parameter");
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    console.error("[AuthCallback] Missing Supabase URL or key");
    return NextResponse.redirect(`${origin}/login?error=config_error`);
  }

  const cookieStore = await cookies();
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        toSet.forEach((c) => cookiesToSet.push(c));
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Route Handler: ensure cookies are on our redirect response below
        }
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AuthCallback] exchangeCodeForSession error:", error.message, error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[AuthCallback] user:", user?.id ?? "null");

    if (user) {
      const profileIdentity = buildProfileIdentity({
        userId: user.id,
        email: user.email,
        metadataName: user.user_metadata?.name,
      });

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          display_name: profileIdentity.display_name,
          handle: profileIdentity.handle,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }

    const redirectUrl = `${origin}${next}`;
    console.log("[AuthCallback] redirecting to:", redirectUrl);
    console.log("[AuthCallback] cookies to set:", cookiesToSet.length);

    const response = NextResponse.redirect(redirectUrl);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Record<string, unknown>);
    });
    return response;
  } catch (err) {
    console.error("[AuthCallback] exception:", err);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }
}
