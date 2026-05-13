import type { VyralTranscription } from "../types.js";
import { log } from "../logger.js";
import { mockGetTranscription } from "./mocks.js";
import { isMockMode, isDev } from "../config.js";
import { withSession } from "./session.js";
import { scrapeTranscription } from "./scrape-feed.js";

/**
 * Captura a transcrição de um vídeo viral clicando no botão "Transcrição"
 * do card no painel logado e extraindo o conteúdo do modal que abre.
 *
 * Substitui o approach antigo via api.ts (HTTP API quebrada do Vyral
 * — eles migraram pra Next.js Server Actions).
 */
export async function getTranscription(
  _ctx: unknown,
  params: { videoId: string; searchQuery?: string },
): Promise<VyralTranscription> {
  if (isMockMode) {
    log.debug({ params }, "vyral.transcribe: mock mode");
    return mockGetTranscription(params.videoId);
  }

  try {
    const scraped = await withSession(async (ctx) => {
      if (!ctx.page) throw new Error("vyral.transcribe: no page in session");
      return scrapeTranscription(ctx.page, params.videoId, params.searchQuery);
    });

    if (!scraped || !scraped.transcription) {
      throw new Error("vyral.transcribe: transcrição vazia ou modal não abriu");
    }

    // Heurística simples pra dividir hook/problema/solução/CTA quando o
    // Vyral só nos dá o texto corrido. Pega:
    //   hook = primeira frase (até primeiro . ou ?)
    //   resto vira full_text
    const text = scraped.transcription.trim();
    const firstSentenceEnd = text.search(/[.!?]\s/);
    const hookText =
      firstSentenceEnd > 0 ? text.slice(0, firstSentenceEnd + 1) : text.slice(0, 120);

    return {
      videoId: params.videoId,
      full: text,
      language: "pt-BR",
      structure: {
        hook: { startSec: 0, endSec: 0, text: hookText },
      },
      insightsStatus: "heuristic",
      contexto: scraped.caption ?? undefined,
    };
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, params },
      "vyral.transcribe: scrape falhou",
    );
    if (isDev) {
      log.warn("vyral.transcribe: falling back to mock in dev");
      return mockGetTranscription(params.videoId);
    }
    throw err instanceof Error
      ? err
      : new Error("vyral transcribe scrape failed (no message)");
  }
}
