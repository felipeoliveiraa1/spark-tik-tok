import { createHash } from "node:crypto";
import { query } from "../db.js";
import { log } from "../logger.js";
import type {
  VyralSearchInput,
  VyralSearchResult,
  VyralTranscription,
  VyralVideoSummary,
} from "../types.js";
import type { VyralFeedItem } from "../vyral/feed.js";

const CACHE_TTL_HOURS = 24;

function canonicalize(input: VyralSearchInput): string {
  const ordered: Record<string, unknown> = {};
  for (const k of Object.keys(input).sort() as (keyof VyralSearchInput)[]) {
    if (input[k] !== undefined) ordered[k] = input[k];
  }
  return JSON.stringify(ordered);
}

export function hashQuery(input: VyralSearchInput): string {
  return createHash("sha256").update(canonicalize(input)).digest("hex");
}

// =================================================================
// viral_cache
// =================================================================

export async function getCachedSearch(
  input: VyralSearchInput,
): Promise<VyralSearchResult | null> {
  const hash = hashQuery(input);
  const { rows } = await query<{ response: VyralSearchResult }>(
    `select response from viral_cache where query_hash = $1 and expires_at > now() limit 1`,
    [hash],
  );
  return rows[0]?.response ? { ...rows[0].response, cached: true } : null;
}

export async function putCachedSearch(
  input: VyralSearchInput,
  response: VyralSearchResult,
): Promise<void> {
  const hash = hashQuery(input);
  await query(
    `
    insert into viral_cache (query_hash, query, response, fetched_at, expires_at)
    values ($1, $2::jsonb, $3::jsonb, now(), now() + ($4 || ' hours')::interval)
    on conflict (query_hash) do update set
      response = excluded.response,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
    `,
    [hash, JSON.stringify(input), JSON.stringify(response), String(CACHE_TTL_HOURS)],
  );
}

// =================================================================
// viral_videos
// =================================================================

/**
 * Persist a Vyral video. We store the indexable columns derived from our
 * summary AND the original Vyral feed item in `raw` so we can later replay
 * the transcription/metaData without re-fetching the feed.
 */
export async function upsertVideo(
  summary: VyralVideoSummary,
  rawItem?: VyralFeedItem,
): Promise<void> {
  const raw = rawItem ?? summary; // fall back to summary if caller has no raw
  await query(
    `
    insert into viral_videos (
      id, url, creator, thumbnail_url, posted_at, country, niche,
      views, likes, comments, shares, estimated_revenue_brl,
      product_name, product_shop_url, product_price_brl, hook_preview, raw,
      first_seen_at, last_seen_at
    ) values (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,
      $13,$14,$15,$16,$17::jsonb,
      now(), now()
    )
    on conflict (id) do update set
      url = excluded.url,
      creator = excluded.creator,
      thumbnail_url = excluded.thumbnail_url,
      posted_at = excluded.posted_at,
      country = excluded.country,
      niche = excluded.niche,
      views = excluded.views,
      likes = excluded.likes,
      comments = excluded.comments,
      shares = excluded.shares,
      estimated_revenue_brl = excluded.estimated_revenue_brl,
      product_name = excluded.product_name,
      product_shop_url = excluded.product_shop_url,
      product_price_brl = excluded.product_price_brl,
      hook_preview = excluded.hook_preview,
      raw = excluded.raw,
      last_seen_at = now()
    `,
    [
      summary.id,
      summary.url,
      summary.creator,
      summary.thumbnailUrl ?? null,
      summary.postedAt ?? null,
      summary.country,
      summary.niche ?? null,
      summary.metrics.views,
      summary.metrics.likes,
      summary.metrics.comments,
      summary.metrics.shares ?? null,
      summary.metrics.estimatedRevenueBrl ?? null,
      summary.product?.name ?? null,
      summary.product?.shopUrl ?? null,
      summary.product?.priceBrl ?? null,
      summary.hookPreview ?? null,
      JSON.stringify(raw),
    ],
  );
}

export type VideoPair = { summary: VyralVideoSummary; rawItem?: VyralFeedItem };

export async function upsertVideos(pairs: VideoPair[] | VyralVideoSummary[]): Promise<void> {
  if (!pairs.length) return;
  const isPair = (p: VideoPair | VyralVideoSummary): p is VideoPair => "summary" in p;
  let ok = 0;
  for (const p of pairs) {
    const summary = isPair(p) ? p.summary : p;
    const raw = isPair(p) ? p.rawItem : undefined;
    try {
      await upsertVideo(summary, raw);
      ok++;
    } catch (err) {
      log.warn(
        { err: err instanceof Error ? err.message : err, id: summary.id },
        "upsertVideo failed",
      );
    }
  }
  log.debug({ inserted: ok, total: pairs.length }, "viral_videos: upsert batch done");
}

/**
 * Pull the Vyral FeedItem we previously cached for a given video id, so
 * follow-up calls (transcription, insights) can skip a re-fetch.
 */
export async function findFeedItemById(id: string): Promise<VyralFeedItem | null> {
  const { rows } = await query<{ raw: VyralFeedItem | VyralVideoSummary }>(
    `select raw from viral_videos where id = $1 limit 1`,
    [id],
  );
  const raw = rows[0]?.raw;
  if (!raw) return null;
  // Heuristic: a FeedItem has a `metaData` blob; a Summary doesn't.
  if ("metaData" in raw) return raw as VyralFeedItem;
  return null;
}

// =================================================================
// viral_transcriptions
// =================================================================

export async function upsertTranscription(t: VyralTranscription): Promise<void> {
  await query(
    `
    insert into viral_transcriptions (
      video_id, language, full_text, hook_text, hook_start_sec, hook_end_sec,
      problem_text, solution_text, cta_text, insights, raw, fetched_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,now())
    on conflict (video_id) do update set
      language = excluded.language,
      full_text = excluded.full_text,
      hook_text = excluded.hook_text,
      hook_start_sec = excluded.hook_start_sec,
      hook_end_sec = excluded.hook_end_sec,
      problem_text = excluded.problem_text,
      solution_text = excluded.solution_text,
      cta_text = excluded.cta_text,
      insights = excluded.insights,
      raw = excluded.raw,
      fetched_at = now()
    `,
    [
      t.videoId,
      t.language,
      t.full,
      t.structure.hook.text,
      t.structure.hook.startSec,
      t.structure.hook.endSec,
      t.structure.problem?.text ?? null,
      t.structure.solution?.text ?? null,
      t.structure.cta?.text ?? null,
      JSON.stringify(t.insights ?? []),
      JSON.stringify(t),
    ],
  );
}
