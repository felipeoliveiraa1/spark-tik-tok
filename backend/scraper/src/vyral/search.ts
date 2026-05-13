import type { VyralSearchInput, VyralSearchResult } from "../types.js";
import { log } from "../logger.js";
import { mockSearchVideos } from "./mocks.js";
import { isMockMode, isDev } from "../config.js";
import { getCachedSearch, putCachedSearch } from "../persistence/viral.js";
import { withSession } from "./session.js";
import { scrapeFeed } from "./scrape-feed.js";

/**
 * Search for trending videos.
 *
 * Pipeline:
 *   1. MOCK mode (dev sem creds): retorna mocks.
 *   2. Cache local (`viral_cache` no Postgres) — 24h TTL por query.
 *   3. Live: navega o painel logado com Playwright e extrai do DOM
 *      (via scrapeFeed). Bem mais resiliente que reverse-engineer
 *      da API privada do Vyral.
 *   4. Persiste o resultado no cache pra próxima.
 *   5. Em dev, se algo falhar, cai no mock. Em produção, propaga
 *      o erro pra o agente avisar a aluna em vez de mentir.
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
    log.warn(
      { err: err instanceof Error ? err.message : err },
      "vyral.search: cache read failed",
    );
  }

  try {
    const result = await withSession(async (ctx) => {
      if (!ctx.page) throw new Error("vyral.search: no page in session (mock?)");
      return scrapeFeed(ctx.page, input);
    });

    void putCachedSearch(input, result).catch((err) =>
      log.warn(
        { err: err instanceof Error ? err.message : err },
        "vyral.search: cache write failed",
      ),
    );

    return result;
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, input },
      "vyral.search: live scrape failed",
    );
    if (isDev) {
      log.warn("vyral.search: falling back to mock in dev");
      return mockSearchVideos(input);
    }
    throw err instanceof Error
      ? err
      : new Error("vyral live scrape failed (no message)");
  }
}
