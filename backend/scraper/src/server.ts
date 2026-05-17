import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { env } from "./config.js";
import { log } from "./logger.js";
import { verify } from "./hmac.js";
import { enqueueJob, getJobStatus, startWorker } from "./queue.js";
import type { ScraperJobInput } from "./types.js";
import { ping as pingDb } from "./db.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

// =================================================================
// HMAC auth middleware — required on every /jobs request
// =================================================================

function hmacAuth(req: Request, res: Response, next: NextFunction) {
  const signature = req.header("x-spark-signature");
  const timestamp = req.header("x-spark-timestamp");
  if (!signature || !timestamp) {
    return res.status(401).json({ error: "missing_signature" });
  }
  // Drop requests older than 5 minutes (replay protection)
  const ageMs = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000) {
    return res.status(401).json({ error: "stale_timestamp" });
  }
  const body = JSON.stringify(req.body ?? {});
  const payload = `${timestamp}.${body}`;
  if (!verify(payload, signature)) {
    return res.status(401).json({ error: "invalid_signature" });
  }
  next();
}

// =================================================================
// Validators (zod) — fail closed on bad shapes
// =================================================================

const SearchSchema = z.object({
  kind: z.literal("vyral.search-videos"),
  params: z.object({
    query: z.string().optional(),
    country: z.enum(["BR", "US"]).optional(),
    niche: z
      .enum([
        "beleza",
        "saude",
        "moda",
        "casa",
        "eletronicos",
        "pet",
        "fitness",
        "acessorios",
        "infantil",
        "outros",
      ])
      .optional(),
    minViews: z.number().int().nonnegative().optional(),
    sortBy: z.enum(["sales", "views", "revenue", "recent", "engagement"]).optional(),
    lastDays: z.union([z.literal(7), z.literal(14), z.literal(30), z.literal(90)]).optional(),
    limit: z.number().int().positive().max(50).optional(),
  }),
});

const TranscribeSchema = z.object({
  kind: z.literal("vyral.get-transcription"),
  params: z.object({
    videoId: z.string().min(1),
    searchQuery: z.string().optional(),
  }),
});

const TopProductsSchema = z.object({
  kind: z.literal("vyral.top-products"),
  params: z.object({
    country: z.enum(["BR", "US"]),
    niche: z
      .enum([
        "beleza",
        "saude",
        "moda",
        "casa",
        "eletronicos",
        "pet",
        "fitness",
        "acessorios",
        "infantil",
        "outros",
      ])
      .optional(),
  }),
});

const JobBody = z.discriminatedUnion("kind", [SearchSchema, TranscribeSchema, TopProductsSchema]);

// =================================================================
// Routes
// =================================================================

app.get("/health", async (_req, res) => {
  const db = await pingDb();
  res.json({ ok: true, env: env.NODE_ENV, db, ts: new Date().toISOString() });
});

app.post("/jobs", hmacAuth, async (req, res) => {
  const parsed = JobBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_payload", issues: parsed.error.flatten() });
  }
  const input = parsed.data as ScraperJobInput;
  const result = await enqueueJob(input);
  log.info({ jobId: result.jobId, kind: input.kind, status: result.status }, "job:enqueued");
  // Sync mode returns the result immediately (status === 'done' or 'error').
  // Queue mode returns 202 with status === 'queued'.
  return res.status(result.status === "queued" ? 202 : 200).json(result);
});

app.get("/jobs/:id", hmacAuth, async (req, res) => {
  const id = String(req.params.id);
  const result = await getJobStatus(id);
  res.json(result);
});

// =================================================================
// Boot
// =================================================================

const worker = startWorker();
const server = app.listen(env.PORT, () => {
  log.info({ port: env.PORT, env: env.NODE_ENV }, "spark-scraper: listening");
});

async function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  await worker.close();
  server.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
