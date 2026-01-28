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
        // Upsert profile: create if missing, ignore if exists
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            display_name:
              user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
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
