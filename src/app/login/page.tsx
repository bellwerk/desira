import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <main className="w-full max-w-[340px] sm:max-w-sm">
        {/* Title */}
        <h1 className="font-[family-name:var(--font-asul)] text-center text-[32px] font-bold tracking-tight text-[#452c37] sm:text-[44px]">
          Your wishes await
        </h1>
        <h2 className="mt-1.5 text-center text-sm font-medium text-[#452c37] sm:mt-2 sm:text-base">
          Sign in to create, manage, and share your wishlists.
        </h2>
        <p className="mb-4 mt-1.5 text-center text-sm text-[#FCF8F7] sm:mb-5 sm:mt-2 sm:text-[16px]">
          Guests don&apos;t need an account to view shared lists.
        </p>

        {/* Liquid Glass Form Card - Apple Style */}
        <div
          className="relative rounded-[20px] p-4 overflow-hidden sm:rounded-[28px] sm:p-6"
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
          {/* Specular highlight - top edge glow */}
          <div
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
          {/* Iridescent edge shimmer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] opacity-30"
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
          {/* Inner glow layer */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px]"
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
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-white/50 sm:mt-8 sm:text-xs">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="#" className="underline hover:text-white/70">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-white/70">
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </main>
    </div>
  );
}
