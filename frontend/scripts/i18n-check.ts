#!/usr/bin/env node
/**
 * scripts/i18n-check.ts
 *
 * Verifica que os JSONs de i18n estão consistentes:
 *   - Mesmas chaves em pt-BR, en, es (sem orfaos / sem faltantes)
 *   - Mesmos placeholders ({name}, {count}, etc) entre linguas
 *   - Sem chaves vazias ("")
 *
 * Uso:
 *   pnpm tsx scripts/i18n-check.ts
 *
 * Sai com exit code 1 se houver erro (pra rodar em CI).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "i18n", "messages");
const LOCALES = ["pt-BR", "en", "es"] as const;
const REFERENCE_LOCALE = "pt-BR";

type Issue = { locale: string; ns: string; path: string; reason: string };

function collectKeys(obj: unknown, prefix = ""): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof obj !== "object" || obj === null) {
    map.set(prefix, String(obj));
    return map;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const child = collectKeys(value, next);
      for (const [k, v] of child) map.set(k, v);
    } else {
      map.set(next, typeof value === "string" ? value : JSON.stringify(value));
    }
  }
  return map;
}

function extractPlaceholders(s: string): Set<string> {
  // ICU placeholders: {name}, {count, plural, ...}
  const set = new Set<string>();
  const re = /\{([a-zA-Z_$][\w$]*)(?:,\s*\w+(?:,[^}]*)?)?\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) set.add(m[1]!);
  return set;
}

async function main() {
  const issues: Issue[] = [];
  const namespaces = await fs.readdir(path.join(ROOT, REFERENCE_LOCALE));
  const nsNames = namespaces.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

  for (const ns of nsNames) {
    const localeData: Record<string, Map<string, string>> = {};
    for (const loc of LOCALES) {
      const filePath = path.join(ROOT, loc, `${ns}.json`);
      try {
        const raw = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        localeData[loc] = collectKeys(parsed);
      } catch (err) {
        issues.push({
          locale: loc,
          ns,
          path: "<root>",
          reason: `failed to read/parse: ${err instanceof Error ? err.message : String(err)}`,
        });
        localeData[loc] = new Map();
      }
    }

    const refKeys = new Set(localeData[REFERENCE_LOCALE]!.keys());

    for (const loc of LOCALES) {
      const keys = new Set(localeData[loc]!.keys());

      // Chaves no ref mas faltando neste locale
      for (const k of refKeys) {
        if (!keys.has(k)) {
          issues.push({ locale: loc, ns, path: k, reason: "MISSING (no PT-BR)" });
        }
      }

      // Chaves neste locale mas nao no ref (orfas — possivelmente lixo)
      for (const k of keys) {
        if (!refKeys.has(k)) {
          issues.push({ locale: loc, ns, path: k, reason: "ORPHAN (not in PT-BR)" });
        }
      }

      // Valores vazios
      for (const [k, v] of localeData[loc]!) {
        if (v.trim() === "") {
          issues.push({ locale: loc, ns, path: k, reason: "EMPTY value" });
        }
      }

      // Placeholders divergentes
      if (loc !== REFERENCE_LOCALE) {
        for (const k of refKeys) {
          const refVal = localeData[REFERENCE_LOCALE]!.get(k);
          const locVal = localeData[loc]!.get(k);
          if (!refVal || !locVal) continue;
          const refPh = extractPlaceholders(refVal);
          const locPh = extractPlaceholders(locVal);
          for (const p of refPh) {
            if (!locPh.has(p)) {
              issues.push({
                locale: loc,
                ns,
                path: k,
                reason: `MISSING PLACEHOLDER {${p}} (present in pt-BR)`,
              });
            }
          }
          for (const p of locPh) {
            if (!refPh.has(p)) {
              issues.push({
                locale: loc,
                ns,
                path: k,
                reason: `EXTRA PLACEHOLDER {${p}} (not in pt-BR)`,
              });
            }
          }
        }
      }
    }
  }

  if (issues.length === 0) {
    console.log("✅ i18n check: tudo consistente nos 3 idiomas.");
    process.exit(0);
  }

  console.error(`❌ i18n check: ${issues.length} problemas encontrados:\n`);
  const byLocale = new Map<string, Issue[]>();
  for (const i of issues) {
    if (!byLocale.has(i.locale)) byLocale.set(i.locale, []);
    byLocale.get(i.locale)!.push(i);
  }
  for (const [loc, list] of byLocale) {
    console.error(`\n[${loc}] ${list.length} problema(s):`);
    for (const i of list) {
      console.error(`  - ${i.ns}/${i.path}: ${i.reason}`);
    }
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
