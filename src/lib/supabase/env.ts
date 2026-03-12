const SUPABASE_URL_ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const SUPABASE_ANON_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
] as const;
const SUPABASE_SERVICE_ROLE_ENV_KEY = "SUPABASE_SERVICE_ROLE_KEY" as const;

function firstNonEmptyEnv(keys: readonly string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseUrl(): string {
  const url = firstNonEmptyEnv(SUPABASE_URL_ENV_KEYS);
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (preferred) or SUPABASE_URL."
    );
  }

  if (!isValidHttpUrl(url)) {
    throw new Error(
      "Invalid Supabase URL. NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL must be an absolute HTTP(S) URL."
    );
  }

  return url;
}

export function getSupabaseAnonKey(): string {
  const anonKey = firstNonEmptyEnv(SUPABASE_ANON_ENV_KEYS);
  if (!anonKey) {
    throw new Error(
      "Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return anonKey;
}

export function getSupabaseServiceRoleKey(): string {
  const serviceRoleKey = firstNonEmptyEnv([SUPABASE_SERVICE_ROLE_ENV_KEY]);
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  }
  return serviceRoleKey;
}

export function hasSupabasePublicCredentials(): boolean {
  try {
    return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
  } catch {
    return false;
  }
}

export function hasSupabaseAdminCredentials(): boolean {
  try {
    return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
  } catch {
    return false;
  }
}
