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
 *   - Métricas:    div.css-u4muf9 × 4    (views, likes, sales [vendas, ícone laranja .css-1oa66e7], GMV nessa ordem)
 *
 * Se algum desses mudar, ajustar aqui — o resto do sistema continua igual.
 */

const FEED_URL = "https://app.vyral.com.br/";
const CARD_SELECTOR = 'div[id^="card-"]';
const SEARCH_INPUT_SELECTOR = 'input[placeholder*="Buscar vídeo"]';
const SEARCH_SUBMIT_SELECTOR = 'form.css-1asj9th button[type="submit"]';

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
    case "sales":
    case "revenue":
    default:
      // Vyral só expõe Faturamento como proxy de vendas. Pra "sales" puxamos
      // por faturamento e reordenamos client-side por vendas no final.
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

  // Ordem dos 4 blocos css-u4muf9 no card do Vyral:
  //   1) Visualizações (olho)
  //   2) Curtidas (coração)
  //   3) Vendas — quantidade de produtos vendidos (ícone laranja .css-1oa66e7)
  //   4) GMV — receita estimada em R$ (cifrão)
  // Antes mapeávamos o 3º como `shares`, mas é vendas. Renomeei pra `sales`.
  const [viewsRaw = "", likesRaw = "", salesRaw = "", gmvRaw = ""] = raw.metrics;
  const views = parseMetric(viewsRaw) ?? 0;
  const likes = parseMetric(likesRaw) ?? 0;
  const sales = parseMetric(salesRaw);
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
      sales: sales ?? undefined,
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

/**
 * Captura a transcrição de um vídeo específico clicando no botão "Transcrição"
 * do card. Vyral abre um modal com o texto traduzido completo + caption como
 * título. Aplica busca pelo videoId pra achar o card certo.
 */
export async function scrapeTranscription(
  page: Page,
  videoId: string,
  searchQuery?: string,
): Promise<{ videoId: string; caption: string | null; transcription: string } | null> {
  // Navega pro feed
  await page.goto(FEED_URL, { waitUntil: "networkidle", timeout: 35_000 });

  // Se sabemos a palavra-chave (nome do produto), aplica busca pra carregar
  // o feed certo (vídeo pode não estar no top default).
  if (searchQuery && searchQuery.trim()) {
    try {
      const input = page.locator(SEARCH_INPUT_SELECTOR).first();
      await input.waitFor({ timeout: 8_000 });
      await input.fill(searchQuery.trim());
      const submit = page.locator(SEARCH_SUBMIT_SELECTOR).first();
      if ((await submit.count()) > 0) {
        await submit.click();
      } else {
        await input.press("Enter");
      }
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      log.info(
        { videoId, searchQuery },
        "scrape-transcription: busca aplicada pra localizar o vídeo",
      );
    } catch (err) {
      log.warn(
        { err: err instanceof Error ? err.message : err, searchQuery },
        "scrape-transcription: falhou aplicar busca prévia",
      );
    }
  }

  // Aguarda os cards renderizarem
  try {
    await page.locator(CARD_SELECTOR).first().waitFor({ timeout: 20_000 });
  } catch {
    log.warn("scrape-transcription: nenhum card visível");
    return null;
  }

  // Acha o índice (1-based) do card que tem o thumbnail com esse videoId.
  const findCardIndex = () =>
    page.$$eval(
      CARD_SELECTOR,
      (cards, vid) => {
        const slice = cards as HTMLElement[];
        for (let i = 0; i < slice.length; i++) {
          const img = slice[i].querySelector("img.chakra-image.css-1phd9a0") as HTMLImageElement | null;
          const src = img?.getAttribute("src") ?? "";
          const decoded = decodeURIComponent(src);
          if (decoded.includes(`tiktok-video/${vid}`)) {
            const idMatch = slice[i].id.match(/card-(\d+)/);
            if (idMatch) return parseInt(idMatch[1], 10);
          }
        }
        return -1;
      },
      videoId,
    );

  let cardIndex = await findCardIndex();

  // Se não achou e tem keyword, tenta busca com fragmento do videoId (TikTok
  // ID inteiro funciona no campo de busca em alguns casos).
  if (cardIndex < 0 && !searchQuery) {
    try {
      const input = page.locator(SEARCH_INPUT_SELECTOR).first();
      await input.fill(videoId);
      const submit = page.locator(SEARCH_SUBMIT_SELECTOR).first();
      if ((await submit.count()) > 0) await submit.click();
      else await input.press("Enter");
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
      cardIndex = await findCardIndex();
    } catch {
      /* ignore */
    }
  }

  if (cardIndex < 0) {
    log.warn({ videoId, searchQuery }, "scrape-transcription: card não encontrado");
    return null;
  }

  log.info({ videoId, cardIndex }, "scrape-transcription: card encontrado, abrindo modal");

  // Clica no botão transcricao-card-N
  await page.locator(`#transcricao-card-${cardIndex}`).click({ timeout: 8_000 });

  // Aguarda o dialog abrir
  const dialog = page.locator('[role="dialog"][data-state="open"]');
  try {
    await dialog.waitFor({ timeout: 15_000 });
  } catch {
    log.warn("scrape-transcription: modal não abriu");
    return null;
  }

  // Vyral analisa a transcrição on-demand — às vezes o body começa vazio e
  // a chakra-code aparece depois. Damos um tempo extra pra processar.
  let transcription = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    transcription = (
      await dialog
        .locator(".chakra-code")
        .first()
        .innerText()
        .catch(() => "")
    ).trim();
    if (transcription.length > 30) break;
    await page.waitForTimeout(2_000);
  }

  const caption = (
    await dialog
      .locator(".chakra-dialog__title")
      .first()
      .innerText()
      .catch(() => "")
  ).trim();

  // Fecha o modal pra deixar a página pronta pra próxima ação
  await dialog
    .locator('[aria-label="Close"]')
    .first()
    .click({ timeout: 5_000 })
    .catch(() => {});

  if (!transcription) {
    log.warn({ videoId }, "scrape-transcription: modal abriu mas não tinha código");
    return { videoId, caption: caption || null, transcription: "" };
  }

  log.info(
    { videoId, len: transcription.length },
    "scrape-transcription: transcrição extraída",
  );
  return { videoId, caption: caption || null, transcription };
}

export async function scrapeFeed(
  page: Page,
  params: VyralSearchInput,
): Promise<VyralSearchResult> {
  log.info({ params, feedUrl: FEED_URL }, "scrape-feed: navegando pro painel");
  await page.goto(FEED_URL, { waitUntil: "networkidle", timeout: 35_000 });
  log.info({ landedAt: page.url() }, "scrape-feed: navegação completa");

  // A SPA do Vyral redireciona client-side. Aguarda 2s extra pra qualquer
  // navegação pendente terminar.
  await page.waitForTimeout(2_000);

  // Se foi redirecionado pra login, tenta novo login automático aqui mesmo.
  if (/login|signin|entrar|auth/i.test(page.url())) {
    log.warn({ url: page.url() }, "scrape-feed: redirecionou pra login — fazendo login inline");
    try {
      // Preenche o form de login
      const emailInput = page
        .locator(
          'input[type="email"], input[name="email"], input[id="email"], input[placeholder*="mail" i]',
        )
        .first();
      await emailInput.waitFor({ timeout: 10_000 });
      const email = process.env.VYRAL_EMAIL;
      const password = process.env.VYRAL_PASSWORD;
      if (!email || !password) {
        throw new Error("VYRAL_EMAIL/VYRAL_PASSWORD não configurados");
      }
      await emailInput.fill(email);
      const passwordInput = page
        .locator('input[type="password"], input[name="password"], input[id="password"]')
        .first();
      await passwordInput.fill(password);
      const submit = page
        .locator(
          'button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")',
        )
        .first();
      if ((await submit.count()) > 0) {
        await submit.click();
      } else {
        await passwordInput.press("Enter");
      }
      await page.waitForURL((u) => !/login|signin|entrar/i.test(u.toString()), {
        timeout: 30_000,
      });
      const after = page.url();
      log.info({ landedAt: after }, "scrape-feed: re-login passou de /login");
      // Vyral exige 2FA por email — re-login inline NÃO consegue resolver
      if (/confirm-session|otp|verify|2fa/i.test(after)) {
        throw new Error(
          `vyral.scrape: Vyral pediu 2FA (URL: ${after}). ` +
            "Rode 'docker compose exec -it scraper node /app/scripts/login.mjs' " +
            "pra recompletar o login e regravar a session.",
        );
      }
      // Vai pra rota do feed mesmo
      if (!page.url().startsWith(FEED_URL)) {
        await page.goto(FEED_URL, { waitUntil: "networkidle", timeout: 30_000 });
      }
    } catch (err) {
      await dumpDebugSnapshot(page, "inline-relogin-failed");
      throw new Error(
        `vyral.scrape: re-login inline falhou — ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
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

  // Se o caller passou query (palavra-chave), aplica no campo de busca
  // do painel. Vyral re-renderiza a lista com os resultados filtrados.
  const country = params.country ?? "BR";
  if (params.query && params.query.trim()) {
    try {
      const input = page.locator(SEARCH_INPUT_SELECTOR).first();
      await input.waitFor({ timeout: 8_000 });
      await input.fill(params.query.trim());
      const submit = page.locator(SEARCH_SUBMIT_SELECTOR).first();
      if ((await submit.count()) > 0) {
        await submit.click();
      } else {
        await input.press("Enter");
      }
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      log.info({ query: params.query }, "scrape-feed: busca por palavra-chave aplicada");
    } catch (err) {
      log.warn(
        { err: err instanceof Error ? err.message : err, query: params.query },
        "scrape-feed: falhou aplicar busca por palavra-chave",
      );
    }
  }

  // Aplica filtros (best-effort). O Vyral só expõe País/Período/Ordenar —
  // nicho é filtrado pós-extração porque o painel não tem essa opção.
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
  }

  // Ordenação client-side por VENDAS (sales) quando é o sort default (ou
  // explicitamente "sales"). O Vyral não tem opção "Ordenar por vendas" — só
  // por faturamento. Mas vendas é o que importa pra criadora de TikTok Shop,
  // então reordenamos depois da extração.
  const sortBy = params.sortBy ?? "sales";
  if (sortBy === "sales") {
    videos.sort((a, b) => (b.metrics.sales ?? 0) - (a.metrics.sales ?? 0));
  }

  // Re-numera ranks pra refletir a ordem final.
  videos = videos.slice(0, limit).map((v, i) => ({ ...v, rank: i + 1 }));

  return {
    query: params,
    fetchedAt: new Date().toISOString(),
    cached: false,
    total: videos.length,
    videos,
  };
}
