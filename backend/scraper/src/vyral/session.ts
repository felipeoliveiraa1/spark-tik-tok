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
  if (!env.VYRAL_EMAIL || !env.VYRAL_PASSWORD) {
    throw new Error(
      "vyral.session: VYRAL_EMAIL / VYRAL_PASSWORD não configurados — set no .env.production",
    );
  }

  // 1. Bate na home pra ver se a sessão restaurada do storage state ainda é válida.
  try {
    await page.goto(env.VYRAL_BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // Se ainda estamos numa rota de login OU se vemos botão de "Entrar/Login",
    // sessão expirou.
    const currentUrl = page.url();
    const onLoginPage = /login|signin|entrar|auth/i.test(currentUrl);
    if (!onLoginPage) {
      const loginCta = await page
        .locator(
          'a[href*="login"], button:has-text("Entrar"), a:has-text("Entrar"), button:has-text("Login")',
        )
        .first()
        .count()
        .catch(() => 0);
      if (loginCta === 0) {
        log.info("vyral.session: cookies válidos, já logada");
        return;
      }
    }
  } catch (err) {
    log.warn({ err: err instanceof Error ? err.message : err }, "vyral.session: probe falhou");
  }

  log.info("vyral.session: fazendo login fresco");

  // 2. Navega pra rota de login (tenta os caminhos comuns).
  const loginCandidates = ["/login", "/entrar", "/signin", "/auth/login"];
  let landed = false;
  for (const path of loginCandidates) {
    try {
      const res = await page.goto(`${env.VYRAL_BASE_URL}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
      if (res && res.ok()) {
        landed = true;
        break;
      }
    } catch {
      /* tenta próximo */
    }
  }
  if (!landed) {
    throw new Error("vyral.session: não achei a página de login (tentei /login, /entrar, /signin, /auth/login)");
  }

  // 3. Preenche email + senha (tenta múltiplos selectors comuns).
  const emailInput = page.locator(
    'input[type="email"], input[name="email"], input[id="email"], input[placeholder*="mail" i]',
  ).first();
  await emailInput.waitFor({ timeout: 15_000 });
  await emailInput.fill(env.VYRAL_EMAIL);

  const passwordInput = page.locator(
    'input[type="password"], input[name="password"], input[id="password"]',
  ).first();
  await passwordInput.fill(env.VYRAL_PASSWORD);

  // 4. Submete (Enter no campo ou botão).
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")',
  ).first();
  const hasSubmit = await submitButton.count();
  if (hasSubmit > 0) {
    await submitButton.click();
  } else {
    await passwordInput.press("Enter");
  }

  // 5. Espera sair da rota de login.
  try {
    await page.waitForURL((url) => !/login|signin|entrar/i.test(url.toString()), {
      timeout: 30_000,
    });
  } catch {
    // Se ainda está em /login, captura erro visível
    const errMsg = await page
      .locator('[class*="error"], [role="alert"], .text-red-500, .text-danger')
      .first()
      .innerText()
      .catch(() => "");
    throw new Error(
      `vyral.session: login não saiu da rota de auth${errMsg ? ` (mensagem: ${errMsg.slice(0, 200)})` : ""}`,
    );
  }

  log.info({ landedAt: page.url() }, "vyral.session: login OK");
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
