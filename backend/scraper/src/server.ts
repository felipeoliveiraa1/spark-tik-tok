import express, { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { env } from "./config.js";
import { log } from "./logger.js";
import { verify } from "./hmac.js";
import { enqueueJob, getJobStatus, startWorker } from "./queue.js";
import type { ScraperJobInput } from "./types.js";
import { ping as pingDb } from "./db.js";
import {
  expireTrials,
  handleBlast,
  handleFlushNow,
  handleStats,
  runAllTriggers,
  runDailyMotivationalBlast,
  runLeadFirstContactBlast,
  runLembreteCheckin,
  startWhatsAppWorker,
  stopWhatsAppWorker,
} from "./whatsapp.js";

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
// WhatsApp routes (Metodo TTS)
// =================================================================
// Todas HMAC-protected pelo mesmo middleware. Frontend chama via
// lib/scraper-client.ts com signedFetch.

app.post("/whatsapp/blast", hmacAuth, async (req, res) => {
  try {
    const result = await handleBlast(req.body ?? {});
    res.json(result);
  } catch (err) {
    log.error({ err }, "whatsapp/blast error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

app.get("/whatsapp/stats", hmacAuth, async (_req, res) => {
  try {
    const result = await handleStats();
    res.json(result);
  } catch (err) {
    log.error({ err }, "whatsapp/stats error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

app.post("/whatsapp/flush", hmacAuth, async (_req, res) => {
  try {
    const result = await handleFlushNow();
    res.json(result);
  } catch (err) {
    log.error({ err }, "whatsapp/flush error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

app.post("/whatsapp/triggers/run", hmacAuth, async (_req, res) => {
  try {
    const result = await runAllTriggers();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error({ err }, "whatsapp/triggers error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

// Forca expirar trials manualmente (debugging / one-off)
app.post("/whatsapp/expire-trials", hmacAuth, async (_req, res) => {
  try {
    const result = await expireTrials();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error({ err }, "whatsapp/expire-trials error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

// Forca disparar blast motivacional diario manualmente
app.post("/whatsapp/daily-motivational/run", hmacAuth, async (_req, res) => {
  try {
    const result = await runDailyMotivationalBlast();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error({ err }, "whatsapp/daily-motivational error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

// Forca disparar lembrete noturno de checkin manualmente
app.post("/whatsapp/lembrete-checkin/run", hmacAuth, async (_req, res) => {
  try {
    const result = await runLembreteCheckin();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error({ err }, "whatsapp/lembrete-checkin error");
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

// Lead blast — primeiro contato com leads do /formulario (status='novo').
// Usa instancia Evolution dedicada (EVOLUTION_LEADS_*) — chip isolado pra
// nao arriscar a do metodo. Cadencia 120s default, marca novo -> contactado.
// Body opcional: { limit?: number, intervalMs?: number, dryRun?: boolean }
app.post("/whatsapp/lead-blast", hmacAuth, async (req, res) => {
  try {
    const limit =
      typeof req.body?.limit === "number" && req.body.limit > 0
        ? Math.min(req.body.limit, 500)
        : undefined;
    const intervalMs =
      typeof req.body?.intervalMs === "number" && req.body.intervalMs >= 5_000
        ? req.body.intervalMs
        : undefined;
    const dryRun = req.body?.dryRun === true;
    const result = await runLeadFirstContactBlast({ limit, intervalMs, dryRun });
    res.json(result);
  } catch (err) {
    log.error({ err }, "whatsapp/lead-blast error");
    res
      .status(500)
      .json({ ok: false, error: err instanceof Error ? err.message : "erro" });
  }
});

// =================================================================
// Boot
// =================================================================

const worker = startWorker();
startWhatsAppWorker();
const server = app.listen(env.PORT, () => {
  log.info({ port: env.PORT, env: env.NODE_ENV }, "spark-scraper: listening");
});

async function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  stopWhatsAppWorker();
  await worker.close();
  server.close();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
