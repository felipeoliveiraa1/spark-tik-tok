import { type Page, type Locator } from "playwright";
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

async function extractCard(
  card: Locator,
  index: number,
  defaultCountry: CountryCode,
): Promise<VyralVideoSummary | null> {
  const thumbSrc = await card
    .locator("img.chakra-image.css-1phd9a0")
    .first()
    .getAttribute("src")
    .catch(() => null);
  const videoId = thumbSrc ? extractTikTokVideoId(thumbSrc) : null;
  if (!videoId) return null;

  const rankText = await card
    .locator(".css-1ay1ium")
    .first()
    .innerText()
    .catch(() => "");
  const rankMatch = rankText.match(/#(\d+)/);
  const rank = rankMatch ? parseInt(rankMatch[1], 10) : index;

  const nicheLabel = (
    await card
      .locator(".css-qexgjp")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();
  const niche = NICHE_FROM_LABEL[nicheLabel.toLowerCase()];

  const productName = (
    await card
      .locator("p.css-1dra5za")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();

  const productImage = await card
    .locator("img.chakra-image.css-r6xwej")
    .first()
    .getAttribute("src")
    .catch(() => null);

  const caption = (
    await card
      .locator("p.css-dkaess")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();

  const creator = (
    await card
      .locator("p.css-1vrbd8y")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();

  const creatorAvatarUrl = await card
    .locator("img.chakra-avatar__image")
    .first()
    .getAttribute("src")
    .catch(() => null);

  // 4 blocos de métricas: views, likes, shares, GMV (R$)
  const metricBlocks = await card.locator(".css-u4muf9").all();
  const metricValues = await Promise.all(
    metricBlocks.map((m) =>
      m
        .locator("p")
        .last()
        .innerText()
        .catch(() => ""),
    ),
  );
  const [viewsRaw = "", likesRaw = "", sharesRaw = "", gmvRaw = ""] = metricValues;

  const views = parseMetric(viewsRaw) ?? 0;
  const likes = parseMetric(likesRaw) ?? 0;
  const shares = parseMetric(sharesRaw);
  const gmv = parseMetric(gmvRaw);

  // Hook = primeira frase ou primeiros 80 chars da caption
  const hookPreview =
    caption
      .split(/[.!?\n]/)
      .find((s) => s.trim().length > 4)
      ?.trim()
      .slice(0, 200) || undefined;

  return {
    id: videoId,
    rank,
    url: `https://www.tiktok.com/@${creator}/video/${videoId}`,
    creator,
    creatorAvatarUrl: creatorAvatarUrl ?? undefined,
    thumbnailUrl: thumbSrc ?? undefined,
    country: defaultCountry,
    niche,
    metrics: {
      views,
      likes,
      comments: 0,
      shares: shares ?? undefined,
      estimatedRevenueBrl: gmv ?? undefined,
    },
    product: productName
      ? {
          name: productName,
          shopUrl: undefined,
          priceBrl: undefined,
        }
      : undefined,
    hookPreview,
    caption: caption || undefined,
  };
}

export async function scrapeFeed(
  page: Page,
  params: VyralSearchInput,
): Promise<VyralSearchResult> {
  log.info({ params }, "scrape-feed: navegando pro painel");
  await page.goto(FEED_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Aguarda os filtros aparecerem
  await page.locator("#filtros").waitFor({ timeout: 15_000 }).catch(() => {});

  // Aplica filtros (best-effort — se falhar, continua com os defaults do site)
  const country = params.country ?? "BR";
  await pickMenuOption(page, "País:", countryLabel(country));
  await pickMenuOption(page, "Período:", periodLabelFromDays(params.lastDays));
  await pickMenuOption(page, "Ordenar por:", sortLabel(params.sortBy));

  // Aguarda os cards renderizarem
  try {
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 20_000 });
  } catch {
    log.warn("scrape-feed: nenhum card apareceu após filtros");
    return {
      query: params,
      fetchedAt: new Date().toISOString(),
      cached: false,
      total: 0,
      videos: [],
    };
  }

  const cards = await page.locator(CARD_SELECTOR).all();
  const limit = Math.min(params.limit ?? 10, cards.length);
  log.info({ cardsFound: cards.length, willExtract: limit }, "scrape-feed: cards visíveis");

  const videos: VyralVideoSummary[] = [];
  for (let i = 0; i < limit; i++) {
    try {
      const v = await extractCard(cards[i], i + 1, country);
      if (v) videos.push(v);
    } catch (err) {
      log.warn(
        { err: err instanceof Error ? err.message : err, index: i },
        "scrape-feed: card falhou",
      );
    }
  }

  return {
    query: params,
    fetchedAt: new Date().toISOString(),
    cached: false,
    total: videos.length,
    videos,
  };
}
