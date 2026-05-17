#!/usr/bin/env node
/**
 * Login interativo no Vyral — usado quando o 2FA por email está ativo.
 *
 * Por que isso existe: o Vyral envia um código de 6 dígitos por email
 * em todo login fresh. Como o scraper é headless, ele não consegue
 * acessar o email pra pegar o código sozinho. Esse script roda dentro
 * do container, faz o login até a tela do código, pausa pra você colar
 * o código que veio no email, e depois salva o storageState (cookies +
 * localStorage) em /app/data/vyral-session.json.
 *
 * Depois disso, o scraper normal consegue usar essa session por dias/
 * semanas sem precisar do código novamente (porque sai do mesmo IP).
 *
 * USO (dentro da VPS):
 *   docker compose --env-file .env.production exec -it scraper \
 *     node /app/scripts/login-interactive.mjs
 */

import { chromium } from "playwright";
import readline from "node:readline/promises";
import { stdin, stdout, env, exit } from "node:process";

const EMAIL = env.VYRAL_EMAIL;
const PASSWORD = env.VYRAL_PASSWORD;
const SESSION_FILE = env.SESSION_FILE || "/app/data/vyral-session.json";
const BASE = env.VYRAL_BASE_URL || "https://app.vyral.com.br";
const HEADLESS = env.PLAYWRIGHT_HEADLESS !== "false";

if (!EMAIL || !PASSWORD) {
  console.error("✗ VYRAL_EMAIL e VYRAL_PASSWORD precisam estar no env.");
  exit(1);
}

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log("→ Lançando chromium (headless:", HEADLESS, ")");
const browser = await chromium.launch({ headless: HEADLESS });

const context = await browser.newContext({
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  viewport: { width: 1366, height: 820 },
});
const page = await context.newPage();

console.log("→ Indo pra", `${BASE}/login`);
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });

console.log("→ Preenchendo email + senha");
await page
  .locator(
    'input[type="email"], input[name="email"], input[id="email"], input[placeholder*="mail" i]',
  )
  .first()
  .fill(EMAIL);
await page
  .locator('input[type="password"], input[name="password"], input[id="password"]')
  .first()
  .fill(PASSWORD);

const submit = page
  .locator(
    'button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")',
  )
  .first();
if ((await submit.count()) > 0) {
  await submit.click();
} else {
  await page.keyboard.press("Enter");
}

console.log("→ Aguardando tela do código (/confirm-session)...");
try {
  await page.waitForURL((u) => /confirm-session|otp|code|verify|2fa/i.test(u.toString()), {
    timeout: 30_000,
  });
} catch {
  console.log("⚠ Não detectei a tela de confirmação — URL atual:", page.url());
  console.log("  Talvez o login não pediu código dessa vez. Tentando salvar a session mesmo assim…");
  await context.storageState({ path: SESSION_FILE });
  console.log("✓ Session salva em", SESSION_FILE);
  await browser.close();
  rl.close();
  exit(0);
}

console.log("\n📧 Vyral mandou um código de 6 dígitos pro email da Yara.");
console.log("   Abre oficialyarasantos@gmail.com → procura email da Vyral.");
const codeRaw = await rl.question("\n👉 Cola o código aqui e dá Enter: ");
const code = codeRaw.replace(/\D/g, "").slice(0, 6);
if (code.length !== 6) {
  console.error(`✗ Código inválido (esperava 6 dígitos, recebi ${code.length}: "${code}")`);
  await browser.close();
  rl.close();
  exit(1);
}

console.log("→ Preenchendo código:", code);

// Vyral pode usar 6 inputs separados (cada um com maxlength=1) OU um input único.
// Tentamos os dois.
const sixInputs = page.locator(
  'input[maxlength="1"], input[type="text"][inputmode="numeric"]',
);
const sixCount = await sixInputs.count();

if (sixCount >= 6) {
  console.log(`  (detectei ${sixCount} inputs separados)`);
  for (let i = 0; i < 6; i++) {
    await sixInputs.nth(i).fill(code[i]);
    await page.waitForTimeout(60);
  }
} else {
  const single = page
    .locator(
      'input[name*="code" i], input[name*="otp" i], input[placeholder*="ódigo" i], input[placeholder*="code" i], input[type="text"]',
    )
    .first();
  if ((await single.count()) > 0) {
    console.log("  (detectei input único)");
    await single.fill(code);
  } else {
    console.error("✗ Não achei nenhum input pra colar o código!");
    console.error("  URL atual:", page.url());
    await page.screenshot({ path: "/app/data/login-fail.png", fullPage: true }).catch(() => {});
    console.error("  Screenshot salvo em /app/data/login-fail.png");
    await browser.close();
    rl.close();
    exit(1);
  }
}

console.log("→ Tentando submeter o código");
const submitCode = page
  .locator(
    'button[type="submit"], button:has-text("Confirmar"), button:has-text("Validar"), button:has-text("Verificar"), button:has-text("Acessar"), button:has-text("Continuar")',
  )
  .first();
if ((await submitCode.count()) > 0) {
  await submitCode.click().catch(() => {});
} else {
  await page.keyboard.press("Enter").catch(() => {});
}

console.log("→ Aguardando redirect pra fora do confirm/login...");
try {
  await page.waitForURL((u) => !/confirm-session|login|otp|verify|2fa/i.test(u.toString()), {
    timeout: 30_000,
  });
} catch {
  console.error("✗ Não saiu da tela de confirmação. URL atual:", page.url());
  console.error("  Talvez o código esteja errado ou expirado. Tenta de novo.");
  await page.screenshot({ path: "/app/data/login-fail.png", fullPage: true }).catch(() => {});
  await browser.close();
  rl.close();
  exit(1);
}

const finalUrl = page.url();
console.log("✓ Login completo! URL final:", finalUrl);

await page.waitForTimeout(2000); // deixa cookies finais persistirem

console.log("→ Salvando session em", SESSION_FILE);
await context.storageState({ path: SESSION_FILE });
console.log("✓ Session salva! O scraper agora consegue usar essa sessão.");
console.log("  Próxima vez que você mandar 'virais da semana' no chat, deve funcionar.\n");

await browser.close();
rl.close();
exit(0);
