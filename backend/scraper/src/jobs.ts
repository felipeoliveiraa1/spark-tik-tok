import { searchVideos } from "./vyral/search.js";
import { getTranscription } from "./vyral/transcribe.js";
import { listTopProducts } from "./vyral/top-products.js";
import { withSession } from "./vyral/session.js";
import type { ScraperJobInput } from "./types.js";

/**
 * Dispatcher: receives a parsed job and calls the right Vyral function inside
 * a managed browser context. The session ensures we don't re-login per job.
 */
export async function runJob(input: ScraperJobInput): Promise<unknown> {
  return withSession(async (ctx) => {
    switch (input.kind) {
      case "vyral.search-videos":
        return searchVideos(ctx, input.params);
      case "vyral.get-transcription":
        return getTranscription(ctx, input.params);
      case "vyral.top-products":
        return listTopProducts(ctx, input.params);
      default: {
        const exhaustive: never = input;
        throw new Error(`unknown job kind: ${JSON.stringify(exhaustive)}`);
      }
    }
  });
}
