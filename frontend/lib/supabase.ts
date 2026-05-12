import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Two flavors of the Supabase client:
 *
 * - `supabaseAnon`  → browser-safe (publishable key, respects Row-Level Security)
 * - `supabaseAdmin` → server-only (service_role, bypasses RLS — never import
 *                     this from a "use client" component)
 *
 * In dev all three envs come from `frontend/.env.local`. In production, set
 * the same names on the Vercel project.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // We log instead of throwing to keep `next build` working before the envs
  // are configured. Runtime calls will fail loudly with a clear message.
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
}

export const supabaseAnon: SupabaseClient = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY ?? "",
  { auth: { persistSession: false } },
);

let _admin: SupabaseClient | null = null;

/**
 * Lazily build the service-role client — only callable from the server.
 * Throws if `SUPABASE_SERVICE_ROLE_KEY` isn't set so we fail fast on bad envs.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not set — required for privileged DB writes",
    );
  }
  if (!SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  }
  _admin = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
