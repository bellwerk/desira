import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseAdminCredentials as hasAdminCredentials,
} from "@/lib/supabase/env";

let _supabaseAdmin: SupabaseClient | null = null;

export function hasSupabaseAdminCredentials(): boolean {
  return hasAdminCredentials();
}

/**
 * Returns the Supabase admin client (service role).
 * Lazily initialized to avoid build-time errors when env vars aren't available.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  _supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _supabaseAdmin;
}

export function tryGetSupabaseAdmin(): SupabaseClient | null {
  if (!hasSupabaseAdminCredentials()) {
    return null;
  }

  return getSupabaseAdmin();
}

/**
 * @deprecated Use getSupabaseAdmin() instead. This export exists for backward compatibility.
 */
export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin().from.bind(getSupabaseAdmin());
  },
  get rpc() {
    return getSupabaseAdmin().rpc.bind(getSupabaseAdmin());
  },
  get auth() {
    return getSupabaseAdmin().auth;
  },
  get storage() {
    return getSupabaseAdmin().storage;
  },
};
