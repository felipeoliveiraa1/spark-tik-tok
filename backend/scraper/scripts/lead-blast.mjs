#!/usr/bin/env node
/**
 * Dispara blast da Mensagem 1 pras leads `novo` via instancia Finance.
 *
 * USO:
 *   # Dry-run primeiro (so conta, NAO envia):
 *   SCRAPER_HMAC_SECRET=xxx node scripts/lead-blast.mjs --dry-run
 *
 *   # Disparo real (104 leads x 120s = ~3h28min):
 *   SCRAPER_HMAC_SECRET=xxx node scripts/lead-blast.mjs
 *
 *   # Com limite custom (testa em 3 antes do disparo total):
 *   SCRAPER_HMAC_SECRET=xxx node scripts/lead-blast.mjs --limit=3
 *
 *   # Cadencia custom (min 5s):
 *   SCRAPER_HMAC_SECRET=xxx node scripts/lead-blast.mjs --interval=60000
 *
 * ENV (alem do SCRAPER_HMAC_SECRET):
 *   SCRAPER_BASE_URL  default: http://localhost:4001 (VPS: http://127.0.0.1:4001)
 */
import crypto from "node:crypto";

const SECRET = process.env.SCRAPER_HMAC_SECRET;
if (!SECRET) {
  console.error("ERRO: SCRAPER_HMAC_SECRET nao definido no env");
  process.exit(1);
}

const BASE = process.env.SCRAPER_BASE_URL ?? "http://127.0.0.1:4001";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const intervalArg = args.find((a) => a.startsWith("--interval="));

const body = {};
if (dryRun) body.dryRun = true;
if (limitArg) body.limit = Number(limitArg.split("=")[1]);
if (intervalArg) body.intervalMs = Number(intervalArg.split("=")[1]);

const ts = Date.now().toString();
const bodyStr = JSON.stringify(body);
const sig = crypto
  .createHmac("sha256", SECRET)
  .update(`${ts}.${bodyStr}`)
  .digest("hex");

console.log(`> POST ${BASE}/whatsapp/lead-blast`);
console.log(`> body: ${bodyStr}`);
console.log(`> mode: ${dryRun ? "DRY-RUN (nao envia)" : "DISPARO REAL"}`);
console.log("");

try {
  const res = await fetch(`${BASE}/whatsapp/lead-blast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-spark-signature": sig,
      "x-spark-timestamp": ts,
    },
    body: bodyStr,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(parsed, null, 2));
  if (!res.ok) process.exit(1);
} catch (err) {
  console.error("ERRO:", err);
  process.exit(1);
}
