"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

type OAuthResult = { url?: string; error?: string };

async function signInWithOAuthProvider(
  provider: "google" | "facebook" | "apple",
  redirectTo?: string
): Promise<OAuthResult> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  // Build the callback URL with the intended redirect destination
  const callbackUrl = new URL("/auth/callback", origin);
  if (redirectTo) {
    callbackUrl.searchParams.set("next", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    return { url: data.url };
  }

  return { error: "Failed to get OAuth URL" };
}

export async function signInWithGoogle(redirectTo?: string): Promise<OAuthResult> {
  return signInWithOAuthProvider("google", redirectTo);
}

export async function signInWithFacebook(redirectTo?: string): Promise<OAuthResult> {
  return signInWithOAuthProvider("facebook", redirectTo);
}

export async function signInWithApple(redirectTo?: string): Promise<OAuthResult> {
  return signInWithOAuthProvider("apple", redirectTo);
}

// Email/password login
export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  const safeRedirect = redirectTo?.startsWith("/") ? redirectTo : "/app";
  redirect(safeRedirect);
}

// Email/password signup
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ error?: string; message?: string }> {
  const supabase = await createClient();

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { message: "Check your email for a confirmation link." };
}

export async function signout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
