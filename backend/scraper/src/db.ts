import pg from "pg";
import { env } from "./config.js";
import { log } from "./logger.js";

/**
 * Postgres connection pool for the scraper worker.
 *
 * In dev: a local `spark_dev` database (brew postgresql@16).
 * In prod (VPS): same instance, just a different DATABASE_URL.
 *
 * We share a single pool across the process and surface a `withClient` helper
 * for short-lived transactional work.
 */
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  log.error({ err: err.message }, "pg.pool: idle client error");
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(sql, params as unknown[] | undefined);
}

export async function withClient<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await query<{ ok: number }>("select 1 as ok");
    return { ok: r.rows[0]?.ok === 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
