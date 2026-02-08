import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/app";

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.error("Auth callback: Supabase not configured");
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "config_error");
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error.message, error);
        const loginUrl = new URL("/login", origin);
        loginUrl.searchParams.set("error", "auth_callback_error");
        return NextResponse.redirect(loginUrl);
      }

      // Ensure profile exists (fallback if trigger didn't create one)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Upsert profile: create if missing, ignore if exists.
        // Use admin client (bypasses RLS) for reliability, fall back to user client.
        const profilePayload = {
          id: user.id,
          display_name:
            user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
        };

        try {
          const { error: adminErr } = await supabaseAdmin
            .from("profiles")
            .upsert(profilePayload, { onConflict: "id", ignoreDuplicates: true });

          if (adminErr && adminErr.code !== "23505") {
            console.error("Auth callback: admin profile upsert failed:", adminErr.message);
            // Fall back to user client
            await supabase.from("profiles").upsert(profilePayload, {
              onConflict: "id",
              ignoreDuplicates: true,
            });
          }
        } catch {
          // Fall back to user client if admin client isn't configured
          await supabase.from("profiles").upsert(profilePayload, {
            onConflict: "id",
            ignoreDuplicates: true,
          });
        }
      }

      return NextResponse.redirect(new URL(nextPath, origin));
    } catch (err) {
      console.error("Auth callback exception:", err);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "auth_callback_error");
      return NextResponse.redirect(loginUrl);
    }
  }

  // No code provided
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_callback_error");
  return NextResponse.redirect(loginUrl);
}
