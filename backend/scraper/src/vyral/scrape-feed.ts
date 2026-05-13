import { type Page } from "playwright";
import type {
  CountryCode,
  VyralNiche,
  VyralSearchInput,
  VyralSearchResult,
  VyralVideoSummary,
} from "../types.js";
import { log } from "../logger.js";

/**
 * Scraper baseado em DOM do painel logado app.vyral.com.br.
 *
 * Por que DOM e não API: o Vyral migrou pra Next.js Server Actions (POST /
 * com `next-action: <hash>`), o que torna a API frágil — qualquer redeploy
 * deles muda o hash. O DOM da UI muda menos.
 *
 * Selectors capturados do HTML do feed em 2026-05-13:
 *   - Card:        div[id^="card-"]
 *   - Thumbnail:   img.chakra-image.css-1phd9a0
 *   - Rank label:  div.css-1ay1ium      ("#1", "#2", ...)
 *   - Categoria:   div.css-qexgjp        ("Eletrodomésticos", "Beleza & Cuidados Pessoais", ...)
 *   - Produto:     p.css-1dra5za         (nome do produto)
 *   - Caption:     p.css-dkaess
 *   - Creator:     p.css-1vrbd8y
 *   - Avatar:      img.chakra-avatar__image
 *   - Métricas:    div.css-u4muf9 × 4    (views, likes, shares, GMV nessa ordem)
 *
 * Se algum desses mudar, ajustar aqui — o resto do sistema continua igual.
 */

const FEED_URL = "https://app.vyral.com.br/";
const CARD_SELECTOR = 'div[id^="card-"]';

const NICHE_LABEL: Record<VyralNiche, string[]> = {
  beleza: ["Beleza & Cuidados Pessoais", "Beleza"],
  saude: ["Saúde", "Saúde & Bem-estar"],
  moda: ["Moda", "Vestuário"],
  casa: ["Casa & Decoração", "Casa"],
  eletronicos: ["Eletrodomésticos", "Eletrônicos", "Tecnologia"],
  pet: ["Pet", "Pets"],
  fitness: ["Esportes & Fitness", "Fitness"],
  acessorios: ["Acessórios", "Joias"],
  infantil: ["Infantil", "Bebês"],
  outros: ["Outros"],
};

const NICHE_FROM_LABEL: Record<string, VyralNiche> = (() => {
  const m: Record<string, VyralNiche> = {};
  for (const [key, labels] of Object.entries(NICHE_LABEL)) {
    for (const label of labels) m[label.toLowerCase()] = key as VyralNiche;
  }
  return m;
})();

/** Parse "740K", "1.1M", "R$ 27.268,00", "27.268" → número. */
export function parseMetric(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/R\$|\s/g, "").trim().toUpperCase();
  if (!cleaned) return null;

  let multiplier = 1;
  let numeric = cleaned;
  if (cleaned.endsWith("K")) {
    multiplier = 1_000;
    numeric = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("M")) {
    multiplier = 1_000_000;
    numeric = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("B")) {
    multiplier = 1_000_000_000;
    numeric = cleaned.slice(0, -1);
  }

  // BR usa "." como separador de milhar e "," como decimal.
  // Se tem vírgula, é decimal — remove pontos antes.
  if (numeric.includes(",")) {
    numeric = numeric.replace(/\./g, "").replace(",", ".");
  } else if (multiplier > 1) {
    // "1.1M" → "1.1"
    // Ponto aqui é decimal mesmo.
  } else {
    // "27.268" → 27268
    numeric = numeric.replace(/\./g, "");
  }

  const n = parseFloat(numeric);
  if (Number.isNaN(n)) return null;
  return Math.round(n * multiplier);
}

/** Extrai o ID numérico do vídeo TikTok do path do thumbnail. */
export function extractTikTokVideoId(thumbnailSrc: string): string | null {
  if (!thumbnailSrc) return null;
  const decoded = decodeURIComponent(thumbnailSrc);
  const match = decoded.match(/tiktok-video[/](\d+)/);
  return match?.[1] ?? null;
}

/** Tenta aplicar um filtro de menu (País, Período, Ordenar). Best-effort. */
async function pickMenuOption(page: Page, menuLabel: string, optionLabel: string): Promise<void> {
  try {
    // Procura o trigger pelo texto do label
    const trigger = page
      .locator('.chakra-menu__trigger', { hasText: menuLabel })
      .first();
    await trigger.waitFor({ timeout: 5_000 });
    await trigger.click();

    // Espera o popup aparecer e clica na opção
    const option = page
      .locator('[role="menuitem"]', { hasText: optionLabel })
      .first();
    await option.waitFor({ timeout: 5_000 });
    await option.click();

    // Espera a lista re-renderizar
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : err, menuLabel, optionLabel },
      "scrape-feed: falhou aplicar filtro (continuando com default)",
    );
  }
}

function periodLabelFromDays(days: number | undefined): string {
  switch (days) {
    case 14:
      return "Últimos 14 dias";
    case 30:
      return "Últimos 30 dias";
    case 90:
      return "Últimos 90 dias";
    case 7:
    default:
      return "Últimos 7 dias";
  }
}

function countryLabel(c: CountryCode | undefined): string {
  return c === "US" ? "Estados Unidos" : "Brasil";
}

function sortLabel(sortBy: VyralSearchInput["sortBy"]): string {
  switch (sortBy) {
    case "views":
      return "Visualizações";
    case "engagement":
      return "Engajamento";
    case "recent":
      return "Mais recentes";
    case "revenue":
    default:
      return "Faturamento";
  }
}

/**
 * Estrutura crua extraída do DOM pelo page.$$eval. Mantém só strings
 * porque o code roda no contexto do navegador (sem TypeScript) e precisa
 * ser serializável.
 */
type RawCard = {
  thumbSrc: string | null;
  rankText: string;
  nicheLabel: string;
  productName: string;
  productImage: string | null;
  caption: string;
  creator: string;
  creatorAvatarUrl: string | null;
  metrics: string[];
};

/**
 * Extrai TODOS os cards de uma vez via JS injetado no navegador (page.$$eval).
 * Isso é ~500× mais rápido que iterar com locator.innerText() em loop
 * porque evita uma round-trip CDP por field.
 */
async function extractAllCards(page: Page, limit: number): Promise<RawCard[]> {
  return page.$$eval(
    'div[id^="card-"]',
    (cards, max) => {
      const slice = (cards as HTMLElement[]).slice(0, max);
      return slice.map((card) => {
        const q = (sel: string) => card.querySelector(sel) as HTMLElement | null;
        const text = (sel: string) => q(sel)?.innerText?.trim() ?? "";
        const attr = (sel: string, name: string) =>
          (q(sel) as HTMLImageElement | null)?.getAttribute(name) ?? null;

        const metricBlocks = Array.from(card.querySelectorAll(".css-u4muf9"));
        const metrics = metricBlocks.map((b) => {
          const ps = (b as HTMLElement).querySelectorAll("p");
          return (ps[ps.length - 1] as HTMLElement | undefined)?.innerText.trim() ?? "";
        });

        return {
          thumbSrc: attr("img.chakra-image.css-1phd9a0", "src"),
          rankText: text(".css-1ay1ium"),
          nicheLabel: text(".css-qexgjp"),
          productName: text("p.css-1dra5za"),
          productImage: attr("img.chakra-image.css-r6xwej", "src"),
          caption: text("p.css-dkaess"),
          creator: text("p.css-1vrbd8y"),
          creatorAvatarUrl: attr("img.chakra-avatar__image", "src"),
          metrics,
        };
      });
    },
    limit,
  );
}

function rawCardToSummary(raw: RawCard, index: number, country: CountryCode): VyralVideoSummary | null {
  const videoId = raw.thumbSrc ? extractTikTokVideoId(raw.thumbSrc) : null;
  if (!videoId) return null;

  const rankMatch = raw.rankText.match(/#(\d+)/);
  const rank = rankMatch ? parseInt(rankMatch[1], 10) : index;

  const niche = NICHE_FROM_LABEL[raw.nicheLabel.toLowerCase()];

  const [viewsRaw = "", likesRaw = "", sharesRaw = "", gmvRaw = ""] = raw.metrics;
  const views = parseMetric(viewsRaw) ?? 0;
  const likes = parseMetric(likesRaw) ?? 0;
  const shares = parseMetric(sharesRaw);
  const gmv = parseMetric(gmvRaw);

  const hookPreview =
    raw.caption
      .split(/[.!?\n]/)
      .find((s) => s.trim().length > 4)
      ?.trim()
      .slice(0, 200) || undefined;

  return {
    id: videoId,
    rank,
    url: `https://www.tiktok.com/@${raw.creator}/video/${videoId}`,
    creator: raw.creator,
    creatorAvatarUrl: raw.creatorAvatarUrl ?? undefined,
    thumbnailUrl: raw.thumbSrc ?? undefined,
    country,
    niche,
    metrics: {
      views,
      likes,
      comments: 0,
      shares: shares ?? undefined,
      estimatedRevenueBrl: gmv ?? undefined,
    },
    product: raw.productName
      ? {
          name: raw.productName,
          shopUrl: undefined,
          priceBrl: undefined,
        }
      : undefined,
    hookPreview,
    caption: raw.caption || undefined,
  };
}

async function dumpDebugSnapshot(page: Page, reason: string): Promise<void> {
  try {
    const url = page.url();
    const title = await page.title().catch(() => "");
    const htmlSnippet = await page.content().then((c) => c.slice(0, 1500)).catch(() => "");
    log.warn(
      { reason, url, title, htmlSnippet: htmlSnippet.replace(/\s+/g, " ").slice(0, 600) },
      "scrape-feed: snapshot",
    );
    // Salva screenshot em /home/spark pra depuração (user spark sempre escreve aí)
    const filename = `/home/spark/scrape-fail-${Date.now()}.png`;
    await page.screenshot({ path: filename, fullPage: false }).catch(() => {});
    log.warn({ filename }, "scrape-feed: screenshot salvo");
  } catch {
    /* best-effort */
  }
}

export async function scrapeFeed(
  page: Page,
  params: VyralSearchInput,
): Promise<VyralSearchResult> {
  log.info({ params, feedUrl: FEED_URL }, "scrape-feed: navegando pro painel");
  await page.goto(FEED_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  log.info({ landedAt: page.url() }, "scrape-feed: navegação completa");

  if (/login|signin|entrar|auth/i.test(page.url())) {
    log.warn({ url: page.url() }, "scrape-feed: caí na página de login — sessão expirou");
    await dumpDebugSnapshot(page, "redirected-to-login");
    throw new Error("vyral.scrape: sessão expirou — re-login necessário");
  }

  try {
    await Promise.race([
      page.locator("#filtros").waitFor({ timeout: 15_000 }),
      page.locator(CARD_SELECTOR).first().waitFor({ timeout: 15_000 }),
    ]);
  } catch {
    log.warn("scrape-feed: nem #filtros nem cards apareceram após 15s");
    await dumpDebugSnapshot(page, "no-filters-no-cards");
  }

  // Aplica filtros (best-effort). O Vyral só expõe País/Período/Ordenar —
  // nicho é filtrado pós-extração porque o painel não tem essa opção.
  const country = params.country ?? "BR";
  await pickMenuOption(page, "País:", countryLabel(country));
  await pickMenuOption(page, "Período:", periodLabelFromDays(params.lastDays));
  await pickMenuOption(page, "Ordenar por:", sortLabel(params.sortBy));

  try {
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 20_000 });
  } catch {
    log.warn("scrape-feed: nenhum card apareceu");
    await dumpDebugSnapshot(page, "no-cards-after-filters");
    return {
      query: params,
      fetchedAt: new Date().toISOString(),
      cached: false,
      total: 0,
      videos: [],
    };
  }

  // Pega o pool de cards visíveis. Se houver filtro de nicho, extraímos
  // mais cards pra ter chance de achar o suficiente da categoria pedida.
  const limit = params.limit ?? 10;
  const poolSize = params.niche ? Math.min(50, limit * 5) : limit;

  log.info({ poolSize, limit, niche: params.niche }, "scrape-feed: extraindo via $$eval");
  const startExtract = Date.now();
  const rawCards = await extractAllCards(page, poolSize);
  log.info(
    { extractedRaw: rawCards.length, ms: Date.now() - startExtract },
    "scrape-feed: extração rápida concluída",
  );

  let videos: VyralVideoSummary[] = rawCards
    .map((raw, i) => rawCardToSummary(raw, i + 1, country))
    .filter((v): v is VyralVideoSummary => v !== null);

  // Filtra por nicho pós-extração se o usuário pediu um específico.
  if (params.niche) {
    const beforeFilter = videos.length;
    videos = videos.filter((v) => v.niche === params.niche);
    log.info(
      { niche: params.niche, before: beforeFilter, after: videos.length },
      "scrape-feed: filtrado por nicho",
    );
    // Re-numera ranks pra refletir a posição dentro do nicho.
    videos = videos.slice(0, limit).map((v, i) => ({ ...v, rank: i + 1 }));
  } else {
    videos = videos.slice(0, limit);
  }

  return {
    query: params,
    fetchedAt: new Date().toISOString(),
    cached: false,
    total: videos.length,
    videos,
  };
}
