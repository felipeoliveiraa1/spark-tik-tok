import type { VyralTranscription } from "../types.js";
import { log } from "../logger.js";
import { fetchFeed, type VyralFeedItem } from "./feed.js";
import { analyzeInsight } from "./insights.js";
import { mapToTranscription } from "./mapper.js";
import { mockGetTranscription } from "./mocks.js";
import { isMockMode } from "../config.js";
import { findFeedItemById, upsertTranscription } from "../persistence/viral.js";

/**
 * Fetch the AI-extracted transcription/structure for a single video.
 *
 * Vyral ships the raw transcription inside the feed item itself
 * (`metaData.transcription`), so for live mode we:
 *   1. Re-fetch a slice of the feed and locate the item by id (cheap; Vyral
 *      doesn't expose a per-id endpoint we've seen).
 *   2. Call /dashboard/insights/analyze with the transcription text to get
 *      the gancho/problema/solução/CTA breakdown + reusable template.
 *
 * If the caller already has the transcription on hand (e.g. directly from a
 * prior search result), they can pass it via the params object to skip step 1.
 */
export async function getTranscription(
  _ctx: unknown,
  params: { videoId: string; transcription?: string; rawItem?: VyralFeedItem },
): Promise<VyralTranscription> {
  if (isMockMode) {
    log.debug({ params }, "vyral.transcribe: mock mode (no credentials)");
    return mockGetTranscription(params.videoId);
  }

  try {
    let raw = params.rawItem;
    let transcription = params.transcription;

    // Fast path: try to read the item we already persisted during a prior search.
    if (!raw) {
      const cached = await findFeedItemById(params.videoId);
      if (cached) {
        log.debug({ id: params.videoId }, "vyral.transcribe: video found in Postgres");
        raw = cached;
        transcription = transcription ?? cached.metaData?.transcription ?? "";
      }
    }

    // Fallback: walk a slice of the feed to find the item.
    if (!raw) {
      const feed = await fetchFeed({ limit: 50 });
      raw = feed.data.find((item) => item.id === params.videoId);
      if (!raw) throw new Error(`vyral.transcribe: video ${params.videoId} not found`);
      transcription = transcription ?? raw.metaData?.transcription ?? "";
    }

    let insight: Awaited<ReturnType<typeof analyzeInsight>> | null = null;
    if (transcription) {
      try {
        insight = await analyzeInsight(transcription);
      } catch (err) {
        log.warn(
          { err: err instanceof Error ? err.message : err },
          "vyral.transcribe: analyzeInsight failed — returning transcription only",
        );
      }
    }

    const mapped = mapToTranscription(raw!, insight);
    void upsertTranscription(mapped).catch((err) =>
      log.warn(
        { err: err instanceof Error ? err.message : err },
        "transcribe: upsertTranscription failed",
      ),
    );
    return mapped;
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : err, params },
      "vyral.transcribe: live fetch failed — falling back to mock",
    );
    return mockGetTranscription(params.videoId);
  }
}
