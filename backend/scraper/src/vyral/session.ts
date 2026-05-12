import { readFile, writeFile } from "node:fs/promises";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type BrowserContextOptions,
} from "playwright";
import { env, isMockMode } from "../config.js";
import { log } from "../logger.js";

/**
 * Vyral session — persists cookies + localStorage between worker restarts so
 * we don't re-login per job. In mock mode we never spin up a real browser.
 */
export type VyralSessionCtx = {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  mock: boolean;
};

let cached: VyralSessionCtx | null = null;
let initializing: Promise<VyralSessionCtx> | null = null;

async function loadStorageState(): Promise<BrowserContextOptions["storageState"] | undefined> {
  try {
    const raw = await readFile(env.SESSION_FILE, "utf-8");
    return JSON.parse(raw) as BrowserContextOptions["storageState"];
  } catch {
    return undefined;
  }
}

async function persistStorageState(context: BrowserContext) {
  const state = await context.storageState();
  await writeFile(env.SESSION_FILE, JSON.stringify(state, null, 2), "utf-8");
}

async function ensureLoggedIn(page: Page): Promise<void> {
  // TODO(vyral-real): map the actual login form selectors once we have access.
  // Steps will be roughly:
  //   1. page.goto(`${VYRAL_BASE_URL}/login`)
  //   2. await page.fill('input[type="email"]', VYRAL_EMAIL)
  //   3. await page.fill('input[type="password"]', VYRAL_PASSWORD)
  //   4. await page.click('button[type="submit"]')
  //   5. await page.waitForURL(/dashboard|app|home/)
  //   6. persistStorageState(context)
  log.warn(
    "vyral.session.login: stub — fill in selectors after first manual login pass on the real platform",
  );
}

async function buildSession(): Promise<VyralSessionCtx> {
  if (isMockMode) {
    log.info("vyral.session: running in MOCK mode (no credentials set)");
    return { mock: true };
  }

  log.info("vyral.session: launching chromium");
  const browser = await chromium.launch({ headless: env.PLAYWRIGHT_HEADLESS });
  const storageState = await loadStorageState();
  const contextOptions: BrowserContextOptions = {
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 820 },
  };
  if (storageState) contextOptions.storageState = storageState;
  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();
  await ensureLoggedIn(page);
  await persistStorageState(context);

  return { browser, context, page, mock: false };
}

/**
 * Get (or create) a singleton browser context. Wrap your scraping calls in
 * `withSession` so cleanup + error handling stays in one place.
 */
export async function getSession(): Promise<VyralSessionCtx> {
  if (cached) return cached;
  if (!initializing) {
    initializing = buildSession().then((s) => {
      cached = s;
      initializing = null;
      return s;
    });
  }
  return initializing;
}

export async function withSession<T>(fn: (ctx: VyralSessionCtx) => Promise<T>): Promise<T> {
  const ctx = await getSession();
  try {
    return await fn(ctx);
  } catch (err) {
    // If we hit an auth-ish error, drop the cached session so the next job
    // re-logins. (Heuristic — refine once we know Vyral's error patterns.)
    const msg = err instanceof Error ? err.message : String(err);
    if (/login|unauthor|expired|sess/i.test(msg)) {
      log.warn({ err: msg }, "vyral.session: invalidating after auth-ish error");
      await closeSession();
    }
    throw err;
  }
}

export async function closeSession(): Promise<void> {
  if (cached?.browser) {
    try {
      await cached.browser.close();
    } catch {
      // ignore
    }
  }
  cached = null;
}
