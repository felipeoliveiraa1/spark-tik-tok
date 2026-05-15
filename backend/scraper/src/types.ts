/**
 * Shared types between the Vyral scraping worker and the Next.js app.
 *
 * Keep this file dependency-free (only TS types) so it can be imported from
 * either side via tsconfig path mappings.
 */

export type CountryCode = "BR" | "US";

export type VyralNiche =
  | "beleza"
  | "saude"
  | "moda"
  | "casa"
  | "eletronicos"
  | "pet"
  | "fitness"
  | "acessorios"
  | "infantil"
  | "outros";

export type VyralVideoSummary = {
  id: string;
  /** Full TikTok video URL when available */
  url: string;
  /** Author/creator handle, ex: @fitmari */
  creator: string;
  /** Optional thumbnail URL from Vyral CDN */
  thumbnailUrl?: string;
  /** Date the video was posted on TikTok */
  postedAt?: string;
  country: CountryCode;
  niche?: VyralNiche;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    /**
     * Quantidade de produtos vendidos (3º bloco do card do Vyral, ícone laranja
     * `.css-1oa66e7`). É a métrica de ranqueamento principal pra TikTok Shop.
     */
    sales?: number;
    /** @deprecated mantido pra compat com payloads antigos no banco. Use `sales`. */
    shares?: number;
    /** Estimated revenue in BRL */
    estimatedRevenueBrl?: number;
  };
  /** Product the video is selling (best guess from Vyral) */
  product?: {
    name: string;
    /** TikTok Shop URL when available */
    shopUrl?: string;
    priceBrl?: number;
  };
  /** Short hook quote shown in card view */
  hookPreview?: string;
  /** Full caption / description of the post (with hashtags). */
  caption?: string;
  /** Rank/position when this video is from a top-N list. */
  rank?: number;
  /** Creator display name (different from @handle when available). */
  creatorName?: string;
  /** Creator avatar URL. */
  creatorAvatarUrl?: string;
};

export type VyralTranscription = {
  videoId: string;
  full: string;
  language: "pt-BR" | "en-US";
  /** Pre-extracted by Vyral's AI when available, otherwise our heuristic split. */
  structure: {
    hook: { startSec: number; endSec: number; text: string };
    problem?: { startSec: number; endSec: number; text: string };
    solution?: { startSec: number; endSec: number; text: string };
    cta?: { startSec: number; endSec: number; text: string };
  };
  /**
   * Where the structure came from:
   *   - "vyral"    → Vyral's AI returned a finished analysis
   *   - "heuristic" → our sentence-split fallback (Vyral hasn't processed yet)
   *   - "mock"     → development mock catalog
   */
  insightsStatus: "vyral" | "heuristic" | "mock";
  /** Vyral's AI also returns a generic context summary and a reusable template */
  contexto?: string;
  template?: string;
  /** Bullet insights from Vyral's analysis */
  insights?: string[];
};

export type VyralSearchInput = {
  /** Free-text query (product name, keyword, niche, etc.) */
  query?: string;
  country?: CountryCode;
  niche?: VyralNiche;
  /** Minimum views threshold */
  minViews?: number;
  /** Sort by which metric. `sales` é o default — produtos mais vendidos. */
  sortBy?: "sales" | "views" | "revenue" | "recent" | "engagement";
  /** Last N days */
  lastDays?: 7 | 14 | 30 | 90;
  /** Max results, capped server-side */
  limit?: number;
};

export type VyralSearchResult = {
  query: VyralSearchInput;
  fetchedAt: string;
  /** True if served from cache */
  cached: boolean;
  total: number;
  videos: VyralVideoSummary[];
};

// =================================================================
// Worker job types
// =================================================================

export type ScraperJobKind =
  | "vyral.search-videos"
  | "vyral.get-transcription"
  | "vyral.top-products";

export type ScraperJobInput =
  | { kind: "vyral.search-videos"; params: VyralSearchInput }
  | { kind: "vyral.get-transcription"; params: { videoId: string; searchQuery?: string } }
  | { kind: "vyral.top-products"; params: { country: CountryCode; niche?: VyralNiche } };

export type ScraperJobResult<T = unknown> = {
  jobId: string;
  status: "queued" | "running" | "done" | "error";
  /** Result payload when status === "done" */
  data?: T;
  /** Error info when status === "error" */
  error?: { message: string; code?: string };
  /** Worker timing */
  startedAt?: string;
  finishedAt?: string;
};

export type VyralTopProduct = {
  rank: number;
  name: string;
  category: string;
  estimatedRevenueBrl: number;
  videoCount: number;
  topVideoId?: string;
};

export type VyralTopProductsResult = {
  country: CountryCode;
  niche?: VyralNiche;
  fetchedAt: string;
  products: VyralTopProduct[];
};
