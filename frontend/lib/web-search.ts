/**
 * Cliente do Google Custom Search Engine (CSE).
 *
 * Usado pelo agente Info como FUNCTION TOOL (não provider-defined) — assim
 * o Gemini Pro consegue combinar com nossas outras tools (save_product etc),
 * o que não funcionava com google.tools.googleSearch().
 *
 * Setup:
 *   1. https://console.cloud.google.com → API & Services → Library
 *   2. Habilita "Custom Search API"
 *   3. Cria uma API key em Credentials
 *   4. Vai em https://programmablesearchengine.google.com/
 *   5. "Add" → Cria um engine que pesquisa "the entire web"
 *   6. Copia o "Search engine ID"
 *   7. Adiciona no Vercel:
 *        GOOGLE_CSE_API_KEY=...
 *        GOOGLE_CSE_ID=...
 *
 * Tier gratuito: 100 queries/dia. Acima disso: $5 por 1000 queries.
 */

export type WebSearchHit = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
};

export type WebSearchResult =
  | { ok: true; query: string; hits: WebSearchHit[] }
  | { ok: false; reason: string };

type CSEResponse = {
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    displayLink?: string;
  }>;
  error?: { message?: string; code?: number };
};

export async function webSearch(
  query: string,
  opts?: { count?: number; locale?: string },
): Promise<WebSearchResult> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) {
    return { ok: false, reason: "GOOGLE_CSE_API_KEY ou GOOGLE_CSE_ID não configurados" };
  }
  const q = query.trim();
  if (!q) return { ok: false, reason: "query vazia" };

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q,
    num: String(Math.min(Math.max(opts?.count ?? 5, 1), 10)),
    hl: opts?.locale ?? "pt-BR",
    gl: "br", // resultados priorizando Brasil
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as CSEResponse;
    if (!res.ok || json.error) {
      return {
        ok: false,
        reason: json.error?.message ?? `HTTP ${res.status}`,
      };
    }
    const hits: WebSearchHit[] = (json.items ?? []).map((it) => ({
      title: (it.title ?? "").trim(),
      url: it.link ?? "",
      snippet: (it.snippet ?? "").replace(/\s+/g, " ").trim(),
      source: it.displayLink,
    }));
    return { ok: true, query: q, hits };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "falha desconhecida",
    };
  }
}
