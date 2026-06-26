/**
 * Decide se uma profile pode acessar /jornadas no momento.
 *
 * Regras:
 * - Admin (role='admin') SEMPRE acessa (mesmo com is_admin_only=true)
 * - Aluna nao-admin: pode acessar se EXISTE pelo menos 1 journey publicada
 *   com is_admin_only=false. (Beta interno: admin libera por jornada.)
 *
 * Esse helper roda no proxy.ts. Cache em memoria pra evitar query em todo
 * request — TTL curto (60s) pra mudancas no admin propagarem.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type CacheEntry = { hasPublicJourney: boolean; checkedAt: number };
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

export async function hasAnyPublicJourney(
  supabase: SupabaseClient,
): Promise<boolean> {
  const now = Date.now();
  if (cache && now - cache.checkedAt < CACHE_TTL_MS) {
    return cache.hasPublicJourney;
  }
  const { count } = await supabase
    .from("journeys")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .eq("is_admin_only", false);
  const hasPublic = (count ?? 0) > 0;
  cache = { hasPublicJourney: hasPublic, checkedAt: now };
  return hasPublic;
}

export function invalidateJourneyAccessCache() {
  cache = null;
}
