import type { CountryCode, VyralNiche, VyralTopProductsResult } from "../types.js";
import { log } from "../logger.js";
import { fetchFeed } from "./feed.js";
import { aggregateTopProducts, buildFeedFiltersFrom } from "./mapper.js";
import { mockTopProducts } from "./mocks.js";
import { isMockMode } from "../config.js";

/**
 * Vyral doesn't ship a "top products" view directly — we approximate it by
 * pulling the highest-grossing slice of the feed and aggregating by product
 * name. Good enough for the dashboard widget.
 */
export async function listTopProducts(
  _ctx: unknown,
  params: { country: CountryCode; niche?: VyralNiche },
): Promise<VyralTopProductsResult> {
  if (isMockMode) {
    log.debug({ params }, "vyral.top-products: mock mode (no credentials)");
    return mockTopProducts(params.country, params.niche);
  }

  try {
    const { orderBy, filters } = buildFeedFiltersFrom({
      country: params.country,
      niche: params.niche,
      sortBy: "revenue",
      lastDays: 7,
    });
    const feed = await fetchFeed({
      page: 1,
      limit: 50, // pull more rows so aggregation is meaningful
      orderBy: orderBy as never,
      orderSort: "desc",
      filters,
    });
    return aggregateTopProducts(feed, params.country);
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, params },
      "vyral.top-products: live fetch failed — falling back to mock",
    );
    return mockTopProducts(params.country, params.niche);
  }
}
