import { z } from "zod";

// Treat empty strings (common when a `.env` line is `VAR=`) as absent.
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const schema = z.object({
  PORT: z.coerce.number().default(4001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SCRAPER_HMAC_SECRET: z.string().min(16, "Set SCRAPER_HMAC_SECRET to a strong value"),
  VYRAL_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  VYRAL_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
  VYRAL_BASE_URL: z.string().url().default("https://www.vyral.com.br"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  // Default em /home/spark/ porque o user `spark` (UID 10001) sempre pode
  // escrever no próprio home. Se um bind mount apontar pra outro lugar
  // sobrescreve aqui mas precisa ter ownership chown -R 10001:10001.
  SESSION_FILE: z.string().default("/home/spark/vyral-session.json"),
  VYRAL_COOKIE_FILE: z.string().default("./vyral-cookies.json"),
  DATABASE_URL: z.string().default("postgresql://localhost:5432/spark_dev"),
  PLAYWRIGHT_HEADLESS: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("true"),
  JOB_TIMEOUT_MS: z.coerce.number().default(60000),
  RATE_LIMIT_PER_HOUR: z.coerce.number().default(30),
  /**
   * SYNC mode: run jobs inline instead of through BullMQ. Useful in local dev
   * when Redis isn't installed. Always disable in production.
   */
  SCRAPER_SYNC: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),

  // WhatsApp worker (Metodo TTS)
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  EVOLUTION_API_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  EVOLUTION_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://www.metodotts.app"),
  ),
  WHATSAPP_WORKER_ENABLED: z.enum(["true", "false"]).default("true"),
});

export const env = schema.parse(process.env);

export const isDev = env.NODE_ENV === "development";

const hasCredentials = !!env.VYRAL_EMAIL && !!env.VYRAL_PASSWORD;

/**
 * MOCK mode só liga em dev quando faltam credenciais. Em production sem
 * credenciais o worker FALHA em vez de servir mock — assim o agente sabe
 * que não tem dado real e a aluna não vê números inventados.
 */
export const isMockMode = isDev && !hasCredentials;

if (!isDev && !hasCredentials) {
  console.warn(
    "[config] PRODUCTION sem VYRAL_EMAIL/VYRAL_PASSWORD — scraper vai retornar erro em vez de mock",
  );
}
