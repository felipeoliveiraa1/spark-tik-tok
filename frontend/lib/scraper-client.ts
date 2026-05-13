import { createHmac } from "node:crypto";
import type {
  ScraperJobInput,
  ScraperJobResult,
  VyralSearchInput,
  VyralSearchResult,
  VyralTopProductsResult,
  VyralTranscription,
} from "@scraper/types";

/**
 * Client for the Spark scraper worker (running on the Contabo VPS).
 *
 * Pulls config from process.env so it works both on Vercel server actions and
 * Next.js API route handlers. The shared HMAC secret must match the worker's
 * `SCRAPER_HMAC_SECRET`.
 *
 * In local dev, set:
 *   SCRAPER_BASE_URL=http://localhost:4001
 *   SCRAPER_HMAC_SECRET=<same as worker>
 */

const POLL_INTERVAL_MS = 700;
// O scrape via Playwright (login + nav + extração de 10 cards) leva 15-25s.
// Vercel Pro tem 60s de timeout, Hobby tem 10s. Pra Hobby vai estourar de
// qualquer jeito — assumindo Pro/Enterprise. Margem de 5s pro modelo
// responder em texto depois.
const DEFAULT_POLL_TIMEOUT_MS = 25_000;

class ScraperClientError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ScraperClientError";
    this.status = status;
  }
}

function getBaseUrl(): string {
  const url = process.env.SCRAPER_BASE_URL;
  if (!url) throw new ScraperClientError("SCRAPER_BASE_URL not set");
  return url.replace(/\/$/, "");
}

function getSecret(): string {
  const s = process.env.SCRAPER_HMAC_SECRET;
  if (!s) throw new ScraperClientError("SCRAPER_HMAC_SECRET not set");
  return s;
}

function sign(timestamp: string, body: string): string {
  return createHmac("sha256", getSecret()).update(`${timestamp}.${body}`).digest("hex");
}

async function signedFetch(path: string, init: { method: "GET" | "POST"; body?: unknown }) {
  const body = init.method === "POST" ? JSON.stringify(init.body ?? {}) : "{}";
  const timestamp = String(Date.now());
  const signature = sign(timestamp, body);

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: init.method,
    headers: {
      "content-type": "application/json",
      "x-spark-signature": signature,
      "x-spark-timestamp": timestamp,
    },
    body: init.method === "POST" ? body : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ScraperClientError(`scraper ${path} → ${res.status}: ${text}`, res.status);
  }
  return res.json();
}

async function pollUntilDone<T>(jobId: string, timeoutMs = DEFAULT_POLL_TIMEOUT_MS): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = (await signedFetch(`/jobs/${jobId}`, { method: "GET" })) as ScraperJobResult<T>;
    if (status.status === "done") return status.data as T;
    if (status.status === "error") {
      throw new ScraperClientError(status.error?.message ?? "scraper job failed");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new ScraperClientError(`scraper job ${jobId} timed out after ${timeoutMs}ms`);
}

async function runJob<T>(input: ScraperJobInput, opts?: { timeoutMs?: number }): Promise<T> {
  const enqueued = (await signedFetch("/jobs", { method: "POST", body: input })) as ScraperJobResult;
  if (!enqueued.jobId) throw new ScraperClientError("scraper did not return a jobId");
  return pollUntilDone<T>(enqueued.jobId, opts?.timeoutMs);
}

// =================================================================
// Public API — typed wrappers for each Vyral job
// =================================================================

export async function searchVyralVideos(params: VyralSearchInput, opts?: { timeoutMs?: number }) {
  return runJob<VyralSearchResult>({ kind: "vyral.search-videos", params }, opts);
}

export async function getVyralTranscription(
  videoId: string,
  searchQuery?: string,
  opts?: { timeoutMs?: number },
) {
  return runJob<VyralTranscription>(
    { kind: "vyral.get-transcription", params: { videoId, searchQuery } },
    opts,
  );
}

export async function getVyralTopProducts(
  params: { country: "BR" | "US"; niche?: VyralSearchInput["niche"] },
  opts?: { timeoutMs?: number },
) {
  return runJob<VyralTopProductsResult>({ kind: "vyral.top-products", params }, opts);
}

export { ScraperClientError };
