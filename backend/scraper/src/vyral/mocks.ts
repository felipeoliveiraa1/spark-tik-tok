import type {
  CountryCode,
  VyralNiche,
  VyralSearchInput,
  VyralSearchResult,
  VyralTranscription,
  VyralTopProductsResult,
  VyralVideoSummary,
} from "../types.js";

/**
 * Realistic Brazilian mocks — used by the worker until real Vyral selectors
 * are wired in. Same shape as the production data, so the Next.js side
 * doesn't need to change.
 */

const SAMPLE_VIDEOS: VyralVideoSummary[] = [
  {
    id: "vy-001",
    url: "https://www.tiktok.com/@fitmari/video/7345090909090909090",
    creator: "@fitmari",
    thumbnailUrl: undefined,
    postedAt: "2026-05-02",
    country: "BR",
    niche: "saude",
    metrics: { views: 2_300_000, likes: 187_000, comments: 4_200, shares: 18_400, estimatedRevenueBrl: 45_000 },
    product: { name: "NAC Always Fit", priceBrl: 89, shopUrl: "https://shop.tiktok.com/br/p/123" },
    hookPreview: "isso aqui mudou minha vida em 7 dias",
  },
  {
    id: "vy-002",
    url: "https://www.tiktok.com/@dramaequeen/video/7344000000000000000",
    creator: "@dramaequeen",
    postedAt: "2026-05-04",
    country: "BR",
    niche: "saude",
    metrics: { views: 890_000, likes: 62_300, comments: 1_800, shares: 4_200, estimatedRevenueBrl: 18_000 },
    product: { name: "NAC Always Fit", priceBrl: 89 },
    hookPreview: "minha mãe não acreditou quando contei",
  },
  {
    id: "vy-003",
    url: "https://www.tiktok.com/@laurinhabh/video/7343000000000000000",
    creator: "@laurinhabh",
    postedAt: "2026-05-05",
    country: "BR",
    niche: "beleza",
    metrics: { views: 1_200_000, likes: 89_000, comments: 2_900, shares: 6_700, estimatedRevenueBrl: 22_000 },
    product: { name: "Esmalte gel UV", priceBrl: 99 },
    hookPreview: "gastei R$ 99 e foi a melhor compra do ano",
  },
  {
    id: "vy-004",
    url: "https://www.tiktok.com/@oliviabh/video/7342000000000000000",
    creator: "@oliviabh",
    postedAt: "2026-05-06",
    country: "BR",
    niche: "saude",
    metrics: { views: 2_100_000, likes: 156_000, comments: 3_800, shares: 12_000, estimatedRevenueBrl: 62_000 },
    product: { name: "NAC Always Fit", priceBrl: 89 },
    hookPreview: "minha cunhada toma escondida e eu descobri",
  },
  {
    id: "vy-005",
    url: "https://www.tiktok.com/@beautyhacks/video/7341000000000000000",
    creator: "@beautyhacks",
    postedAt: "2026-05-03",
    country: "US",
    niche: "beleza",
    metrics: { views: 1_800_000, likes: 132_000, comments: 5_100, estimatedRevenueBrl: 78_000 },
    product: { name: "Lash lifting kit", priceBrl: 149 },
    hookPreview: "comprei achando que era furada",
  },
];

const SAMPLE_TRANSCRIPTIONS: Record<string, VyralTranscription> = {
  "vy-001": {
    videoId: "vy-001",
    language: "pt-BR",
    insightsStatus: "mock",
    full:
      "Gente, isso aqui mudou minha vida em 7 dias e eu não tô brincando. Eu tava acordando arrasada, sem energia, com a pele opaca, sem vontade de fazer nada. Aí uma amiga me passou esse frasco aqui e falou pra eu testar 7 dias. No quarto dia eu já tava acordando bem, no sétimo eu fui pra academia 6h da manhã. Tá no link aí em cima, corre que tem pouquinho.",
    structure: {
      hook: { startSec: 0, endSec: 3, text: "isso aqui mudou minha vida em 7 dias e eu não tô brincando" },
      problem: {
        startSec: 3,
        endSec: 9,
        text: "acordando arrasada, sem energia, pele opaca, sem vontade de fazer nada",
      },
      solution: {
        startSec: 9,
        endSec: 19,
        text: "amiga me passou, testei 7 dias, quarto dia acordando bem, sétimo fui pra academia 6h",
      },
      cta: { startSec: 19, endSec: 22, text: "tá no link aí em cima, corre que tem pouquinho" },
    },
    insights: [
      "Gancho de transformação radical em tempo curto (7 dias)",
      "Usa prova social informal (a amiga) em vez de autoridade médica — bom pra compliance",
      "CTA com urgência (corre que tem pouquinho) — escassez fabricada",
    ],
  },
};

function applyFilters(videos: VyralVideoSummary[], input: VyralSearchInput): VyralVideoSummary[] {
  let out = [...videos];
  if (input.country) out = out.filter((v) => v.country === input.country);
  if (input.niche) out = out.filter((v) => v.niche === input.niche);
  if (input.minViews) out = out.filter((v) => v.metrics.views >= (input.minViews ?? 0));
  if (input.query) {
    const q = input.query.toLowerCase();
    out = out.filter(
      (v) =>
        v.product?.name.toLowerCase().includes(q) ||
        v.creator.toLowerCase().includes(q) ||
        v.hookPreview?.toLowerCase().includes(q),
    );
  }
  const sortBy = input.sortBy ?? "views";
  out.sort((a, b) => {
    if (sortBy === "views") return b.metrics.views - a.metrics.views;
    if (sortBy === "revenue") return (b.metrics.estimatedRevenueBrl ?? 0) - (a.metrics.estimatedRevenueBrl ?? 0);
    if (sortBy === "engagement") return b.metrics.likes - a.metrics.likes;
    return (b.postedAt ?? "").localeCompare(a.postedAt ?? "");
  });
  if (input.limit) out = out.slice(0, input.limit);
  return out;
}

export function mockSearchVideos(input: VyralSearchInput): VyralSearchResult {
  const videos = applyFilters(SAMPLE_VIDEOS, input);
  return {
    query: input,
    fetchedAt: new Date().toISOString(),
    cached: false,
    total: videos.length,
    videos,
  };
}

export function mockGetTranscription(videoId: string): VyralTranscription {
  const t = SAMPLE_TRANSCRIPTIONS[videoId];
  if (t) return t;
  return {
    videoId,
    language: "pt-BR",
    insightsStatus: "mock",
    full:
      "Transcrição de exemplo. Aqui viria a fala completa do criador. Os blocos hook/problema/solução/CTA seriam extraídos pela IA da Vyral.",
    structure: {
      hook: { startSec: 0, endSec: 3, text: "hook genérico de exemplo" },
      problem: { startSec: 3, endSec: 8, text: "dor genérica do público" },
      solution: { startSec: 8, endSec: 18, text: "solução apresentada pelo creator" },
      cta: { startSec: 18, endSec: 22, text: "call to action genérico" },
    },
    insights: ["Insight 1 mock", "Insight 2 mock"],
  };
}

export function mockTopProducts(country: CountryCode, _niche?: VyralNiche): VyralTopProductsResult {
  return {
    country,
    fetchedAt: new Date().toISOString(),
    products: [
      { rank: 1, name: "NAC Always Fit", category: "Saúde", estimatedRevenueBrl: 125_000, videoCount: 18, topVideoId: "vy-001" },
      { rank: 2, name: "Esmalte gel UV", category: "Beleza", estimatedRevenueBrl: 89_000, videoCount: 22, topVideoId: "vy-003" },
      { rank: 3, name: "Massageador facial", category: "Beleza", estimatedRevenueBrl: 78_000, videoCount: 14 },
      { rank: 4, name: "Babyliss profissional", category: "Beleza", estimatedRevenueBrl: 64_000, videoCount: 9 },
      { rank: 5, name: "Colágeno verisol", category: "Saúde", estimatedRevenueBrl: 51_000, videoCount: 11 },
    ],
  };
}
