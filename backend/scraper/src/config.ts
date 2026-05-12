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
  SESSION_FILE: z.string().default("./vyral-session.json"),
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
});

export const env = schema.parse(process.env);

export const isDev = env.NODE_ENV === "development";

/** True when running with no Vyral credentials — falls back to mock data. */
export const isMockMode = !env.VYRAL_EMAIL || !env.VYRAL_PASSWORD;
