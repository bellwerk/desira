import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(): Promise<React.ReactElement> {
  // Check if Supabase is configured before trying to use it
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-100 to-purple-100 px-4">
        <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="text-slate-700">
            Supabase environment variables are not configured.
            <br />
            Please set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  try {
    supabase = await createClient();
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-100 to-purple-100 px-4">
        <div className="rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="text-slate-700">
            Supabase environment variables are not configured.
            <br />
            Please set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  let user: User | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch {
    user = null;
  }

  // Already logged in? Redirect to app
  if (user) {
    redirect("/app");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 -z-10 animate-gradient"
        style={{
          backgroundImage: `
            linear-gradient(135deg, 
              #F58CE2 0%, 
              #F0AB69 20%, 
              #FBDF9D 35%, 
              #F8D3D4 50%,
              #BBD6FF 65%, 
              #E6BCF8 80%, 
              #F58CE2 100%
            )
          `,
        }}
      />
      
      {/* Animated gradient overlay for more depth */}
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(240, 171, 105, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(187, 214, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(245, 140, 226, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 70%, rgba(230, 188, 248, 0.4) 0%, transparent 50%)
          `,
        }}
      />

      <main className="w-full max-w-[340px] sm:max-w-sm" aria-labelledby="login-heading">
        <header className="mb-5 sm:mb-6">
          <h1
            id="login-heading"
            className="font-[family-name:var(--font-asul)] text-center text-[32px] font-bold leading-none tracking-tight text-[#452c37] sm:text-[44px]"
          >
            Your wishes await
          </h1>
          <p className="mt-2 text-center text-sm font-medium leading-snug text-[#452c37]/90 sm:mt-3 sm:text-base">
            Sign in to create, manage, and share your wishlists.
          </p>
          <p className="mt-1 text-center text-[13px] leading-snug text-[#FCF8F7] sm:mt-1.5 sm:text-sm">
            Guests don&apos;t need an account to view shared lists.
          </p>
        </header>

        <section
          aria-label="Sign in form"
          className="relative overflow-hidden rounded-[24px] p-5 sm:rounded-[28px] sm:p-6"
          style={{
            background: `
              linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.38) 0%,
                rgba(255, 255, 255, 0.21) 50%,
                rgba(255, 255, 255, 0.17) 100%
              )
            `,
            backdropFilter: "blur(40px) saturate(200%) brightness(0.90)",
            WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(0.90)",
            boxShadow: `
              0 0 0 0.5px rgba(255, 255, 255, 0.5),
              0 2px 4px rgba(0, 0, 0, 0.03),
              0 8px 16px rgba(0, 0, 0, 0.06),
              0 24px 48px rgba(0, 0, 0, 0.10),
              inset 0 1px 1px rgba(255, 255, 255, 0.7),
              inset 0 -1px 2px rgba(255, 255, 255, 0.15)
            `,
          }}
        >
          {/* Decorative: Specular highlight - top edge glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.9) 20%, 
                rgba(255, 255, 255, 1) 50%, 
                rgba(255, 255, 255, 0.9) 80%, 
                transparent 100%
              )`,
            }}
          />
          {/* Decorative: Iridescent edge shimmer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[24px] opacity-30 sm:rounded-[28px]"
            style={{
              background: `
                linear-gradient(
                  135deg,
                  rgba(255, 182, 193, 0.3) 0%,
                  rgba(173, 216, 230, 0.2) 25%,
                  rgba(221, 160, 221, 0.2) 50%,
                  rgba(255, 218, 185, 0.3) 75%,
                  rgba(176, 224, 230, 0.2) 100%
                )
              `,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
            }}
          />
          {/* Decorative: Inner glow layer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[24px] sm:rounded-[28px]"
            style={{
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.1) 0%, transparent 40%)
              `,
            }}
          />
          <div className="relative z-10">
            <LoginForm />
          </div>
        </section>

        <footer className="mt-6 px-2 text-center sm:mt-8">
          <p className="text-[11px] leading-relaxed text-white/50 sm:text-xs">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-white/70"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-white/70"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </footer>
      </main>
    </div>
  );
}
