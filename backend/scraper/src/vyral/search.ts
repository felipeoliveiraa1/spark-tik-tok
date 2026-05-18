import type { VyralSearchInput, VyralSearchResult, VyralVideoSummary } from "../types.js";
import { log } from "../logger.js";
import { mockSearchVideos } from "./mocks.js";
import { isMockMode, isDev } from "../config.js";
import {
  findVideosInDb,
  getCachedSearch,
  putCachedSearch,
  upsertVideos,
} from "../persistence/viral.js";
import type { VyralSessionCtx } from "./session.js";
import { scrapeFeed } from "./scrape-feed.js";

/**
 * Search for trending videos. Pipeline (sales-first, banco-first, zero erro visível):
 *   1. MOCK (dev sem creds).
 *   2. `viral_cache` (hash exato da query, 24h TTL) — hit perfeito.
 *   3. `viral_videos` fresh (< 6h, mesmo país/nicho) — DB-first.
 *   4. Live scrape via Playwright + persist em ambos.
 *   5. Se scrape falha: degrada gracefully — retorna `viral_videos` velho
 *      (24h, depois 30d). NUNCA propaga erro pro caller.
 */

const FRESH_HOURS = 6;
const FALLBACK_HOURS = 24;
const FALLBACK_DAYS_DEEP = 30;

function buildResultFromDb(
  input: VyralSearchInput,
  videos: VyralVideoSummary[],
): VyralSearchResult {
  const limit = Math.min(input.limit ?? 10, 50);
  const trimmed = videos.slice(0, limit).map((v, i) => ({ ...v, rank: i + 1 }));
  return {
    query: input,
    fetchedAt: new Date().toISOString(),
    cached: true,
    total: trimmed.length,
    videos: trimmed,
  };
}

export async function searchVideos(
  ctx: VyralSessionCtx,
  input: VyralSearchInput,
): Promise<VyralSearchResult> {
  if (isMockMode) {
    log.info({ input }, "vyral.search: mock mode (no credentials)");
    return mockSearchVideos(input);
  }

  // 1) Cache exato (mesmo hash)
  try {
    const cached = await getCachedSearch(input);
    if (cached) {
      log.info(
        { input, videos: cached.videos.length },
        "vyral.search: cache HIT (viral_cache)",
      );
      return cached;
    }
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : err },
      "vyral.search: cache read failed",
    );
  }

  // 2) DB-first: viral_videos frescos (< 6h).
  // PULAR quando input.query existe — aluna tá pedindo busca textual
  // específica (ex: "fitness", "creatina"). O banco hoje só indexa por
  // country/niche, não por full-text. Se servimos do banco sem aplicar
  // query, retornamos cards genéricos e ela acha que a busca tá quebrada.
  const hasTextQuery = !!(input.query && input.query.trim().length > 0);
  if (!hasTextQuery) {
    const dbFresh = await findVideosInDb({
      country: input.country,
      niche: input.niche,
      freshHours: FRESH_HOURS,
      limit: input.limit ?? 10,
    }).catch((err) => {
      log.warn(
        { err: err instanceof Error ? err.message : err },
        "vyral.search: findVideosInDb (fresh) falhou",
      );
      return [] as VyralVideoSummary[];
    });
    if (dbFresh.length >= Math.min(input.limit ?? 10, 5)) {
      log.info(
        { count: dbFresh.length, country: input.country, niche: input.niche },
        "vyral.search: DB-first HIT (fresh < 6h)",
      );
      return buildResultFromDb(input, dbFresh);
    }
  } else {
    log.info(
      { query: input.query },
      "vyral.search: pulando DB-first (busca textual exige scrape fresco)",
    );
  }

  if (!ctx.page) {
    // Sem página, ainda assim tenta banco velho antes de jogar erro.
    const stale = await findVideosInDb({
      country: input.country,
      niche: input.niche,
      freshHours: FALLBACK_DAYS_DEEP * 24,
      limit: input.limit ?? 10,
    }).catch(() => [] as VyralVideoSummary[]);
    if (stale.length > 0) {
      log.warn(
        { count: stale.length },
        "vyral.search: sem page — retornando dado velho do banco",
      );
      return buildResultFromDb(input, stale);
    }
    throw new Error("vyral.search: no page in session (mock or build failed)");
  }

  // 3) Live scrape
  try {
    log.info({ input }, "vyral.search: cache miss — going live");
    const result = await scrapeFeed(ctx.page, input);

    // Persiste em viral_cache e viral_videos. Não cacheia vazio (bug antigo).
    if (result.videos.length > 0) {
      void putCachedSearch(input, result).catch((err) =>
        log.warn(
          { err: err instanceof Error ? err.message : err },
          "vyral.search: cache write failed",
        ),
      );
      // Upsert pra alimentar o DB-first path da próxima requisição.
      void upsertVideos(result.videos).catch((err) =>
        log.warn(
          { err: err instanceof Error ? err.message : err },
          "vyral.search: upsertVideos falhou",
        ),
      );
    } else {
      log.info({ input }, "vyral.search: resultado vazio — NÃO cacheando");
      // Resultado vazio + scrape OK = pode ser falso negativo (filtro
      // estranho). MAS se há busca textual, NÃO mascarar com cards
      // genéricos do banco — devolve vazio mesmo pra caller decidir.
      if (!hasTextQuery) {
        const fallback = await findVideosInDb({
          country: input.country,
          niche: input.niche,
          freshHours: FALLBACK_HOURS,
          limit: input.limit ?? 10,
        }).catch(() => [] as VyralVideoSummary[]);
        if (fallback.length > 0) {
          log.info({ count: fallback.length }, "vyral.search: scrape vazio — usando banco (24h)");
          return buildResultFromDb(input, fallback);
        }
      }
    }

    return result;
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, input },
      "vyral.search: live scrape failed",
    );

    // 4) Degrade gracefully: nunca propaga erro pro caller.
    // Tenta 24h, depois 30d. Se nem isso, mock em dev, lança em prod.
    // MAS se há busca textual, NÃO degradar pra cards genéricos do
    // banco — melhor retornar vazio que enganar a aluna com cards de
    // outros nichos.
    if (hasTextQuery) {
      log.warn(
        { query: input.query },
        "vyral.search: scrape falhou em busca textual — retornando vazio (sem degradar pra cards genéricos)",
      );
      return {
        query: input,
        fetchedAt: new Date().toISOString(),
        cached: false,
        total: 0,
        videos: [],
      };
    }
    for (const hours of [FALLBACK_HOURS, FALLBACK_DAYS_DEEP * 24]) {
      const fallback = await findVideosInDb({
        country: input.country,
        niche: input.niche,
        freshHours: hours,
        limit: input.limit ?? 10,
      }).catch(() => [] as VyralVideoSummary[]);
      if (fallback.length > 0) {
        log.warn(
          { count: fallback.length, hours, country: input.country, niche: input.niche },
          "vyral.search: scrape FALHOU — servindo do banco (degradado)",
        );
        return buildResultFromDb(input, fallback);
      }
    }

    if (isDev) {
      log.warn("vyral.search: falling back to mock in dev");
      return mockSearchVideos(input);
    }

    // Última cartada: retorna estrutura vazia em vez de explodir.
    // O caller (chat route) também tem fallback DB-side, mas isso garante
    // que o pipeline NUNCA propaga exceção pra cima.
    return {
      query: input,
      fetchedAt: new Date().toISOString(),
      cached: false,
      total: 0,
      videos: [],
    };
  }
}
