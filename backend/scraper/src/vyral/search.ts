import type { VyralSearchInput, VyralSearchResult } from "../types.js";
import { log } from "../logger.js";
import { mockSearchVideos } from "./mocks.js";
import { isMockMode, isDev } from "../config.js";
import { getCachedSearch, putCachedSearch } from "../persistence/viral.js";
import type { VyralSessionCtx } from "./session.js";
import { scrapeFeed } from "./scrape-feed.js";

/**
 * Search for trending videos. Caller is `runJob` (in jobs.ts) which already
 * wraps us in withSession — we receive `ctx.page` ready to navigate.
 *
 * Pipeline:
 *   1. MOCK mode (dev sem creds): retorna mocks.
 *   2. Cache local (`viral_cache` no Postgres) — 24h TTL por query.
 *   3. Live: navega o painel via Playwright e extrai do DOM (scrapeFeed).
 *   4. Persiste o resultado no cache.
 *   5. Em dev, se algo falhar, cai no mock. Em produção, propaga.
 */
export async function searchVideos(
  ctx: VyralSessionCtx,
  input: VyralSearchInput,
): Promise<VyralSearchResult> {
  if (isMockMode) {
    log.info({ input }, "vyral.search: mock mode (no credentials)");
    return mockSearchVideos(input);
  }

  try {
    const cached = await getCachedSearch(input);
    if (cached) {
      log.info(
        { input, videos: cached.videos.length },
        "vyral.search: cache HIT",
      );
      return cached;
    }
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : err },
      "vyral.search: cache read failed",
    );
  }

  if (!ctx.page) {
    throw new Error("vyral.search: no page in session (mock or build failed)");
  }

  try {
    log.info({ input }, "vyral.search: cache miss — going live");
    const result = await scrapeFeed(ctx.page, input);

    // Não cacheia resultados vazios — provavelmente foi falha de sessão
    // ou filtro errado. Se cachear, o próximo pedido bate HIT no zero
    // sem nunca tentar de novo (foi exatamente o bug que vimos).
    if (result.videos.length > 0) {
      void putCachedSearch(input, result).catch((err) =>
        log.warn(
          { err: err instanceof Error ? err.message : err },
          "vyral.search: cache write failed",
        ),
      );
    } else {
      log.info({ input }, "vyral.search: resultado vazio — NÃO cacheando");
    }

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
