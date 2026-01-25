"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
} from "./actions";

export function LoginForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/app";
  const errorParam = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    errorParam === "auth_callback_error" ? "Authentication failed. Please try again." : null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleGoogleSignIn(): void {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await signInWithGoogle(redirectTo);

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  function handleContinue(): void {
    if (email.trim()) {
      setShowPassword(true);
    }
  }

  function handleEmailSubmit(formData: FormData): void {
    setError(null);
    setMessage(null);
    const emailValue = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      if (mode === "login") {
        const result = await signInWithEmail(emailValue, password, redirectTo);
        if (result?.error) {
          setError(result.error);
        }
      } else {
        const result = await signUpWithEmail(emailValue, password);
        if (result.error) {
          setError(result.error);
        } else if (result.message) {
          setMessage(result.message);
        }
      }
    });
  }

  function handleFacebookSignIn(): void {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await signInWithFacebook(redirectTo);

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  function handleAppleSignIn(): void {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await signInWithApple(redirectTo);

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  const glassInputStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const glassButtonStyle = {
    background: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <div className="space-y-5">
      {error && (
        <div
          className="rounded-xl border border-red-300/50 p-3 text-sm text-red-700"
          style={{ background: "rgba(254, 202, 202, 0.7)", backdropFilter: "blur(10px)" }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="rounded-xl border border-emerald-300/50 p-3 text-sm text-emerald-700"
          style={{ background: "rgba(167, 243, 208, 0.7)", backdropFilter: "blur(10px)" }}
        >
          {message}
        </div>
      )}

      {/* Email/Password Form */}
      <form action={handleEmailSubmit} className="space-y-4">
        <div>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email or username"
            className="block w-full rounded-xl border border-white/50 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
            style={glassInputStyle}
          />
        </div>

        {showPassword && (
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              placeholder="Password"
              className="block w-full rounded-xl border border-white/50 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
              style={glassInputStyle}
            />
          </div>
        )}

        {!showPassword ? (
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-[#27323F] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#27323F] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending
              ? "Please wait..."
              : mode === "login"
              ? "Log In"
              : "Sign Up"}
          </button>
        )}
      </form>

      {/* Divider */}
      <div className="relative py-0">
        <div className="relative flex h-4 items-center justify-center leading-4">
          <span className="bg-transparent px-3 text-base font-semibold text-white">or</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          className="flex w-full items-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-white/60 hover:shadow-md disabled:opacity-50"
          style={glassButtonStyle}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="flex-1 text-center text-base font-bold">Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={handleFacebookSignIn}
          disabled={isPending}
          className="flex w-full items-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-white/60 hover:shadow-md disabled:opacity-50"
          style={glassButtonStyle}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="flex-1 text-center text-base font-bold">Continue with Facebook</span>
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={isPending}
          className="flex w-full items-center rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-white/60 hover:shadow-md disabled:opacity-50"
          style={glassButtonStyle}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span className="flex-1 text-center text-base font-bold">Continue with Apple</span>
        </button>
      </div>

      {/* Separator line */}
      <div className="my-4 border-t border-white/20" />

      {/* Sign up link */}
      <div className="flex items-center justify-center gap-5">
        <p className="text-base text-white">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
            setShowPassword(false);
          }}
          className="text-base font-bold text-neutral-100 transition-colors hover:text-rose-500"
        >
          {mode === "login" ? "Sign up for Desira" : "Log in to Desira"}
        </button>
      </div>
    </div>
  );
}
