/**
 * Parser do bloco padronizado que os agentes GPT/Gemini geram no fim
 * da resposta. Aluna copia tudo (texto natural + bloco JSON delimitado)
 * e a gente extrai os campos.
 *
 * Formato esperado (um ou ambos os blocos podem aparecer):
 *
 *   ===FICHA TTS PRODUTO===
 *   ```json
 *   { ... }
 *   ```
 *   ===FIM===
 *
 *   ===ROTEIROS TTS===
 *   ```json
 *   { "title": "...", "scripts": [...] }
 *   ```
 *   ===FIM===
 *
 * Tolera variações: com ou sem ```json (fences), texto antes/depois,
 * espaços extras.
 */

export type ParsedProduct = {
  name: string;
  category: string;
  target_audience: string;
  price_range: string;
  seasonality: string;
  pain_points: string[];
  strengths: string[];
  competitors: string[];
  differentiators: string[];
  objections: string[];
  emotional_triggers: string[];
  usage_moments: string[];
  content_angles: string[];
  hook_ideas: string[];
};

export type ScriptStyle =
  | "fofoca"
  | "polemico"
  | "engracado"
  | "educativo"
  | "storytelling"
  | "comparacao"
  | "transformacao";

export type ParsedScriptItem = {
  style: ScriptStyle;
  hook: string;
  development: string;
  benefit: string;
  cta: string;
};

export type ParsedScripts = {
  title: string;
  scripts: ParsedScriptItem[];
};

export type ParseResult = {
  product?: ParsedProduct;
  scripts?: ParsedScripts;
  productError?: string;
  scriptsError?: string;
};

const VALID_STYLES: ScriptStyle[] = [
  "fofoca",
  "polemico",
  "engracado",
  "educativo",
  "storytelling",
  "comparacao",
  "transformacao",
];

const STR_FIELDS_PRODUCT = [
  "name",
  "category",
  "target_audience",
  "price_range",
  "seasonality",
] as const;

const ARRAY_FIELDS_PRODUCT = [
  "pain_points",
  "strengths",
  "competitors",
  "differentiators",
  "objections",
  "emotional_triggers",
  "usage_moments",
  "content_angles",
  "hook_ideas",
] as const;

// =================================================================
// EXTRACAO DE BLOCO — tolerante a variacoes do agente
// =================================================================

/**
 * Encontra um heading no texto baseado num nome de bloco (ex: "FICHA TTS
 * PRODUTO" ou "ROTEIROS TTS") e retorna o JSON {...} que vem depois dele.
 *
 * Aceita variacoes:
 *  - ===FICHA TTS PRODUTO===  (formato canonico)
 *  - Ficha TTS Produto         (sem === — case-insensitive)
 *  - **Ficha TTS Produto**     (markdown bold)
 *  - ## Ficha TTS Produto      (markdown heading)
 *  - ###FICHA TTS PRODUTO      (qualquer cerca decorativa)
 *
 * Depois do heading, procura o primeiro `{` e retorna ate o `}` que fecha
 * (com contagem de braces — JSON-aware, ignora chaves dentro de strings).
 * Nao depende de `===FIM===` no fim — opcional.
 */
function extractBlock(text: string, blockName: string): string | null {
  // Normaliza nome do bloco em palavras pra fazer match flexivel
  const words = blockName.split(/\s+/).map(escapeRegex).join("\\s+");
  // Padrao: opcionalmente cercado por =, #, *, espaco; case-insensitive
  const headingRe = new RegExp(
    `(?:^|\\n)[\\s=#*]*${words}[\\s=#*]*(?:\\n|$)`,
    "i",
  );
  const m = text.match(headingRe);
  if (!m || m.index === undefined) return null;

  // Procura primeiro `{` apos o heading
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const openIdx = rest.indexOf("{");
  if (openIdx === -1) return null;

  // Tambem rejeita se entre heading e o `{` ja aparecer OUTRO heading
  // (significa que esse bloco veio vazio ou no formato errado).
  const between = rest.slice(0, openIdx);
  if (/===/.test(between)) return null;

  // Conta braces pra achar o `}` que fecha — ignora chaves dentro de
  // strings JSON (com suporte a escape).
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = openIdx; i < rest.length; i++) {
    const ch = rest[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return rest.slice(openIdx, i + 1);
      }
    }
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =================================================================
// VALIDACAO MANUAL (sem zod pra evitar dep nova)
// =================================================================

function ensureString(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

function ensureArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
}

function parseProductJson(raw: string): { ok: true; data: ParsedProduct } | { ok: false; error: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      error: `JSON inválido: ${err instanceof Error ? err.message : "erro"}. Confere se o GPT gerou o bloco completo.`,
    };
  }

  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "JSON precisa ser um objeto." };
  }

  const o = obj as Record<string, unknown>;
  const name = ensureString(o.name);
  if (!name) {
    return { ok: false, error: "Campo 'name' obrigatório no JSON do produto." };
  }

  const data: ParsedProduct = {
    name,
    category: ensureString(o.category),
    target_audience: ensureString(o.target_audience),
    price_range: ensureString(o.price_range),
    seasonality: ensureString(o.seasonality),
    pain_points: ensureArray(o.pain_points),
    strengths: ensureArray(o.strengths),
    competitors: ensureArray(o.competitors),
    differentiators: ensureArray(o.differentiators),
    objections: ensureArray(o.objections),
    emotional_triggers: ensureArray(o.emotional_triggers),
    usage_moments: ensureArray(o.usage_moments),
    content_angles: ensureArray(o.content_angles),
    hook_ideas: ensureArray(o.hook_ideas),
  };

  return { ok: true, data };
}

function parseScriptsJson(raw: string): { ok: true; data: ParsedScripts } | { ok: false; error: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      error: `JSON de roteiros inválido: ${err instanceof Error ? err.message : "erro"}.`,
    };
  }

  if (!obj || typeof obj !== "object") {
    return { ok: false, error: "JSON de roteiros precisa ser um objeto." };
  }

  const o = obj as Record<string, unknown>;
  const rawScripts = o.scripts;
  if (!Array.isArray(rawScripts) || rawScripts.length === 0) {
    return { ok: false, error: "Campo 'scripts' precisa ser array com pelo menos 1 roteiro." };
  }

  const scripts: ParsedScriptItem[] = [];
  for (const [i, item] of rawScripts.entries()) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const styleRaw = ensureString(s.style).toLowerCase() as ScriptStyle;
    const style: ScriptStyle = VALID_STYLES.includes(styleRaw) ? styleRaw : "fofoca";
    const hook = ensureString(s.hook);
    const development = ensureString(s.development);
    const benefit = ensureString(s.benefit);
    const cta = ensureString(s.cta);

    if (!hook && !development && !benefit && !cta) {
      // Item totalmente vazio — pula
      continue;
    }

    // Pelo menos hook deve existir
    if (!hook) {
      return {
        ok: false,
        error: `Roteiro ${i + 1} sem 'hook'. Preencha pelo menos esse campo no JSON.`,
      };
    }

    scripts.push({ style, hook, development, benefit, cta });
  }

  if (scripts.length === 0) {
    return { ok: false, error: "Nenhum roteiro válido no array." };
  }

  return {
    ok: true,
    data: {
      title: ensureString(o.title),
      scripts,
    },
  };
}

// =================================================================
// API PUBLICA
// =================================================================

/**
 * Parseia o texto colado pela aluna. Retorna o que conseguiu extrair —
 * pode ter um, outro, ou ambos os blocos. Errors individuais por bloco.
 *
 * Caso retorne `{}` (nenhum bloco), o texto provavelmente não tem o
 * formato esperado — UI deve avisar.
 */
export function parseColaRapida(text: string): ParseResult {
  if (!text || text.trim().length === 0) return {};

  const result: ParseResult = {};

  const productBlock = extractBlock(text, "FICHA TTS PRODUTO");
  if (productBlock) {
    const parsed = parseProductJson(productBlock);
    if (parsed.ok) result.product = parsed.data;
    else result.productError = parsed.error;
  }

  const scriptsBlock = extractBlock(text, "ROTEIROS TTS");
  if (scriptsBlock) {
    const parsed = parseScriptsJson(scriptsBlock);
    if (parsed.ok) result.scripts = parsed.data;
    else result.scriptsError = parsed.error;
  }

  return result;
}

export { STR_FIELDS_PRODUCT, ARRAY_FIELDS_PRODUCT, VALID_STYLES };
