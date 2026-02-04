import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.error("Auth callback: Supabase not configured");
    return NextResponse.redirect(`${origin}/login?error=config_error`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error.message, error);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
      }

      // Ensure profile exists (fallback if trigger didn't create one)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          // Check if profile exists
          const { data: existingProfile, error: checkErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          // If no profile exists, create it
          if (!existingProfile && !checkErr) {
            const { error: insertErr } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                display_name:
                  user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
              });

            // 23505 is duplicate key error - profile already exists, which is fine
            if (insertErr && insertErr.code !== "23505") {
              console.error("Failed to create profile in auth callback:", insertErr);
            }
          }
        } catch (err) {
          console.error("Error ensuring profile exists:", err);
          // Don't block auth flow for profile creation failure
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("Auth callback exception:", err);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
