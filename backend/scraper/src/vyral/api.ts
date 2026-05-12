import { log } from "../logger.js";
import { VYRAL_HOSTS, type VyralHost } from "./hosts.js";
import {
  decodeJwtPayload,
  extractTokens,
  ingestSetCookieHeaders,
  isJwtExpired,
  loadCookies,
  renderCookieHeader,
  saveCookies,
  type VyralCookieStore,
} from "./cookies.js";

/**
 * HTTP client for the Vyral.com.br internal JSON API.
 *
 * - Reads persisted cookies + JWT from `vyral-session-cookies.json`
 * - Sends both `Cookie` header and `Authorization: Bearer <dashboardToken>`
 * - Auto-refreshes the JWT when expired (and re-saves the store)
 * - Mirrors the User-Agent / Origin of a real browser to avoid trivial blocks
 *
 * The actual endpoint paths (e.g. /api/videos/search) will be plugged in once
 * we sniff a real request from the Vyral web app.
 */

const BROWSER_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "accept": "application/json, text/plain, */*",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
  "origin": "https://app.vyral.com.br",
  "referer": "https://app.vyral.com.br/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

class VyralApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "VyralApiError";
    this.status = status;
    this.body = body;
  }
}

let storeCache: VyralCookieStore | null = null;
let refreshInFlight: Promise<VyralCookieStore> | null = null;

async function getStore(): Promise<VyralCookieStore> {
  if (!storeCache) storeCache = await loadCookies();
  return storeCache;
}

/** Attempt to refresh the JWT using `dashboardRefreshToken`. */
async function refreshTokens(store: VyralCookieStore): Promise<VyralCookieStore> {
  if (refreshInFlight) return refreshInFlight;

  const { dashboardRefreshToken } = extractTokens(store);
  if (!dashboardRefreshToken) {
    throw new VyralApiError(401, "no refresh token available — re-login required");
  }

  log.info("vyral.api: refreshing JWT via /api/auth/dashboard/set-user-session");
  refreshInFlight = (async () => {
    // The Vyral web app calls this endpoint on the same origin when the JWT
    // expires; the server reads the `dashboardRefreshToken` cookie and Set-Cookies
    // a new `dashboardToken`. We don't know the exact payload yet, so we send
    // empty body + cookies and trust the Set-Cookie response.
    const url = `${VYRAL_HOSTS.app}/api/auth/dashboard/set-user-session`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        cookie: renderCookieHeader(store.cookies),
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      let body: unknown = undefined;
      try {
        body = await res.json();
      } catch {
        body = await res.text().catch(() => undefined);
      }
      throw new VyralApiError(res.status, `vyral.api.refresh: ${res.status}`, body);
    }
    const next = ingestSetCookieHeaders(store, res.headers);
    if (next.cookies.dashboardToken === store.cookies.dashboardToken) {
      throw new VyralApiError(
        500,
        "vyral.api.refresh: response did not rotate dashboardToken — schema may have changed",
      );
    }
    await saveCookies(next);
    return next;
  })();

  try {
    const refreshed = await refreshInFlight;
    storeCache = refreshed;
    return refreshed;
  } finally {
    refreshInFlight = null;
  }
}

async function ensureFreshToken(): Promise<VyralCookieStore> {
  const store = await getStore();
  const { dashboardToken } = extractTokens(store);
  if (!dashboardToken) {
    throw new VyralApiError(401, "no dashboardToken in cookies — paste a fresh set");
  }
  if (!isJwtExpired(dashboardToken)) return store;
  return refreshTokens(store);
}

export type VyralRequestInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Which Vyral backend host to hit. Defaults to `content`. */
  host?: VyralHost;
  /** URL path relative to the host (or a full absolute URL). */
  path: string;
  /** Single-valued query params */
  searchParams?: Record<string, string | number | boolean | undefined>;
  /** Repeatable query params (e.g. `filters` appears N times) */
  searchParamsMulti?: Record<string, Array<string | number | boolean>>;
  body?: unknown;
  /** Additional headers merged in last */
  headers?: Record<string, string>;
};

function buildUrl(path: string, host: VyralHost, init: VyralRequestInit): string {
  const base = path.startsWith("http") ? path : `${VYRAL_HOSTS[host]}${path}`;
  const usp = new URLSearchParams();
  if (init.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      if (v !== undefined && v !== null) usp.append(k, String(v));
    }
  }
  if (init.searchParamsMulti) {
    for (const [k, values] of Object.entries(init.searchParamsMulti)) {
      for (const v of values) usp.append(k, String(v));
    }
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function vyralFetch<T = unknown>(init: VyralRequestInit): Promise<T> {
  let store = await ensureFreshToken();
  const { dashboardToken } = extractTokens(store);
  const host = init.host ?? "content";
  const url = buildUrl(init.path, host, init);

  const method = init.method ?? (init.body ? "POST" : "GET");
  const headers: Record<string, string> = {
    ...BROWSER_HEADERS,
    cookie: renderCookieHeader(store.cookies),
    authorization: `Bearer ${dashboardToken}`,
    ...(init.body ? { "content-type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  log.debug({ method, url }, "vyral.api: fetch");

  const res = await fetch(url, {
    method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  // Persist any rotated cookies (Vyral might rotate them per request).
  const next = ingestSetCookieHeaders(store, res.headers);
  if (next.cookies.dashboardToken !== store.cookies.dashboardToken) {
    await saveCookies(next);
    storeCache = next;
    store = next;
  }

  if (!res.ok) {
    let body: unknown = undefined;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => undefined);
    }
    throw new VyralApiError(res.status, `vyral.api ${method} ${init.path} → ${res.status}`, body);
  }

  // Empty bodies are valid
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new VyralApiError(res.status, "vyral.api: non-JSON response", text);
  }
}

/** Returns who the session belongs to (handy for health checks). */
export function whoAmI(): { id: string; email: string; name: string } | null {
  if (!storeCache) return null;
  const { dashboardToken } = extractTokens(storeCache);
  if (!dashboardToken) return null;
  const payload = decodeJwtPayload<{
    session?: { user?: { id: string; email: string; name: string } };
  }>(dashboardToken);
  return payload?.session?.user ?? null;
}

export { VyralApiError };
