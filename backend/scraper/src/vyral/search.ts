import type { VyralSearchInput, VyralSearchResult } from "../types.js";
import { log } from "../logger.js";
import { fetchFeed } from "./feed.js";
import { buildFeedFiltersFrom, mapFeedToSearchResult } from "./mapper.js";
import { mockSearchVideos } from "./mocks.js";
import { isMockMode } from "../config.js";
import { getCachedSearch, putCachedSearch, upsertVideos } from "../persistence/viral.js";

/**
 * Search for trending videos on Vyral.
 *
 * Three-layer behavior:
 *   1. Local cache (`viral_cache` table) — 24h TTL, keyed by canonical query hash
 *   2. Live fetch from Vyral's content-api
 *   3. Persist per-video upsert in `viral_videos` and write-through the cache
 *
 * Falls back to the mock catalog on any live failure so the rest of the app
 * keeps working while we iterate.
 */
export async function searchVideos(
  _ctx: unknown,
  input: VyralSearchInput,
): Promise<VyralSearchResult> {
  if (isMockMode) {
    log.debug({ input }, "vyral.search: mock mode (no credentials)");
    return mockSearchVideos(input);
  }

  try {
    const cached = await getCachedSearch(input);
    if (cached) {
      log.debug({ input }, "vyral.search: cache HIT");
      return cached;
    }
  } catch (err) {
    log.warn({ err: err instanceof Error ? err.message : err }, "vyral.search: cache read failed");
  }

  try {
    const { orderBy, filters } = buildFeedFiltersFrom(input);
    const feed = await fetchFeed({
      page: 1,
      limit: input.limit ?? 24,
      orderBy: orderBy as never,
      orderSort: "desc",
      filters,
      search: input.query,
    });
    const result = mapFeedToSearchResult(input, feed);

    const pairs = feed.data.map((rawItem, i) => ({ summary: result.videos[i], rawItem }));
    void upsertVideos(pairs).catch((err) =>
      log.warn({ err: err instanceof Error ? err.message : err }, "search: upsertVideos failed"),
    );
    void putCachedSearch(input, result).catch((err) =>
      log.warn({ err: err instanceof Error ? err.message : err }, "search: cache write failed"),
    );

    return result;
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, input },
      "vyral.search: live fetch failed — falling back to mock",
    );
    return mockSearchVideos(input);
  }
}
