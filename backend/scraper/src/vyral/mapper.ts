import type {
  CountryCode,
  VyralNiche,
  VyralSearchInput,
  VyralSearchResult,
  VyralTopProduct,
  VyralTopProductsResult,
  VyralTranscription,
  VyralVideoSummary,
} from "../types.js";
import type { VyralFeedFilter, VyralFeedItem, VyralFeedResponse } from "./feed.js";
import type { VyralInsightResponse } from "./insights.js";

const TIME_BUCKET_BY_LAST_DAYS: Record<number, string> = {
  7: "last_7_days",
  14: "last_14_days",
  28: "last_28_days",
  30: "last_28_days",
  90: "last_90_days",
};

const ORDER_BY_BY_SORT: Record<NonNullable<VyralSearchInput["sortBy"]>, string> = {
  views: "customNumberField1",
  revenue: "customNumberField3", // Vyral's internal score correlates with revenue + virality
  engagement: "customNumberField2",
  recent: "createdAt",
};

const NICHE_TO_VYRAL_NICHE: Record<VyralNiche, string> = {
  beleza: "beleza",
  saude: "saude",
  moda: "moda",
  casa: "casa",
  eletronicos: "eletronicos",
  pet: "pet",
  fitness: "fitness",
  acessorios: "acessorios",
  infantil: "infantil",
  outros: "outros",
};

/**
 * Translate our generic SearchInput into Vyral's filter dialect.
 */
export function buildFeedFiltersFrom(input: VyralSearchInput): {
  orderBy: string;
  filters: VyralFeedFilter[];
} {
  const filters: VyralFeedFilter[] = [];
  if (input.country) {
    filters.push({ key: "customField1", equals: input.country.toLowerCase() });
  }
  const days = input.lastDays;
  if (days && TIME_BUCKET_BY_LAST_DAYS[days]) {
    filters.push({ key: "customField2", equals: TIME_BUCKET_BY_LAST_DAYS[days] });
  }
  if (input.niche) {
    // Vyral may not actually filter by niche in customField slots — keep the
    // call shape ready, but the server will only honor it if it knows the key.
    filters.push({ key: "niche", equals: NICHE_TO_VYRAL_NICHE[input.niche] });
  }
  return {
    orderBy: ORDER_BY_BY_SORT[input.sortBy ?? "revenue"],
    filters,
  };
}

function parseNumberStr(v: string | undefined): number | undefined {
  if (v == null) return undefined;
  const cleaned = String(v).replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function inferCountry(raw: VyralFeedItem): CountryCode {
  const v = (raw.customField1 ?? "").toLowerCase();
  return v === "us" ? "US" : "BR";
}

function inferNiche(raw: VyralFeedItem): VyralNiche | undefined {
  // Vyral doesn't ship an explicit niche on the item — try to guess from title
  // hashtags. Keep it conservative; the agent can refine downstream.
  const title = (raw.title || "").toLowerCase();
  if (/cozinha|kitchen|pote|panela|talher/.test(title)) return "casa";
  if (/skincare|beleza|esmalte|maquiagem|cabelo|babyliss/.test(title)) return "beleza";
  if (/suplemento|colágeno|colageno|whey|nac|saúde|saude/.test(title)) return "saude";
  if (/moda|roupa|vestido|calça/.test(title)) return "moda";
  if (/pet|cachorro|gato/.test(title)) return "pet";
  if (/fitness|academia|treino|emagrec/.test(title)) return "fitness";
  return undefined;
}

function estimateRevenueBrl(raw: VyralFeedItem, country: CountryCode): number | undefined {
  const sold = parseNumberStr(raw.metaData.totalUnitsSold);
  const price = parseNumberStr(raw.metaData.price);
  if (sold == null || price == null) return undefined;
  // For US listings the price string is USD — convert with a coarse default.
  // We can refine this later when we wire a real FX rate source.
  const usdToBrl = 5.5;
  const priceBrl = country === "US" ? price * usdToBrl : price;
  return Math.round(sold * priceBrl);
}

export function mapVyralItem(raw: VyralFeedItem): VyralVideoSummary {
  const country = inferCountry(raw);
  const niche = inferNiche(raw);

  return {
    id: raw.id,
    url: raw.content,
    creator: raw.metaData.authorUsername ? `@${raw.metaData.authorUsername}` : raw.metaData.authorName ?? "@unknown",
    thumbnailUrl: raw.cover,
    postedAt: raw.createdAt?.slice(0, 10),
    country,
    niche,
    metrics: {
      views: raw.customNumberField1 ?? 0,
      likes: parseNumberStr(raw.metaData.product_likes) ?? 0,
      comments: raw.customNumberField2 ?? 0,
      shares: raw.customNumberField4,
      estimatedRevenueBrl: estimateRevenueBrl(raw, country),
    },
    product: raw.metaData.productTitle
      ? {
          name: raw.metaData.productTitle,
          priceBrl:
            country === "US"
              ? (parseNumberStr(raw.metaData.price) ?? 0) * 5.5 || undefined
              : parseNumberStr(raw.metaData.price),
        }
      : undefined,
    hookPreview: (raw.metaData.transcription || raw.title || "").split(/[.!?]/)[0]?.trim().slice(0, 140),
  };
}

export function mapFeedToSearchResult(
  input: VyralSearchInput,
  feed: VyralFeedResponse,
  cached = false,
): VyralSearchResult {
  return {
    query: input,
    fetchedAt: new Date().toISOString(),
    cached,
    total: feed.pagination.totalItems,
    videos: feed.data.map(mapVyralItem),
  };
}

/**
 * Cheap PT-BR / EN heuristic split used when Vyral's AI hasn't generated the
 * structured insight yet. Far from perfect, but it lets the UI render something
 * useful in the meantime, and gives the agent Scripts a starting point.
 */
function heuristicSplit(text: string): { hook: string; problem: string; solution: string; cta: string } {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return { hook: "", problem: "", solution: "", cta: "" };

  const ctaWords =
    /(link|carrinho|carrinho laranja|aproveita|aproveite|garanta|garante|corre|cupom|desconto|amazon|tiktok shop|hoje|antes que|pre[çc]o sub|comprar|tá em promo|esgota|loja)/i;
  const problemWords =
    /(problema|sofria|sofro|cansad|odeio|odiei|chato|dif[ií]cil|n[ãa]o (consigo|conseguia|aguent)|tinha|tava (com|sem)|isso me|me incomodava)/i;
  const solutionWords =
    /(descobri|cheguei|encontrei|comprei|ent[ãa]o eu|agora eu|virei|comecei|j[áa] uso|fa[çc]o|come[çc]ou|por isso|porque|funciona|resolve|bate|ajuda)/i;

  const hook = sentences[0];
  const rest = [...sentences.slice(1)];
  let cta = "";

  for (let i = rest.length - 1; i >= 0; i--) {
    if (ctaWords.test(rest[i])) {
      cta = rest.splice(i).join(" ");
      break;
    }
  }
  if (!cta && rest.length) cta = rest.pop() ?? "";

  let problem = "";
  let solution = "";
  const solutionStart = rest.findIndex((s) => solutionWords.test(s));
  if (solutionStart >= 0) {
    problem = rest.slice(0, solutionStart).join(" ");
    solution = rest.slice(solutionStart).join(" ");
  } else {
    const half = Math.ceil(rest.length / 2);
    problem = rest.slice(0, half).join(" ");
    solution = rest.slice(half).join(" ");
  }
  if (!problem) {
    const idx = rest.findIndex((s) => problemWords.test(s));
    if (idx >= 0) problem = rest[idx];
  }

  return { hook, problem, solution, cta };
}

/**
 * Turn a Vyral feed item + (optional) AI insight into our transcription shape.
 * If `insight` is null (Vyral's pipeline hasn't processed yet), we fall back
 * to a sentence-split heuristic and mark `insightsStatus: "heuristic"`.
 */
export function mapToTranscription(
  raw: VyralFeedItem,
  insight?: VyralInsightResponse | null,
): VyralTranscription {
  const language = raw.customField1?.toLowerCase() === "us" ? "en-US" : "pt-BR";
  const full = raw.metaData.transcription ?? "";
  const total = 22;

  if (insight) {
    return {
      videoId: raw.id,
      full,
      language,
      insightsStatus: "vyral",
      structure: {
        hook: { startSec: 0, endSec: 3, text: insight.insight.gancho },
        problem: { startSec: 3, endSec: 8, text: insight.insight.problema },
        solution: { startSec: 8, endSec: total - 4, text: insight.insight.solucao },
        cta: { startSec: total - 4, endSec: total, text: insight.insight.cta },
      },
      contexto: insight.contexto,
      template: insight.template,
      insights: Object.values(insight.insight),
    };
  }

  const h = heuristicSplit(full);
  return {
    videoId: raw.id,
    full,
    language,
    insightsStatus: "heuristic",
    structure: {
      hook: { startSec: 0, endSec: 3, text: h.hook },
      problem: { startSec: 3, endSec: 8, text: h.problem },
      solution: { startSec: 8, endSec: total - 4, text: h.solution },
      cta: { startSec: total - 4, endSec: total, text: h.cta },
    },
  };
}

/**
 * Vyral doesn't expose a "top products" endpoint per se — we synthesize it
 * by grouping the feed by product name and summing estimated revenue. Good
 * enough for the dashboard tile.
 */
export function aggregateTopProducts(
  feed: VyralFeedResponse,
  country: CountryCode,
): VyralTopProductsResult {
  const byProduct = new Map<string, { revenue: number; count: number; topVideoId?: string; topViews: number; category?: string }>();

  for (const item of feed.data) {
    const name = item.metaData.productTitle?.trim();
    if (!name) continue;
    const summary = mapVyralItem(item);
    const acc = byProduct.get(name) ?? { revenue: 0, count: 0, topViews: 0, category: summary.niche };
    acc.revenue += summary.metrics.estimatedRevenueBrl ?? 0;
    acc.count += 1;
    if (summary.metrics.views > acc.topViews) {
      acc.topViews = summary.metrics.views;
      acc.topVideoId = item.id;
    }
    byProduct.set(name, acc);
  }

  const products: VyralTopProduct[] = [...byProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, agg], i) => ({
      rank: i + 1,
      name,
      category: agg.category ?? "outros",
      estimatedRevenueBrl: agg.revenue,
      videoCount: agg.count,
      topVideoId: agg.topVideoId,
    }));

  return {
    country,
    fetchedAt: new Date().toISOString(),
    products,
  };
}
