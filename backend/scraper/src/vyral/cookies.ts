import { readFile, writeFile } from "node:fs/promises";
import { env } from "../config.js";
import { log } from "../logger.js";

/**
 * Persisted Vyral cookies + JWT. Lives next to the worker, never committed.
 * Refreshed automatically when the JWT expires (we hit the refresh endpoint
 * and overwrite the file).
 */
export type VyralCookieStore = {
  _note?: string;
  cookies: Record<string, string>;
  savedAt?: string;
};

const COOKIE_FILE = env.VYRAL_COOKIE_FILE;

let cache: VyralCookieStore | null = null;

export async function loadCookies(): Promise<VyralCookieStore> {
  if (cache) return cache;
  try {
    const raw = await readFile(COOKIE_FILE, "utf-8");
    cache = JSON.parse(raw) as VyralCookieStore;
    if (!cache.cookies) throw new Error("invalid cookie file");
    return cache;
  } catch (err) {
    throw new Error(
      `vyral.cookies: could not read ${COOKIE_FILE} (${err instanceof Error ? err.message : "unknown"})`,
    );
  }
}

export async function saveCookies(store: VyralCookieStore): Promise<void> {
  cache = store;
  await writeFile(
    COOKIE_FILE,
    JSON.stringify({ ...store, savedAt: new Date().toISOString() }, null, 2),
    "utf-8",
  );
}

/** Render cookie object as the single `Cookie` header value an HTTP request expects. */
export function renderCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/** Apply Set-Cookie response headers back into the store (best-effort parser). */
export function ingestSetCookieHeaders(store: VyralCookieStore, headers: Headers): VyralCookieStore {
  const setCookies = headers.getSetCookie?.() ?? [];
  if (!setCookies.length) return store;
  const updated = { ...store.cookies };
  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!name) continue;
    updated[name] = value;
  }
  return { ...store, cookies: updated };
}

/** Decode a JWT payload (no signature verification — we only use it to detect expiry). */
export function decodeJwtPayload<T = unknown>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf-8",
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, leewaySec = 60): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec + leewaySec >= payload.exp;
}

/** Convenience read for the current bearer token + refresh token, if present. */
export function extractTokens(store: VyralCookieStore): {
  dashboardToken?: string;
  dashboardRefreshToken?: string;
} {
  return {
    dashboardToken: store.cookies.dashboardToken,
    dashboardRefreshToken: store.cookies.dashboardRefreshToken,
  };
}

log.debug({ COOKIE_FILE }, "vyral.cookies: module loaded");
