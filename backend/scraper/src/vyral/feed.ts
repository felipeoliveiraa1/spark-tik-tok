import { vyralFetch } from "./api.js";

/**
 * Vyral's FEED_CONTEUDO content layer. Reverse-engineered from a HAR capture
 * of the production app. The catalog is generic ("contents") with 4 custom
 * fields per content. For trending videos, the meaning is:
 *
 *   - customField1       → country: "br" | "us"
 *   - customField2       → time bucket: "last_7_days" | "last_28_days" | ...
 *                           (Array on items, single value on filters)
 *   - customField3       → ingestion status: "pending_transcription" | "available"
 *   - customField4       → transcription status: "available" | ...
 *   - customNumberField1 → views (most reliable, scales to millions)
 *   - customNumberField2 → likely comments
 *   - customNumberField3 → Vyral's internal trending score (default sort desc)
 *   - customNumberField4 → likely saves
 *
 * Item metadata (metaData) holds the meat: transcription, product name/price,
 * units sold, author handle/cover/name, etc.
 */

export type VyralFeedFilter =
  | { key: string; equals: string | number | boolean }
  | { key: string; or: Array<string | number | boolean> };

export type VyralFeedQuery = {
  page?: number;
  limit?: number;
  /** Default in the Vyral UI: customNumberField3 desc */
  orderBy?: "customNumberField1" | "customNumberField2" | "customNumberField3" | "customNumberField4" | "createdAt";
  orderSort?: "asc" | "desc";
  filters?: VyralFeedFilter[];
  /** Free-text search (uses the /search variant) */
  search?: string;
};

export type VyralFeedItem = {
  id: string;
  key: "FEED_CONTEUDO";
  title: string;
  cover: string;
  /** TikTok video URL */
  content: string;
  origin: string;
  createdAt: string;
  customField1: string; // country
  customField2: string[]; // time buckets
  customField3?: string;
  customField4?: string;
  customNumberField1: number; // views
  customNumberField2: number;
  customNumberField3: number;
  customNumberField4: number;
  metaData: {
    authorCoverUrl?: string;
    authorName?: string;
    authorUsername?: string;
    price?: string; // monetary value (BRL for BR products, USD for US)
    productCover?: string;
    productTitle?: string;
    product_likes?: string;
    totalUnitsSold?: string;
    transcription?: string;
    [key: string]: unknown;
  };
  interactions?: unknown[];
};

export type VyralFeedResponse = {
  data: VyralFeedItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
};

/**
 * Default filters Vyral's UI applies — only show items with a fetchable cover
 * and (optionally) an available transcription.
 */
const DEFAULT_AVAILABILITY_FILTERS: VyralFeedFilter[] = [
  { key: "customField3", or: ["pending_transcription", "available"] },
  { key: "customField4", equals: "available" },
];

function buildFilters(query: VyralFeedQuery): string[] {
  const filters: VyralFeedFilter[] = [...DEFAULT_AVAILABILITY_FILTERS, ...(query.filters ?? [])];
  return filters.map((f) => JSON.stringify(f));
}

/**
 * GET /dashboard/contents/by-key/FEED_CONTEUDO (or .../search when `search` set).
 *
 * Vyral repeats `filters=<json>` for each filter — we serialize accordingly.
 */
export async function fetchFeed(query: VyralFeedQuery): Promise<VyralFeedResponse> {
  const isSearch = !!query.search?.trim();
  const path = `/dashboard/contents/by-key/FEED_CONTEUDO${isSearch ? "/search" : ""}`;

  const searchParams: Record<string, string | number | boolean | undefined> = {
    page: query.page ?? 1,
    limit: query.limit ?? 24,
    orderBy: query.orderBy ?? "customNumberField3",
    orderSort: query.orderSort ?? "desc",
    ...(isSearch ? { search: query.search } : {}),
  };

  return vyralFetch<VyralFeedResponse>({
    host: "content",
    method: "GET",
    path,
    searchParams,
    searchParamsMulti: { filters: buildFilters(query) },
  });
}
