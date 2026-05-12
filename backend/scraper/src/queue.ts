import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { randomUUID } from "node:crypto";
import { env } from "./config.js";
import { log } from "./logger.js";
import type { ScraperJobInput, ScraperJobResult } from "./types.js";
import { runJob } from "./jobs.js";

const QUEUE_NAME = "vyral-scrape";

// =================================================================
// Sync mode (in-memory) — used in local dev without Redis.
// =================================================================

type SyncEntry = ScraperJobResult;
const syncStore = new Map<string, SyncEntry>();

async function enqueueSync(input: ScraperJobInput): Promise<{ jobId: string }> {
  const jobId = randomUUID();
  syncStore.set(jobId, { jobId, status: "running", startedAt: new Date().toISOString() });
  // Fire-and-forget — but we await here in sync mode so the POST handler can
  // also resolve the result before the response goes out.
  try {
    const data = await runJob(input);
    syncStore.set(jobId, {
      jobId,
      status: "done",
      data,
      finishedAt: new Date().toISOString(),
    });
  } catch (err) {
    syncStore.set(jobId, {
      jobId,
      status: "error",
      error: { message: err instanceof Error ? err.message : String(err) },
    });
  }
  return { jobId };
}

function getSyncStatus(jobId: string): ScraperJobResult {
  return syncStore.get(jobId) ?? { jobId, status: "error", error: { message: "not_found" } };
}

// =================================================================
// BullMQ mode — used in production on the VPS.
// =================================================================

let _redis: IORedis | null = null;
let _queue: Queue<ScraperJobInput, unknown> | null = null;

function getQueue(): Queue<ScraperJobInput, unknown> {
  if (!_queue) {
    _redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    _queue = new Queue<ScraperJobInput, unknown>(QUEUE_NAME, {
      connection: _redis,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 60 * 60 * 24, count: 500 },
        removeOnFail: { age: 60 * 60 * 24 * 7, count: 1000 },
      },
    });
  }
  return _queue;
}

export function startWorker() {
  if (env.SCRAPER_SYNC) {
    log.info("queue: SCRAPER_SYNC=true — skipping BullMQ worker");
    return { close: async () => undefined };
  }

  const connection = _redis ?? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  _redis = connection;
  getQueue(); // ensure queue exists too

  const worker = new Worker<ScraperJobInput, unknown>(
    QUEUE_NAME,
    async (job: Job<ScraperJobInput>) => {
      log.info({ jobId: job.id, kind: job.data.kind }, "job:start");
      const result = await runJob(job.data);
      log.info({ jobId: job.id }, "job:done");
      return result;
    },
    {
      connection,
      concurrency: 1,
      lockDuration: env.JOB_TIMEOUT_MS + 30_000,
    },
  );

  worker.on("failed", (job, err) => {
    log.error({ jobId: job?.id, err: err.message }, "job:failed");
  });

  return worker;
}

// =================================================================
// Public API — mode-agnostic
// =================================================================

export async function enqueueJob(input: ScraperJobInput): Promise<ScraperJobResult> {
  if (env.SCRAPER_SYNC) {
    const { jobId } = await enqueueSync(input);
    return getSyncStatus(jobId);
  }
  const job = await getQueue().add(input.kind, input, {});
  return { jobId: String(job.id), status: "queued" };
}

export async function getJobStatus(jobId: string): Promise<ScraperJobResult> {
  if (env.SCRAPER_SYNC) return getSyncStatus(jobId);

  const job = await getQueue().getJob(jobId);
  if (!job) return { jobId, status: "error", error: { message: "not_found" } };

  const state = await job.getState();
  if (state === "completed") {
    return {
      jobId,
      status: "done",
      data: job.returnvalue,
      startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  }
  if (state === "failed") {
    return { jobId, status: "error", error: { message: job.failedReason ?? "unknown" } };
  }
  if (state === "active") return { jobId, status: "running" };
  return { jobId, status: "queued" };
}
