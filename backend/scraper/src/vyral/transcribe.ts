import type { VyralTranscription } from "../types.js";
import { log } from "../logger.js";
import { mockGetTranscription } from "./mocks.js";
import { isMockMode } from "../config.js";
import { withSession } from "./session.js";
import { scrapeTranscription } from "./scrape-feed.js";
import {
  findTranscriptionInDb,
  findVideoSummaryById,
  upsertTranscription,
} from "../persistence/viral.js";

/**
 * Pipeline de transcrição — banco-first, retry, zero erro propagado.
 *
 * 1. Mock (dev sem creds).
 * 2. `viral_transcriptions` no banco (mesmo de horas atrás, retorna).
 * 3. Scrape via Playwright (clica no botão Transcrição do card).
 * 4. Persiste no banco e retorna.
 * 5. Se scrape falha, retorna VyralTranscription com `full: ""` —
 *    o chat route decide a mensagem neutra final.
 *
 * Substitui o approach antigo via api.ts (HTTP API quebrada do Vyral).
 */

function buildTranscriptionFromText(
  videoId: string,
  text: string,
  caption?: string,
): VyralTranscription {
  const trimmed = text.trim();
  const firstSentenceEnd = trimmed.search(/[.!?]\s/);
  const hookText =
    firstSentenceEnd > 0
      ? trimmed.slice(0, firstSentenceEnd + 1)
      : trimmed.slice(0, 120);

  return {
    videoId,
    full: trimmed,
    language: "pt-BR",
    structure: {
      hook: { startSec: 0, endSec: 0, text: hookText },
    },
    insightsStatus: "heuristic",
    contexto: caption,
  };
}

function emptyTranscription(videoId: string, caption?: string): VyralTranscription {
  return {
    videoId,
    full: "",
    language: "pt-BR",
    structure: {
      hook: { startSec: 0, endSec: 0, text: "" },
    },
    insightsStatus: "heuristic",
    contexto: caption,
  };
}

export async function getTranscription(
  _ctx: unknown,
  params: { videoId: string; searchQuery?: string },
): Promise<VyralTranscription> {
  if (isMockMode) {
    log.debug({ params }, "vyral.transcribe: mock mode");
    return mockGetTranscription(params.videoId);
  }

  // 1) Banco-first: se já temos a transcrição salva, retorna direto.
  // Não importa há quanto tempo foi raspada — transcrição não muda.
  try {
    const fromDb = await findTranscriptionInDb(params.videoId);
    if (fromDb && fromDb.full && fromDb.full.trim().length > 0) {
      log.info(
        { videoId: params.videoId, len: fromDb.full.length },
        "vyral.transcribe: HIT no banco — skip scrape",
      );
      return fromDb;
    }
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : err },
      "vyral.transcribe: findTranscriptionInDb falhou",
    );
  }

  // 2) Carrega caption do banco como fallback context (mesmo se o scrape der ruim).
  let captionFromDb: string | undefined;
  try {
    const summary = await findVideoSummaryById(params.videoId);
    captionFromDb = summary?.caption ?? summary?.hookPreview ?? undefined;
  } catch {
    /* best-effort */
  }

  // 3) Scrape com retry inline (3 tentativas: imediato, 4s, 10s).
  // O scraper-client já tem retry no nível de job — aqui só protegemos
  // contra falhas transitórias dentro de um único job.
  const backoffs = [0, 4_000, 10_000];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    if (backoffs[attempt] > 0) {
      await new Promise((r) => setTimeout(r, backoffs[attempt]));
    }
    try {
      const scraped = await withSession(async (ctx) => {
        if (!ctx.page) throw new Error("vyral.transcribe: no page in session");
        return scrapeTranscription(ctx.page, params.videoId, params.searchQuery);
      });

      if (!scraped || !scraped.transcription || scraped.transcription.trim().length === 0) {
        lastErr = new Error("modal abriu mas sem texto");
        log.warn(
          { videoId: params.videoId, attempt },
          "vyral.transcribe: scrape vazio, vai retentar",
        );
        continue;
      }

      const result = buildTranscriptionFromText(
        params.videoId,
        scraped.transcription,
        scraped.caption ?? captionFromDb,
      );

      // Persiste no banco pra próxima requisição vir instantânea.
      void upsertTranscription(result).catch((err) =>
        log.warn(
          { err: err instanceof Error ? err.message : err, videoId: params.videoId },
          "vyral.transcribe: upsert falhou",
        ),
      );

      log.info(
        { videoId: params.videoId, len: result.full.length, attempt },
        "vyral.transcribe: scrape OK",
      );
      return result;
    } catch (err) {
      lastErr = err;
      log.warn(
        { err: err instanceof Error ? err.message : err, attempt },
        "vyral.transcribe: scrape falhou nessa tentativa",
      );
    }
  }

  // 4) Todos os retries falharam. Em vez de propagar erro pro caller,
  // retorna estrutura vazia com caption (se tiver). O chat route monta
  // a mensagem neutra "tô analisando esse vídeo" e nunca diz "erro".
  log.error(
    { err: lastErr instanceof Error ? lastErr.message : lastErr, videoId: params.videoId },
    "vyral.transcribe: todos os retries falharam — degradando pra empty",
  );
  return emptyTranscription(params.videoId, captionFromDb);
}
