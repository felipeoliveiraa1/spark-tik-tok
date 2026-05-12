import { NextResponse } from "next/server";
import { searchVyralVideos, ScraperClientError } from "@/lib/scraper-client";
import type { VyralSearchInput } from "@scraper/types";

/**
 * POST /api/vyral/search
 *
 * Body: VyralSearchInput
 *
 * This is the Next.js → scraper proxy. Adds:
 *   - Per-user rate limiting / quota check (TODO once Supabase auth is wired)
 *   - Cache lookup (TODO once viral_cache table exists)
 *   - Failure fallback (returns empty array w/ a flag instead of 500ing)
 *
 * For now it just forwards to the scraper worker.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let input: VyralSearchInput;
  try {
    input = (await request.json()) as VyralSearchInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await searchVyralVideos(input);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = err instanceof ScraperClientError && err.status ? err.status : 502;
    return NextResponse.json({ error: "scraper_unavailable", message }, { status });
  }
}
