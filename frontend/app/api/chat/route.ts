import { streamText, tool, stepCountIs, type ModelMessage, type ToolSet } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { models } from "@/lib/ai";
import { recordUsage } from "@/lib/ai-usage";
import { SYSTEM_PROMPTS } from "@/lib/agent-prompts";
import { type AgentId } from "@/lib/agents";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  searchVyralVideos,
  getVyralTranscription,
  getVyralTopProducts,
  ScraperClientError,
} from "@/lib/scraper-client";
// webSearch (lib/web-search.ts) existe mas está desativada por custo.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 90s pra acomodar: tool calling pesado do Scripts (Pro com ficha rica),
// scraper Playwright (15-25s), + retry transparente em caso de empty
// response. Vercel Pro plan suporta até 300s.
export const maxDuration = 90;

type Attachment = { url: string; mime?: string };
type ChatMention = { kind: "product"; id: string; label: string };

type Body = {
  conversation_id?: string;
  messages?: ModelMessage[];
  attachments?: Attachment[];
  mentions?: ChatMention[];
};

const VALID_AGENTS: AgentId[] = ["info", "viral", "script", "help"];

const NICHE_ENUM = [
  "beleza",
  "saude",
  "moda",
  "casa",
  "eletronicos",
  "pet",
  "fitness",
  "acessorios",
  "infantil",
  "outros",
] as const;
/**
 * Quando o Gemini esquece de passar `query` na tool search_virals (acontece
 * mesmo com prompt forte), o servidor olha a última mensagem do usuário e
 * extrai uma palavra-chave provável. Garante que "virais de academia"
 * sempre vire query="academia" mesmo se o modelo passar inputs vazios.
 *
 * Heurística: pega substantivos depois de palavras-gatilho ("de", "sobre",
 * "do nicho", "produtos de") OU palavras isoladas conhecidas como termos
 * de busca no Vyral.
 */
const KEYWORD_HINTS = [
  "academia",
  "musculacao",
  "musculação",
  "treino",
  "creatina",
  "whey",
  "suplemento",
  "skincare",
  "cabelo",
  "maquiagem",
  "perfume",
  "babyliss",
  "secador",
  "esmalte",
  "chinelo",
  "tenis",
  "tênis",
  "legging",
  "biquini",
  "biquíni",
  "vestido",
  "blusa",
  "calca",
  "calça",
  "bolsa",
  "mochila",
  "panela",
  "organizador",
  "luminaria",
  "luminária",
  "tapete",
  "celular",
  "fone",
  "carregador",
  "smartwatch",
  "pelucia",
  "pelúcia",
  "presente",
  "natal",
  "pascoa",
  "páscoa",
];

/**
 * Detecta se a última mensagem da aluna é um pedido de listar virais.
 * Quando true, forçamos toolChoice pra search_virals no streamText —
 * Gemini não tem escolha de inventar uma resposta direta.
 *
 * Retorna false pra saudações ("oi"), confirmações ("ok"), ações sobre
 * card já listado ("salva o #1", "detalhes do #3").
 */
function wantsViralList(text: string): boolean {
  if (!text || text.trim().length < 3) return false;
  const lower = text.toLowerCase().trim();

  // Saudações / conversa trivial → não força
  if (
    /^(oi+|ol[áa]+|hello|hi+|hey|bom\s+dia|boa\s+(tarde|noite)|tudo\s+bem|td\s+bem|valeu|obrigad[ao]|tchau|ate\s+logo|brigad[ao]|sim|n[aã]o|ok|certo|legal|show|massa|beleza\s+brigada)[\s.,!?]*$/i.test(
      lower,
    )
  ) {
    return false;
  }

  // Ações sobre cards JÁ MOSTRADOS → deixa modelo escolher a tool certa
  // (save_viral, get_viral_details). Sem \b no fim pra capturar "adicionar",
  // "salvar", "salva", "guardar", etc.
  if (
    /(salv|guarda|adicion|memoriz|biblioteca|detalh|transcri[çc][ãa]o|o\s+que\s+(ela|ele|a\s+criadora)\s+(diss|fal)|abre\s+(o|esse)\s+v[íi]deo|gera\s+(scripts|hooks))/i.test(
      lower,
    )
  ) {
    return false;
  }
  // Referência a card específico ("#3", "numero 5", "o segundo") → também
  // é ação sobre lista existente, não pedido de nova busca.
  if (/#\s*\d+|n[uú]mero\s+\d+|o\s+(primeiro|segundo|terceiro|quarto|quinto|sexto|setimo|s[eé]timo|oitavo|nono|decimo|d[eé]cimo)/i.test(lower)) {
    return false;
  }

  // Palavras-chave que indicam pedido de listagem de virais
  const triggers = [
    "viral",
    "bombando",
    "top",
    "tendência",
    "tendencia",
    "trend",
    "melhor",
    "mais vendendo",
    "mais vendido",
    "vendendo",
    "popular",
    "hit",
    "queria ver",
    "queria saber",
    "queria",
    "quero ver",
    "quero saber",
    "quero",
    "me mostr",
    "mostr",
    "pesquis",
    "busca",
    "procur",
    "no nicho",
    "do nicho",
    "no da",
    "no de",
    "do da",
    "do de",
    "tem (de|do)",
    "que tem",
    "outros",
    "mais",
  ];
  for (const t of triggers) {
    const re = new RegExp(`\\b${t}\\b`, "i");
    if (re.test(lower)) return true;
  }

  // Se não detectou ação específica, e a mensagem é curta com substantivo
  // típico de busca (beleza, fitness, suplemento, etc.), considera pedido
  const nicheTokens = [
    "beleza",
    "moda",
    "casa",
    "fitness",
    "academia",
    "saude",
    "saúde",
    "pet",
    "eletronicos",
    "eletrônicos",
    "acessorios",
    "acessórios",
    "infantil",
    "suplemento",
    "skincare",
    "cabelo",
    "maquiagem",
    "perfume",
    "tenis",
    "tênis",
  ];
  for (const t of nicheTokens) {
    if (lower.includes(t)) return true;
  }

  return false;
}

/**
 * Detecta se a aluna está confirmando uma ação de SALVAR após o agente
 * Info ter analisado um produto. Gemini Pro às vezes diz "estou salvando"
 * sem chamar save_product — esse helper força toolChoice quando true.
 */
function wantsSaveProduct(text: string, messageCount: number): boolean {
  if (!text || messageCount < 2) return false; // precisa ter análise anterior
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
  // Saudações ou pergunta direta — não força
  if (/^(oi+|ola|hi+|hey|bom\s+dia|boa\s+(tarde|noite))[\s.,!?]*$/i.test(lower)) {
    return false;
  }
  // Verbos explícitos de save
  if (/(\b|^)(salv|guard|adicion|armazen|memoriz|registr|grav)/i.test(lower)) {
    return true;
  }
  // Confirmações simples — só forçam se a mensagem é curta (< 20 chars)
  // e a anterior do agente parecia perguntar "quero salvar?".
  if (
    lower.length <= 25 &&
    /^(sim|claro|pode|isso|vamos|quero|por\s+favor|pfv|aceito)/i.test(lower)
  ) {
    return true;
  }
  return false;
}

// Padrões de vazamento de tool calling do Gemini: em vez de fazer a tool
// call estruturada via API, o modelo às vezes "imagina" o código Python e
// emite como texto. Ex:
//   tool_code print(save_script(title='5 roteiros · Foo', product_id='...', scripts=[{...}]))
//   tool_code print(north_star.save_script(...))
// Esses regexes detectam isso pra a gente recuperar manualmente.
const TOOL_CODE_LEAK_REGEX = /tool_code\s+print\s*\([\s\S]*?save_script\s*\(([\s\S]*)\)\s*\)\s*$/i;

/**
 * Tenta extrair os params de uma chamada Python-style vazada em texto.
 * Retorna null se não conseguir parsear. Best-effort — se falhar, a aluna
 * vê o lixo no chat mas pelo menos não quebra.
 *
 * O Gemini gera com aspas simples (Python). Convertemos pra JSON válido
 * (aspas duplas) ANTES de chamar JSON.parse. Cuidado com aspas dentro de
 * strings (escapamos primeiro).
 */
function extractLeakedSaveScriptParams(text: string): {
  title: string;
  product_id?: string;
  scripts: Array<Record<string, unknown>>;
} | null {
  const match = text.match(TOOL_CODE_LEAK_REGEX);
  if (!match) return null;
  let inner = match[1].trim();
  // Tenta achar `scripts=[...]`
  const scriptsMatch = inner.match(/scripts\s*=\s*(\[[\s\S]+?\])\s*\)?\s*$/);
  const titleMatch = inner.match(/title\s*=\s*['"]([^'"]+)['"]/);
  const productIdMatch = inner.match(/product_id\s*=\s*['"]([^'"]+)['"]/);
  if (!scriptsMatch || !titleMatch) return null;

  // Converte Python literal pra JSON: troca aspas simples por duplas, mas
  // preserva apostrofes dentro de strings (best-effort).
  const pyToJson = (py: string): string => {
    // Estratégia: faz uma passada char-by-char trackeando se está dentro de string.
    // Quando encontra ' fora de string, troca por ". Quando dentro, mantém.
    let out = "";
    let inStr = false;
    let strChar = "";
    let escape = false;
    for (let i = 0; i < py.length; i++) {
      const c = py[i];
      if (escape) {
        out += c;
        escape = false;
        continue;
      }
      if (c === "\\") {
        out += c;
        escape = true;
        continue;
      }
      if (inStr) {
        if (c === strChar) {
          inStr = false;
          out += strChar === "'" ? '"' : c;
        } else if (c === '"' && strChar === "'") {
          // Aspa dupla dentro de string com ' — escapa
          out += '\\"';
        } else {
          out += c;
        }
      } else {
        if (c === "'" || c === '"') {
          inStr = true;
          strChar = c;
          out += '"';
        } else {
          out += c;
        }
      }
    }
    return out;
  };

  try {
    const scriptsJson = pyToJson(scriptsMatch[1]);
    const scripts = JSON.parse(scriptsJson) as Array<Record<string, unknown>>;
    return {
      title: titleMatch[1],
      product_id: productIdMatch?.[1],
      scripts,
    };
  } catch (err) {
    console.warn("[tool_code leak] parse failed", err);
    return null;
  }
}

/**
 * Última rede de segurança: parser de markdown dos roteiros gerados.
 *
 * Quando o Gemini NÃO chama save_script (nem estruturada, nem como
 * tool_code leak), os roteiros aparecem só como markdown na conversa
 * e somem ao recarregar. Esse parser extrai os 5 roteiros do texto
 * (formato fixo definido no SYSTEM_PROMPT.script) pra salvar manualmente.
 *
 * Formato esperado:
 *   **ROTEIRO 1 — Estilo: fofoca** (~30s)
 *   🎣 **Gancho** (3s)
 *   <texto>
 *   💡 **Desenvolvimento**
 *   <texto>
 *   ✨ **Benefício**
 *   <texto>
 *   💕 **CTA**
 *   <texto>
 *   ─────
 *   **ROTEIRO 2 — ...**
 */
function parseScriptsFromMarkdown(text: string): Array<{
  n: number;
  style: string;
  hook: string;
  development: string;
  benefit: string;
  cta: string;
}> {
  // Separa por separador ───── (ou similar) ou pelos marcadores ROTEIRO N
  // Mais robusto: regex que pega tudo entre `**ROTEIRO N — Estilo: X**` até
  // o próximo `**ROTEIRO N+1 —` ou fim.
  const blockRegex =
    /\*\*\s*ROTEIRO\s+(\d+)\s*[—–-]\s*Estilo:\s*([^*\n(]+?)\s*\*\*[\s\S]*?(?=\*\*\s*ROTEIRO\s+\d+\s*[—–-]|$)/gi;
  const results: Array<{
    n: number;
    style: string;
    hook: string;
    development: string;
    benefit: string;
    cta: string;
  }> = [];

  // Extrai bloco interno por emoji marker
  const extractByMarker = (block: string, marker: RegExp): string => {
    const matches = [...block.matchAll(marker)];
    if (matches.length === 0) return "";
    const m = matches[0];
    const startIdx = (m.index ?? 0) + m[0].length;
    // Pega até o próximo marker ou fim
    const rest = block.slice(startIdx);
    const nextMarker = rest.match(/(🎣|💡|✨|💕|─{3,})/);
    const end = nextMarker?.index ?? rest.length;
    return rest.slice(0, end).trim();
  };

  for (const m of text.matchAll(blockRegex)) {
    const n = parseInt(m[1], 10);
    const style = m[2].trim().toLowerCase();
    const block = m[0];

    const hook = extractByMarker(block, /🎣\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const development = extractByMarker(block, /💡\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const benefit = extractByMarker(block, /✨\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const cta = extractByMarker(block, /💕\s*\*\*[^*]*\*\*[^\n]*\n?/g);

    if (hook && development && benefit && cta) {
      results.push({ n, style, hook, development, benefit, cta });
    }
  }
  return results;
}

/**
 * Detecta se a aluna pediu explicitamente pra salvar os roteiros gerados.
 * Gemini Pro às vezes diz "salvei" sem chamar save_script de verdade —
 * esse helper força toolChoice quando true.
 */
function wantsSaveScript(text: string, messageCount: number): boolean {
  if (!text || messageCount < 2) return false;
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
  if (/^(oi+|ola|hi+|hey|bom\s+dia|boa\s+(tarde|noite))[\s.,!?]*$/i.test(lower)) {
    return false;
  }
  // "salve esses scripts", "guarda esses roteiros", "salva isso", etc
  if (/(\b|^)(salv|guard|adicion|armazen)/i.test(lower)) {
    return true;
  }
  return false;
}

const STOP_WORDS = new Set([
  "virais",
  "viral",
  "top",
  "hoje",
  "agora",
  "semana",
  "brasil",
  "tiktok",
  "nicho",
  "nichos",
  "produto",
  "produtos",
  "video",
  "videos",
]);

function deriveQueryFromMessage(text: string): string | undefined {
  if (!text) return undefined;
  const stripAccents = (s: string): string =>
    s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const lower = stripAccents(text);
  // 1) Palavras-chave conhecidas (academia, creatina, skincare…) — match direto
  for (const hint of KEYWORD_HINTS) {
    if (lower.includes(stripAccents(hint))) return hint;
  }
  // 2) Padrões mais específicos primeiro (alternation em regex tenta ESQUERDA→DIREITA).
  // "virais do nicho fitness" precisa casar "do nicho" antes de "virais do",
  // senão captura "nicho" em vez de "fitness".
  const patterns: RegExp[] = [
    /(?:do nicho|no nicho|sobre o nicho|nicho de|nicho do)\s+([a-z]{3,20})/i,
    /(?:produtos de|produtos do|produtos sobre|virais de|virais do|virais sobre)\s+([a-z]{3,20})/i,
    /(?:de|sobre)\s+([a-z]{3,20})/i,
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    if (m && !STOP_WORDS.has(m[1])) return m[1];
  }
  return undefined;
}

/**
 * Quando a aluna pede "do nicho X" ou menciona explicitamente um nicho do
 * enum (beleza, fitness, casa…), o filtro CORRETO é `niche`, não `query`.
 * Senão o Vyral tenta busca textual por "fitness" como palavra e devolve
 * cards que mencionam fitness sem ser do nicho.
 */
function deriveNicheFromMessage(text: string): (typeof NICHE_ENUM)[number] | undefined {
  if (!text) return undefined;
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const NICHE_SYNONYMS: Record<(typeof NICHE_ENUM)[number], string[]> = {
    beleza: ["beleza", "cosmetic", "makeup", "maquiagem", "skincare"],
    saude: ["saude", "suplemento", "vitamina"],
    moda: ["moda", "roupa", "vestuario"],
    casa: ["casa", "cozinha", "decoracao"],
    eletronicos: ["eletronico", "tecnologia", "gadget"],
    pet: ["pet", "cachorro", "gato", "petshop"],
    fitness: ["fitness", "academia", "treino", "musculacao"],
    acessorios: ["acessorio", "joia", "bijuteria"],
    infantil: ["infantil", "crianca", "bebe"],
    outros: [],
  };
  for (const [niche, words] of Object.entries(NICHE_SYNONYMS) as Array<
    [(typeof NICHE_ENUM)[number], string[]]
  >) {
    for (const w of words) {
      // Bate só como palavra inteira (evita "casa" dentro de "casamento")
      const re = new RegExp(`\\b${w}\\b`, "i");
      if (re.test(lower)) return niche;
    }
  }
  return undefined;
}

// COUNTRY_ENUM antes era usado em z.enum, mas agora aceitamos string e
// validamos com `=== "US"`. Mantemos a list só pra referência humana.
// const COUNTRY_ENUM = ["BR", "US"] as const;

// =================================================================
// Tools de produtos — disponíveis pra todos os agentes
// =================================================================
function buildProductTools(supabase: SupabaseClient, _userId: string): ToolSet {
  return {
    list_my_products: tool({
      description:
        "Lista os produtos que a aluna já salvou no Método TTS (id, nome, categoria, faixa de preço). Use sempre que ela mencionar 'meu produto X' ou pedir pra você lembrar do catálogo dela.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, category, price_range, target_audience, created_at")
          .order("created_at", { ascending: false });
        if (error) return { ok: false, error: error.message };
        return { ok: true, count: data?.length ?? 0, products: data ?? [] };
      },
    }),

    get_product: tool({
      description:
        "Pega a ficha completa de um produto salvo pela aluna. Passe id (UUID) OU name (busca aproximada por nome). Retorna dor, público-alvo, pontos fortes, faixa de preço, concorrentes, image_url.",
      inputSchema: z.object({
        id: z.string().optional().describe("UUID do produto."),
        name: z.string().optional().describe("Nome aproximado pra busca."),
      }),
      execute: async ({ id, name }) => {
        if (!id && !name) return { ok: false, error: "informe id ou name" };
        let query = supabase
          .from("products")
          .select(
            "id, name, image_url, category, target_audience, pain_points, strengths, price_range, competitors, created_at",
          );
        if (id) query = query.eq("id", id);
        else if (name) query = query.ilike("name", `%${name}%`);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!data) return { ok: false, error: "produto não encontrado" };
        return { ok: true, product: data };
      },
    }),
  };
}

// =================================================================
// Tools do agente Informação
// =================================================================
function buildInfoTools(supabase: SupabaseClient, userId: string): ToolSet {
  // NOTA: a tool `web_search` existe em lib/web-search.ts (Google CSE).
  // Desativada por escolha de custo — usamos só o conhecimento próprio
  // do Gemini (cutoff jan/2026). Pra reativar: descomenta o bloco abaixo
  // e seta GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID no Vercel.
  return {
    ...buildProductTools(supabase, userId),
    save_product: tool({
      description:
        "Salva uma ficha COMPLETA do produto pra aluna consultar em /produtos e referenciar em outros agentes. Chame SEMPRE que a aluna disser 'salva', 'guarda', 'adiciona'. TODOS os campos são obrigatórios — se você não tem certeza absoluta de algum, INFIRA baseado no que sabe do produto e do mercado BR. Pra arrays, sempre entregue 3-5 itens (hook_ideas: 5 hooks). Devolva 'Salvei a ficha completa! [Nome](/produtos/<id>) 💕' em markdown.",
      inputSchema: z.object({
        name: z.string().describe("Nome do produto. Ex: 'Figurinhas da Copa do Mundo 2026'."),
        image_url: z
          .string()
          .optional()
          .describe("URL pública da foto (se a aluna anexou no chat, passe a URL aqui)."),
        category: z.string().describe("Categoria principal. Ex: 'Colecionável sazonal', 'Skincare', 'Acessório tech'."),
        target_audience: z.string().describe("Público-alvo em 1-2 frases ricas. Idade, gênero, perfil emocional. Ex: 'Homens 25-45 fãs de futebol que colecionavam figurinhas na infância e querem reviver a nostalgia com os filhos.'"),
        pain_points: z.array(z.string()).min(3).max(5).describe("3-5 dores que o produto resolve. Frases curtas, diretas."),
        strengths: z.array(z.string()).min(3).max(5).describe("3-5 pontos fortes objetivos do produto."),
        price_range: z.string().describe("Faixa de preço esperada no BR. Ex: 'R$ 8 pacote / R$ 50+ raras'."),
        competitors: z.array(z.string()).min(2).max(5).describe("2-5 marcas/produtos concorrentes diretos no mercado BR."),
        differentiators: z.array(z.string()).min(3).max(5).describe("3-5 diferenciais ÚNICOS vs concorrentes. NÃO repita strengths — foque no que SÓ esse produto tem."),
        objections: z.array(z.string()).min(3).max(5).describe("3-5 objeções que a aluna precisa quebrar nos vídeos (motivos que fazem o cliente NÃO comprar). Escreva em 1ª pessoa do cliente. Ex: 'Vou gastar uma fortuna pra completar', 'Não tenho com quem trocar'."),
        emotional_triggers: z.array(z.string()).min(3).max(5).describe("3-5 gatilhos emocionais que movem a compra. Ex: 'Nostalgia da infância', 'FOMO de coleção sazonal', 'Status de colecionador'."),
        usage_moments: z.array(z.string()).min(2).max(4).describe("2-4 momentos/contextos de uso reais. Ex: 'Abrindo pacotes antes do jogo com amigos', 'Trocando no recreio/trabalho'."),
        content_angles: z.array(z.string()).min(3).max(5).describe("3-5 formatos/ângulos de vídeo recomendados. Ex: 'Unboxing surpresa', 'Reaction de figurinha rara', 'Antes/depois do álbum cheio'."),
        hook_ideas: z.array(z.string()).length(5).describe("EXATAMENTE 5 hooks prontos, curtos (até 80 chars), em PT-BR, prontos pra abrir um vídeo TikTok. Estilo Aline Moreira: direto, com gancho de curiosidade ou FOMO."),
        seasonality: z.string().describe("Sazonalidade em 1 frase. Quando vende mais e quando esfria. Ex: 'Pico nos 30 dias antes da Copa do Mundo, vendas caem 80% pós-evento'. Se não sazonal, escreva 'Demanda estável o ano todo, sem picos significativos.'"),
      }),
      execute: async (input) => {
        // DEDUP: se já existe produto com mesmo nome (ilike — case insensitive),
        // retorna o existente em vez de criar duplicado. Evita o bug onde
        // toolChoice forçado fazia o modelo chamar save_product 3x no mesmo turno.
        const nameTrim = input.name.trim().slice(0, 200);
        const { data: existing } = await supabase
          .from("products")
          .select("id, name")
          .eq("user_id", userId)
          .ilike("name", nameTrim)
          .maybeSingle();
        if (existing) {
          return {
            ok: true,
            id: existing.id,
            name: existing.name,
            url_path: `/produtos/${existing.id}`,
            already_existed: true,
          };
        }

        const { data, error } = await supabase
          .from("products")
          .insert({
            user_id: userId,
            name: nameTrim,
            image_url: input.image_url ?? null,
            category: input.category,
            target_audience: input.target_audience,
            pain_points: input.pain_points,
            strengths: input.strengths,
            price_range: input.price_range,
            competitors: input.competitors,
            differentiators: input.differentiators,
            objections: input.objections,
            emotional_triggers: input.emotional_triggers,
            usage_moments: input.usage_moments,
            content_angles: input.content_angles,
            hook_ideas: input.hook_ideas,
            seasonality: input.seasonality,
            raw_analysis: input,
          })
          .select("id, name")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id, name: data.name, url_path: `/produtos/${data.id}` };
      },
    }),
    update_product: tool({
      description:
        "Agrega informação a um produto JÁ salvo. Use quando a aluna pedir 'adiciona essa info', 'agrega isso', 'esqueci de falar X' sobre produto que já existe. Por default, arrays são MERGED (não substitui) — passe append=false só quando quiser SUBSTITUIR (ex: 'corrige a faixa de preço'). Sempre identifique o produto pelo id (use list_my_products ou get_product antes).",
      inputSchema: z.object({
        id: z.string().describe("UUID do produto a atualizar."),
        name: z.string().optional().describe("Mude só se a aluna pediu pra renomear."),
        image_url: z.string().optional(),
        category: z.string().optional(),
        target_audience: z
          .string()
          .optional()
          .describe("Substitui o público-alvo se a aluna trouxer novo recorte."),
        pain_points: z
          .array(z.string())
          .optional()
          .describe("Dores novas a ADICIONAR (default merge com as existentes)."),
        strengths: z
          .array(z.string())
          .optional()
          .describe("Pontos fortes a ADICIONAR (default merge)."),
        price_range: z.string().optional().describe("Substitui a faixa de preço."),
        competitors: z
          .array(z.string())
          .optional()
          .describe("Concorrentes a ADICIONAR (default merge)."),
        differentiators: z
          .array(z.string())
          .optional()
          .describe("Diferenciais novos a ADICIONAR (default merge)."),
        objections: z
          .array(z.string())
          .optional()
          .describe("Objeções novas a ADICIONAR (default merge)."),
        emotional_triggers: z
          .array(z.string())
          .optional()
          .describe("Gatilhos emocionais novos a ADICIONAR (default merge)."),
        usage_moments: z
          .array(z.string())
          .optional()
          .describe("Momentos de uso novos a ADICIONAR (default merge)."),
        content_angles: z
          .array(z.string())
          .optional()
          .describe("Ângulos de conteúdo novos a ADICIONAR (default merge)."),
        hook_ideas: z
          .array(z.string())
          .optional()
          .describe("Hooks novos a ADICIONAR (default merge). Não duplica."),
        seasonality: z.string().optional().describe("Substitui a sazonalidade."),
        append: z
          .boolean()
          .optional()
          .describe(
            "true (default): arrays viram merge com o que já tem. false: SUBSTITUI (use só pra correção).",
          ),
      }),
      execute: async (input) => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/products/${input.id}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json", cookie: "" },
            body: JSON.stringify(input),
          },
        ).catch(() => null);
        // Como esse fetch é server-to-server, o cookie de auth não vai —
        // mais simples chamar o supabase diretamente.
        void res; // descarta — abaixo usamos supabase direto
        const append = input.append !== false;
        const { data: current, error: readErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", input.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (readErr) return { ok: false, error: readErr.message };
        if (!current) return { ok: false, error: "produto não encontrado" };

        const ARRAY_FIELDS = [
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
        const SCALAR_FIELDS = [
          "name",
          "image_url",
          "category",
          "target_audience",
          "price_range",
          "seasonality",
        ] as const;
        const patch: Record<string, unknown> = {};
        for (const f of SCALAR_FIELDS) {
          if (input[f] !== undefined) patch[f] = input[f];
        }
        for (const f of ARRAY_FIELDS) {
          const incoming = input[f] as string[] | undefined;
          if (!incoming || incoming.length === 0) continue;
          const existing = ((current as Record<string, unknown>)[f] as string[] | null) ?? [];
          patch[f] = append
            ? Array.from(new Set([...existing, ...incoming]))
            : incoming;
        }
        if (Object.keys(patch).length === 0) {
          return { ok: false, error: "nada pra atualizar" };
        }
        patch.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from("products")
          .update(patch)
          .eq("id", input.id)
          .eq("user_id", userId)
          .select("id, name")
          .single();
        if (error) return { ok: false, error: error.message };
        return {
          ok: true,
          id: data.id,
          name: data.name,
          url_path: `/produtos/${data.id}`,
          updated_fields: Object.keys(patch).filter((k) => k !== "updated_at"),
        };
      },
    }),
  };
}

// =================================================================
// Tools do agente Virais
// =================================================================
function buildViralTools(
  supabase: SupabaseClient,
  userId: string,
  lastUserText: string,
): ToolSet {
  const fallbackQuery = deriveQueryFromMessage(lastUserText);
  const fallbackNiche = deriveNicheFromMessage(lastUserText);
  return {
    ...buildProductTools(supabase, userId),
    search_virals: tool({
      description:
        "Busca vídeos que estão viralizando no TikTok Shop. Use sempre que a aluna pedir 'o que tá bombando', 'virais da semana', 'top vídeos'. Retorna criador, métricas (views, GMV em BRL), hook e URL clicável do TikTok.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe(
            "Palavra-chave de busca livre (ex: 'academia', 'creatina', 'skincare'). Use quando a aluna mencionar um termo que NÃO bate exatamente com o enum de niche. Preferir query a niche pra termos específicos. Ex: 'virais de academia' → query: 'academia'.",
          ),
        niche: z
          .string()
          .optional()
          .describe(
            "Nicho amplo (só se a aluna falar exatamente um destes): beleza, saude, moda, casa, eletronicos, pet, fitness, acessorios, infantil, outros. Pra qualquer outra palavra, usa query.",
          ),
        country: z
          .string()
          .optional()
          .describe("País: BR ou US. Default BR."),
        days: z
          .number()
          .optional()
          .describe("Últimos N dias. Aceita 7, 14, 30 ou 90. Default 7."),
        limit: z
          .number()
          .optional()
          .describe("Máximo de vídeos retornados (1-20). Default 10."),
        sortBy: z
          .enum(["sales", "views", "revenue", "engagement", "recent"])
          .optional()
          .describe(
            "Critério de ordenação. Default 'sales' (mais vendido — é o que importa pra TikTok Shop).",
          ),
      }),
      execute: async ({ query, niche, country, days, limit, sortBy }) => {
        try {
          // Estratégia: SEMPRE usar QUERY textual no Vyral. O filtro categórico
          // por niche (pós-extração) zera quando o Vyral não classifica os
          // cards do feed top como nosso enum — a maioria dos top virais não
          // tem categoria "fitness" explícita, então niche=fitness zerava.
          //
          // Quando user fala "do nicho fitness", convertemos pra query="fitness"
          // (busca textual no Vyral, que retorna cards mencionando a palavra
          // no produto/caption).
          const nicheFromModel =
            niche && NICHE_ENUM.includes(niche as (typeof NICHE_ENUM)[number])
              ? (niche as (typeof NICHE_ENUM)[number])
              : undefined;

          // Query final em ordem de prioridade:
          //   1. Query explícita do modelo
          //   2. Query derivada da mensagem (KEYWORD_HINTS / regex "de X")
          //   3. Nicho explícito do modelo virando query
          //   4. Nicho derivado da mensagem virando query
          const safeQuery =
            (query?.trim() || undefined) ??
            fallbackQuery ??
            nicheFromModel ??
            fallbackNiche;
          // Mantemos safeNiche undefined pra pular o filtro pós-extração.
          // O Vyral já filtrou textualmente pra gente.
          const safeNiche: (typeof NICHE_ENUM)[number] | undefined = undefined;

          console.log("[search_virals] filtros resolvidos", {
            modelInput: { query, niche },
            fallback: { fallbackQuery, fallbackNiche },
            usado: { safeQuery, safeNiche },
            userText: lastUserText.slice(0, 120),
          });
          const safeCountry = country === "US" ? "US" : "BR";
          const safeDays = ([7, 14, 30, 90] as const).includes(days as 7 | 14 | 30 | 90)
            ? (days as 7 | 14 | 30 | 90)
            : 7;
          const safeLimit = Math.min(Math.max(limit ?? 10, 1), 20);
          // Default sales — é a métrica que importa pra TikTok Shop.
          // Felipe pediu explicitamente: ranqueia por quantos produtos
          // foram vendidos, não pelas views.
          const safeSortBy = (sortBy ?? "sales") as
            | "sales" | "views" | "revenue" | "engagement" | "recent";
          // Tenta uma busca direta. Auto-expand SÓ se count === 0 (não
          // tem cards no período pedido) — porque mesmo se vier 2 cards
          // só de fitness, eles são o que existe; expandir o período NÃO
          // muda o conjunto base do Vyral (mesmos 24 cards visíveis no
          // feed). Múltiplas tentativas estouravam o timeout do Vercel.
          let data = await searchVyralVideos({
            query: safeQuery,
            niche: safeNiche,
            country: safeCountry,
            lastDays: safeDays,
            limit: safeLimit,
            sortBy: safeSortBy,
          }).catch((err) => {
            console.warn(
              "[search_virals] scraper falhou — degradando pra resposta vazia (chat decide fallback)",
              err instanceof Error ? err.message : err,
            );
            return {
              query: { country: safeCountry, lastDays: safeDays, limit: safeLimit, sortBy: safeSortBy },
              fetchedAt: new Date().toISOString(),
              cached: false,
              total: 0,
              videos: [],
            };
          });
          const usedDays: 7 | 14 | 30 | 90 = safeDays;
          let fellBackToGeneral = false;

          // Se zerou e tinha filtro estrito, UMA única tentativa de fallback
          // pro feed geral. Removido o auto-expand de período pra não estourar
          // o timeout de 60s do Vercel — múltiplas scrapes (15-25s cada)
          // somavam e dava FUNCTION_INVOCATION_TIMEOUT.
          if (data.videos.length === 0 && (safeNiche || safeQuery)) {
            data = await searchVyralVideos({
              country: safeCountry,
              lastDays: safeDays,
              limit: safeLimit,
              sortBy: safeSortBy,
            }).catch(() => data);
            fellBackToGeneral = true;
          }
          // Se ainda 0, retorna {ok:true, count:0} com mensagem neutra.
          // PROIBIDO usar palavras "erro", "instabilidade", "falha", etc.
          if (data.videos.length === 0) {
            return {
              ok: true,
              count: 0,
              videos: [],
              formatted_response: "",
              INSTRUCTION:
                "Sem dado real pra esse filtro agora. SUA RESPOSTA: 'Tô finalizando uma análise nesses virais — em instantes consigo trazer fresh. Quer testar outro nicho ou um período diferente (14 ou 30 dias)?'. PROIBIDO inventar exemplos, criadores, métricas, ou usar palavras como 'erro', 'instabilidade', 'falha', 'fora do ar'.",
            };
          }

          // Formata os cards EM MARKDOWN no servidor (não deixa o Gemini fazer).
          // Garante que os campos são reais, vindos do scraper.
          const formatViews = (n: number): string => {
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
            return String(n);
          };
          const formatBrl = (n: number | null | undefined): string | null => {
            if (n == null) return null;
            return new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              maximumFractionDigits: 0,
            }).format(n);
          };

          const cards = data.videos.map((v, idx) => {
            const rank = v.rank ?? idx + 1;
            const productName = v.product?.name ?? "Sem produto identificado";
            const niche = v.niche ?? "";
            const lines: string[] = [];
            lines.push(`**#${rank} · ${productName}**${niche ? ` — ${niche}` : ""}`);
            if (v.thumbnailUrl) lines.push(`![produto](${v.thumbnailUrl})`);
            const metrics: string[] = [`@${v.creator}`];
            // Ordem: vendas primeiro (é o que ranqueia), depois views, likes, GMV.
            if (typeof v.metrics.sales === "number" && v.metrics.sales > 0) {
              metrics.push(`🛒 ${formatViews(v.metrics.sales)} vendas`);
            }
            metrics.push(`👁 ${formatViews(v.metrics.views)}`);
            if (v.metrics.likes > 0) metrics.push(`❤ ${formatViews(v.metrics.likes)}`);
            const gmv = formatBrl(v.metrics.estimatedRevenueBrl);
            if (gmv) metrics.push(`💰 ${gmv}`);
            lines.push(metrics.join(" · "));
            const quote = v.hookPreview || v.caption?.slice(0, 120);
            if (quote) lines.push(`> "${quote.replace(/\s+/g, " ").trim()}"`);
            lines.push(`[Abrir no TikTok](${v.url})`);
            return lines.join("\n\n");
          });
          const formatted_response = cards.join("\n\n");

          return {
            ok: true,
            count: data.videos.length,
            fell_back_to_general: fellBackToGeneral,
            used_days: usedDays,
            formatted_response,
            INSTRUCTION: fellBackToGeneral
              ? `Nicho '${safeNiche ?? safeQuery}' não tinha vídeos suficientes. Mostre formatted_response (top virais geral) com intro: 'Não tem viral específico de ${safeNiche ?? safeQuery} agora, mas isso aqui está bombando no geral:' e termine com 'Quer focar em outro nicho?'`
              : "Use EXATAMENTE o conteúdo de formatted_response como corpo da resposta. Adicione apenas uma intro curta (1 linha) antes e um outro curto (1 linha) depois — convidando a aluna a salvar ou ver detalhes. PROIBIDO modificar números, criadores, URLs dos cards.",
            videos: data.videos.map((v, idx) => ({
              id: v.id,
              rank: v.rank ?? idx + 1,
              creator: v.creator,
              creator_name: v.creatorName ?? null,
              creator_avatar: v.creatorAvatarUrl ?? null,
              url: v.url,
              thumbnail: v.thumbnailUrl ?? null,
              country: v.country,
              niche: v.niche ?? null,
              hook: v.hookPreview ?? null,
              caption: v.caption ?? null,
              posted_at: v.postedAt ?? null,
              views: v.metrics.views,
              likes: v.metrics.likes,
              // comments: NÃO retornamos — scraper não extrai esse campo hoje
              sales: v.metrics.sales ?? null,
              gmv_brl: v.metrics.estimatedRevenueBrl ?? null,
              product: v.product
                ? {
                    name: v.product.name,
                    shop_url: v.product.shopUrl ?? null,
                    price_brl: v.product.priceBrl ?? null,
                  }
                : null,
            })),
          };
        } catch (err) {
          const msg = err instanceof ScraperClientError ? err.message : "falha desconhecida";
          return { ok: false, error: msg };
        }
      },
    }),

    get_viral_details: tool({
      description:
        "Pega a TRANSCRIÇÃO REAL do vídeo viral (o que a criadora fala). Use quando a aluna pedir 'o que ela disse no vídeo', 'me mostra a transcrição', 'qual o gancho dela'. A resposta vem direto do painel — não invente nada baseado no título/hashtags.",
      inputSchema: z.object({
        video_id: z
          .string()
          .describe("ID do vídeo retornado por search_virals (campo 'id')."),
        search_query: z
          .string()
          .optional()
          .describe(
            "Palavra-chave do produto pra ajudar o scraper a localizar o vídeo no feed (ex: 'corretivo Luisance', 'creatina'). Use o nome do produto retornado em search_virals.",
          ),
      }),
      execute: async ({ video_id, search_query }) => {
        // Nunca propaga exceção pro agente. Sempre retorna `{ok: true}` —
        // com transcription preenchida ou vazia. O chat decide a mensagem.
        let transcription = "";
        let caption: string | null = null;
        let hookFirst: string | null = null;
        try {
          const data = await getVyralTranscription(video_id, search_query);
          transcription = data.full?.trim() ?? "";
          caption = data.contexto ?? null;
          hookFirst = data.structure.hook?.text ?? null;
        } catch (err) {
          console.warn(
            "[get_viral_details] scraper falhou — degradando pra empty",
            err instanceof ScraperClientError ? err.message : err,
          );
        }
        if (transcription.length < 10) transcription = "";

        // Se a aluna já salvou esse viral, persistimos a transcrição no
        // saved_virals dela pra ela conseguir consultar offline depois.
        if (transcription) {
          try {
            await supabase
              .from("saved_virals")
              .update({
                transcription,
                transcription_fetched_at: new Date().toISOString(),
              })
              .eq("user_id", userId)
              .eq("source_video_id", video_id);
          } catch (err) {
            console.warn("[get_viral_details] update transcription failed", err);
          }
        }

        return {
          ok: true,
          video_id,
          language: "pt-BR",
          transcription,
          caption,
          hook_first_sentence: hookFirst,
        };
      },
    }),

    save_viral: tool({
      description:
        "Guarda um vídeo viral na biblioteca da aluna (em /virais). Use SEMPRE que a aluna disser 'salva esse', 'quero trabalhar com esse vídeo', 'guarda na minha biblioteca', 'adiciona o #N'. Passe TODOS os campos do vídeo que vieram em search_virals/get_viral_details — não invente nada. Devolva [Ver na biblioteca](/virais/<id>) em markdown depois.",
      inputSchema: z.object({
        source_video_id: z.string().describe("ID original retornado por search_virals."),
        url: z.string().describe("URL pública do TikTok."),
        thumbnail_url: z.string().optional(),
        rank: z.number().optional().describe("Posição no top, se vier."),
        creator: z.string().optional().describe("@handle do criador."),
        creator_name: z.string().optional(),
        creator_avatar_url: z.string().optional(),
        country: z.string().optional(),
        niche: z.string().optional(),
        caption: z.string().optional().describe("Legenda completa do post."),
        hook: z.string().optional(),
        views: z.number().optional(),
        likes: z.number().optional(),
        sales: z
          .number()
          .optional()
          .describe("Quantidade de produtos vendidos (vem de search_virals)."),
        shares: z.number().optional().describe("@deprecated — use sales."),
        gmv_brl: z.number().optional().describe("Receita estimada em BRL."),
        product_name: z.string().optional(),
        product_shop_url: z.string().optional(),
        product_price_brl: z.number().optional(),
        product_id: z
          .string()
          .optional()
          .describe(
            "UUID de produto existente. Se omitido E product_name vier, criamos um produto novo automaticamente.",
          ),
        transcription: z
          .string()
          .optional()
          .describe(
            "Transcrição completa do vídeo, se já tiver vindo de get_viral_details. Salva junto pra histórico permanente.",
          ),
      }),
      execute: async (input) => {
        // 1) Auto-criar produto se a aluna ainda não tem um com esse nome.
        //    Quando ela salva um viral, queremos que o produto vendido apareça
        //    em /produtos automaticamente — assim ela pode pedir scripts pra
        //    ele sem ter que cadastrar manualmente.
        let productId = input.product_id ?? null;
        if (!productId && input.product_name && input.product_name.trim()) {
          const nameTrim = input.product_name.trim().slice(0, 200);
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("user_id", userId)
            .ilike("name", nameTrim)
            .maybeSingle();
          if (existing?.id) {
            productId = existing.id;
          } else {
            const { data: created, error: prodErr } = await supabase
              .from("products")
              .insert({
                user_id: userId,
                name: nameTrim,
                image_url: input.thumbnail_url ?? null,
                category: input.niche ?? null,
                raw_analysis: {
                  source: "viral_save",
                  source_video_id: input.source_video_id,
                  shop_url: input.product_shop_url ?? null,
                  price_brl: input.product_price_brl ?? null,
                  creator: input.creator ?? null,
                  hook: input.hook ?? null,
                },
              })
              .select("id")
              .single();
            if (!prodErr && created?.id) productId = created.id;
          }
        }

        const payload: Record<string, unknown> = {
          user_id: userId,
          source_video_id: input.source_video_id,
          product_id: productId,
          url: input.url,
          thumbnail_url: input.thumbnail_url ?? null,
          rank: input.rank ?? null,
          creator: input.creator ?? null,
          creator_avatar_url: input.creator_avatar_url ?? null,
          country: input.country ?? null,
          niche: input.niche ?? null,
          caption: input.caption ?? null,
          hook: input.hook ?? null,
          views: input.views ?? null,
          likes: input.likes ?? null,
          shares: input.shares ?? null,
          sales: input.sales ?? null,
          estimated_revenue_brl: input.gmv_brl ?? null,
          product_name: input.product_name ?? null,
          product_shop_url: input.product_shop_url ?? null,
          product_price_brl: input.product_price_brl ?? null,
          raw: input,
        };
        // Se a transcrição já veio (caller chamou get_viral_details antes), grava.
        // Senão, vamos tentar puxar agora síncrono.
        let transcriptionToSave =
          input.transcription && input.transcription.trim().length > 0
            ? input.transcription.trim()
            : null;

        if (!transcriptionToSave) {
          try {
            const data = await getVyralTranscription(
              input.source_video_id,
              input.product_name,
              { timeoutMs: 22_000 },
            );
            if (data?.full && data.full.trim().length >= 10) {
              transcriptionToSave = data.full.trim();
            }
          } catch (err) {
            console.warn(
              "[save_viral] transcricao síncrona falhou — viral salvo sem transcrição",
              err instanceof Error ? err.message : err,
            );
          }
        }

        if (transcriptionToSave) {
          payload.transcription = transcriptionToSave;
          payload.transcription_fetched_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from("saved_virals")
          .upsert(payload, { onConflict: "user_id,source_video_id" })
          .select("id")
          .single();
        if (error) return { ok: false, error: error.message };
        return {
          ok: true,
          id: data.id,
          url_path: `/virais/${data.id}`,
          product_id: productId,
          product_created: !!(productId && !input.product_id),
          has_transcription: !!transcriptionToSave,
        };
      },
    }),

    list_saved_virals: tool({
      description:
        "Lista os virais que a aluna já salvou na biblioteca (id, criador, hook, GMV, thumbnail). Use quando ela perguntar 'quais virais eu salvei?' ou 'mostra meus virais'.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("saved_virals")
          .select(
            "id, source_video_id, url, thumbnail_url, creator, niche, hook, views, estimated_revenue_brl, product_name, saved_at",
          )
          .order("saved_at", { ascending: false });
        if (error) return { ok: false, error: error.message };
        return { ok: true, count: data?.length ?? 0, virais: data ?? [] };
      },
    }),

    get_top_products: tool({
      description: "Top produtos vendendo no TikTok Shop por país e categoria.",
      inputSchema: z.object({
        country: z.string().optional().describe("BR ou US. Default BR."),
        niche: z
          .string()
          .optional()
          .describe(
            "Nicho: beleza, saude, moda, casa, eletronicos, pet, fitness, acessorios, infantil, outros.",
          ),
      }),
      execute: async ({ country, niche }) => {
        try {
          const safeCountry = country === "US" ? "US" : "BR";
          const safeNiche = niche && NICHE_ENUM.includes(niche as (typeof NICHE_ENUM)[number])
            ? (niche as (typeof NICHE_ENUM)[number])
            : undefined;
          const data = await getVyralTopProducts({ country: safeCountry, niche: safeNiche });
          return {
            ok: true,
            count: data.products.length,
            products: data.products.map((p) => ({
              rank: p.rank,
              name: p.name,
              category: p.category,
              gmv_brl: p.estimatedRevenueBrl,
              video_count: p.videoCount,
              top_video_id: p.topVideoId ?? null,
            })),
          };
        } catch (err) {
          const msg = err instanceof ScraperClientError ? err.message : "falha desconhecida";
          return { ok: false, error: msg };
        }
      },
    }),
  };
}

// =================================================================
// Tools do agente Scripts
// =================================================================
function buildScriptTools(supabase: SupabaseClient, userId: string): ToolSet {
  return {
    ...buildProductTools(supabase, userId),
    list_saved_virais: tool({
      description:
        "Lista os virais que a aluna já salvou na biblioteca dela. Use quando ela disser 'inspirado nos meus virais', 'baseado no que salvei' ou similar — pra puxar contexto antes de gerar hooks.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("saved_virals")
          .select("id, source_video_id, creator, niche, hook, caption, product_name, views, likes, sales")
          .eq("user_id", userId)
          .order("saved_at", { ascending: false })
          .limit(20);
        if (error) return { ok: false, error: error.message };
        return { ok: true, virais: data ?? [] };
      },
    }),
    get_saved_viral: tool({
      description:
        "Pega TODOS os detalhes de um viral salvo (caption, hook, métricas, criador, URL). Use quando a aluna mencionar um viral específico — passa o ID que veio em list_saved_virais.",
      inputSchema: z.object({
        viral_id: z.string().describe("UUID do viral salvo."),
      }),
      execute: async ({ viral_id }) => {
        const { data, error } = await supabase
          .from("saved_virals")
          .select("*")
          .eq("user_id", userId)
          .eq("id", viral_id)
          .maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!data) return { ok: false, error: "not_found" };
        return { ok: true, viral: data };
      },
    }),
    save_script: tool({
      description:
        "Salva os ROTEIROS gerados pra aluna consultar em /scripts. Cada roteiro tem 4 blocos (gancho 3s, desenvolvimento, benefício, CTA) e um estilo (fofoca, polêmico, engraçado, educativo, storytelling, comparação, transformação). Chame SEMPRE que entregar o conjunto completo de roteiros. Devolva [Ver scripts](/scripts/<id>) em markdown.",
      inputSchema: z.object({
        title: z
          .string()
          .describe(
            "Título descritivo, ex: '5 roteiros · Figurinhas da Copa' ou '3 roteiros · Hidratante NAC'.",
          ),
        product_id: z.string().optional().describe("UUID do produto relacionado."),
        scripts: z
          .array(
            z.object({
              n: z.number().describe("Número sequencial do roteiro (1, 2, 3...)."),
              style: z
                .string()
                .describe(
                  "Estilo do roteiro. Um destes: fofoca, polemico, engracado, educativo, storytelling, comparacao, transformacao.",
                ),
              hook: z.string().describe("Gancho de até 3s. Frase curta, gera curiosidade ou contraste."),
              development: z
                .string()
                .describe("Desenvolvimento com analogia/explicação simples. 2-4 frases."),
              benefit: z.string().describe("Benefício REAL do produto, sem promessa milagrosa."),
              cta: z.string().describe("CTA leve incentivando compra. 1 frase curta."),
              duration_sec: z.number().optional().describe("Duração estimada em segundos (15/30/45/60)."),
            }),
          )
          .min(3)
          .describe("Array com 3-5 roteiros completos, um por estilo."),
      }),
      execute: async ({ title, product_id, scripts }) => {
        // Reaproveita a coluna `hooks` (jsonb) pra guardar os roteiros — sem
        // migration. O render detecta o formato (item com `development` → roteiro
        // completo; sem → hook legado).
        const { data, error } = await supabase
          .from("generated_scripts")
          .insert({
            user_id: userId,
            product_id: product_id ?? null,
            title,
            hooks: scripts,
            model: "gemini-flash-latest",
          })
          .select("id, title")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id, title: data.title, url_path: `/scripts/${data.id}` };
      },
    }),
  };
}

function buildHelpTools(supabase: SupabaseClient, userId: string): ToolSet {
  return buildProductTools(supabase, userId);
}

// =================================================================
// Anexa imagens à última mensagem do usuário (multimodal pro Gemini)
// =================================================================
function attachImages(messages: ModelMessage[], attachments: Attachment[]): ModelMessage[] {
  if (attachments.length === 0) return messages;
  const next = [...messages];
  const lastIdx = next.length - 1;
  const last = next[lastIdx];
  if (!last || last.role !== "user") return messages;

  const textPart =
    typeof last.content === "string"
      ? last.content
      : Array.isArray(last.content)
        ? last.content
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("\n")
        : "";

  next[lastIdx] = {
    role: "user",
    content: [
      { type: "text", text: textPart },
      ...attachments.map((a) => ({ type: "image" as const, image: new URL(a.url) })),
    ],
  };
  return next;
}

// =================================================================
// Mentions: expande @produto / @viral em contexto rico pro modelo
// =================================================================
async function expandMentionsContext(
  supabase: SupabaseClient,
  mentions: ChatMention[],
): Promise<string | null> {
  if (!mentions || mentions.length === 0) return null;

  const productIds = mentions.filter((m) => m.kind === "product").map((m) => m.id);
  if (productIds.length === 0) return null;

  const { data: pData } = await supabase
    .from("products")
    .select(
      "id, name, category, target_audience, pain_points, strengths, price_range, competitors, differentiators, objections, emotional_triggers, usage_moments, content_angles, hook_ideas, seasonality, image_url",
    )
    .in("id", productIds);

  type ArrayMaybe = string[] | string | null;
  const products = (pData ?? []) as Array<{
    id: string;
    name: string;
    category: string | null;
    target_audience: string | null;
    pain_points: ArrayMaybe;
    strengths: ArrayMaybe;
    price_range: string | null;
    competitors: ArrayMaybe;
    differentiators: ArrayMaybe;
    objections: ArrayMaybe;
    emotional_triggers: ArrayMaybe;
    usage_moments: ArrayMaybe;
    content_angles: ArrayMaybe;
    hook_ideas: ArrayMaybe;
    seasonality: string | null;
    image_url: string | null;
  }>;

  // Formata array (jsonb) como lista com bullet, ou null se vazio.
  const fmtList = (v: ArrayMaybe): string | null => {
    if (Array.isArray(v) && v.length > 0) return v.map((x) => `  · ${x}`).join("\n");
    if (typeof v === "string" && v.trim()) return `  · ${v}`;
    return null;
  };

  const blocks: string[] = [];

  for (const p of products) {
    const lines: string[] = [`### PRODUTO MENCIONADO: ${p.name}`];
    if (p.category) lines.push(`- Categoria: ${p.category}`);
    if (p.target_audience) lines.push(`- Público-alvo: ${p.target_audience}`);
    if (p.price_range) lines.push(`- Faixa de preço: ${p.price_range}`);
    if (p.seasonality) lines.push(`- Sazonalidade: ${p.seasonality}`);
    const pains = fmtList(p.pain_points);
    if (pains) lines.push(`- Dores que resolve:\n${pains}`);
    const strs = fmtList(p.strengths);
    if (strs) lines.push(`- Pontos fortes:\n${strs}`);
    const diffs = fmtList(p.differentiators);
    if (diffs) lines.push(`- Diferenciais únicos:\n${diffs}`);
    const objs = fmtList(p.objections);
    if (objs) lines.push(`- Objeções a quebrar:\n${objs}`);
    const triggers = fmtList(p.emotional_triggers);
    if (triggers) lines.push(`- Gatilhos emocionais:\n${triggers}`);
    const moments = fmtList(p.usage_moments);
    if (moments) lines.push(`- Momentos de uso:\n${moments}`);
    const angles = fmtList(p.content_angles);
    if (angles) lines.push(`- Ângulos de conteúdo:\n${angles}`);
    const hooks = fmtList(p.hook_ideas);
    if (hooks) lines.push(`- Hooks prontos da ficha:\n${hooks}`);
    const comps = fmtList(p.competitors);
    if (comps) lines.push(`- Concorrentes:\n${comps}`);
    if (p.image_url) lines.push(`- Foto: ${p.image_url}`);
    blocks.push(lines.join("\n"));
  }

  if (blocks.length === 0) return null;

  return [
    "CONTEXTO DAS MENÇÕES — a aluna citou esses itens com @ na mensagem.",
    "Use esses dados (e SÓ esses) pra fundamentar sua resposta sobre eles.",
    "Não invente nada além disso.",
    "",
    ...blocks,
  ].join("\n\n");
}

// =================================================================
// Handler
// =================================================================
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const conversationId = body.conversation_id;
  const messages = body.messages ?? [];
  const attachments = body.attachments ?? [];
  const mentions = body.mentions ?? [];

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversation_id_required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "no_messages" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .select("id, agent")
    .eq("id", conversationId)
    .maybeSingle();

  if (convErr || !conversation) {
    return new Response(JSON.stringify({ error: "conversation_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const agent = (VALID_AGENTS.includes(conversation.agent as AgentId)
    ? conversation.agent
    : "help") as AgentId;

  // Persiste a mensagem do usuário (com attachments JSON) e extrai o texto
  // pra usar como contexto na derivação de query da tool de virais.
  const lastMessage = messages[messages.length - 1];
  let lastUserText = "";
  if (lastMessage?.role === "user") {
    const userContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);
    lastUserText = userContent;
    await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: userContent,
      attachments: attachments.length > 0 ? attachments : null,
    });
  }

  // Monta toolset por agente
  let tools: ToolSet | undefined;
  if (agent === "info") {
    // IMPORTANTE: NÃO combinar google_search (provider-defined) com nossas
    // function tools — Gemini 2.5 Pro retorna warning e IGNORA as function
    // tools (incluindo save_product). Aluna ficava sem o produto salvo.
    // Modelo usa conhecimento próprio + dados do catálogo via tools.
    tools = buildInfoTools(supabase, user.id);
  } else if (agent === "viral") {
    tools = buildViralTools(supabase, user.id, lastUserText);
  } else if (agent === "script") {
    tools = buildScriptTools(supabase, user.id);
  } else if (agent === "help") {
    tools = buildHelpTools(supabase, user.id);
  }

  let finalMessages = attachImages(messages, attachments);

  // Mentions: se a aluna mencionou @produto/@viral, busca os dados completos
  // e injeta como mensagem system extra logo antes da última msg do usuário.
  // Isso dá pro agente (Scripts principalmente) o contexto completo pra
  // gerar hooks/análises baseados em fatos, sem precisar chamar tools.
  if (mentions.length > 0) {
    const ctx = await expandMentionsContext(supabase, mentions).catch(() => null);
    if (ctx) {
      const last = finalMessages[finalMessages.length - 1];
      finalMessages = [
        ...finalMessages.slice(0, -1),
        { role: "system", content: ctx },
        last,
      ];
    }
  }

  // AUTO-INJECT da ficha do produto pra Scripts. Faz match heurístico no
  // texto da última mensagem da aluna contra os produtos salvos dela. Se
  // encontrar match claro, injeta a ficha completa como se fosse @produto.
  // Resolve o caso onde a aluna escreve "scripts pro body suplex" sem @.
  // Não depende do modelo chamar list_my_products / get_product.
  if (agent === "script" && mentions.length === 0) {
    const { data: ownedProducts } = await supabase
      .from("products")
      .select(
        "id, name, category, target_audience, pain_points, strengths, price_range, competitors, differentiators, objections, emotional_triggers, usage_moments, content_angles, hook_ideas, seasonality, image_url",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ownedProducts && ownedProducts.length > 0) {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/[^\w\s]/g, " ");
      const STOPWORDS = new Set([
        "de",
        "da",
        "do",
        "das",
        "dos",
        "para",
        "pra",
        "com",
        "sem",
        "ou",
        "que",
        "o",
        "a",
        "os",
        "as",
        "um",
        "uma",
        "e",
        "no",
        "na",
        "em",
        "meu",
        "minha",
        "esse",
        "essa",
        "aquele",
        "aquela",
      ]);
      const msgTokens = new Set(
        normalize(lastUserText)
          .split(/\s+/)
          .filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
      );

      // Score: quantos tokens DISTINTOS do nome do produto aparecem na msg
      let best: { product: (typeof ownedProducts)[number]; score: number } | null = null;
      for (const p of ownedProducts) {
        const nameTokens = normalize(p.name)
          .split(/\s+/)
          .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
        if (nameTokens.length === 0) continue;
        let hits = 0;
        for (const t of nameTokens) if (msgTokens.has(t)) hits++;
        if (hits >= 2 || (nameTokens.length === 1 && hits === 1)) {
          // Match forte: 2+ tokens OU nome de 1 token batendo
          if (!best || hits > best.score) best = { product: p, score: hits };
        }
      }

      if (best) {
        // Injeta ficha completa como se fosse mention. Reusa o formatter
        // da função existente (expandMentionsContext) pra manter padrão.
        const ctx = await expandMentionsContext(supabase, [
          { kind: "product", id: best.product.id, label: best.product.name },
        ]).catch(() => null);
        if (ctx) {
          const intro = `\n[detecção automática] Identifiquei que a aluna está falando de "${best.product.name}". Use os dados abaixo. Se for outro produto, ela vai te corrigir.\n\n`;
          const last = finalMessages[finalMessages.length - 1];
          finalMessages = [
            ...finalMessages.slice(0, -1),
            { role: "system", content: intro + ctx },
            last,
          ];
          // Marca como mention sintética pra que o markdown parser saiba
          // o productId no fim (4ª camada de save).
          mentions.push({
            kind: "product",
            id: best.product.id,
            label: best.product.name,
          });
        }
      } else {
        // Sem match — passa só a lista resumida pra o modelo se virar.
        const lines = ownedProducts.map((p) => {
          const parts = [p.name];
          if (p.category) parts.push(`(${p.category})`);
          if (p.price_range) parts.push(`— ${p.price_range}`);
          return `• ID=${p.id} · ${parts.join(" ")}`;
        });
        const productsCtx = [
          "CATÁLOGO DA ALUNA — produtos que ela já tem salvos:",
          "",
          ...lines,
          "",
          "Se a aluna mencionar um produto em texto, identifica qual é dessa lista e pergunta uma confirmação curta ('é esse aqui, né? 💕') antes de chamar get_product e gerar.",
        ].join("\n");
        const last = finalMessages[finalMessages.length - 1];
        finalMessages = [
          ...finalMessages.slice(0, -1),
          { role: "system", content: productsCtx },
          last,
        ];
      }
    }
  }

  // Captura o erro real do streamText (vem via callback).
  let capturedError: string | null = null;
  const toolEvents: { name: string; ok?: boolean; error?: string }[] = [];
  // Quando search_virals retorna formatted_response, substituímos o texto
  // do modelo por essa resposta determinística — zero alucinação possível.
  let deterministicResponse: string | null = null;
  // Diferente de deterministicResponse (que SOBRESCREVE), appendResponse
  // é colado AO FINAL do que o modelo gerou. Usado pra confirmacoes que
  // nao devem apagar o conteudo (ex: salvar roteiros).
  let appendResponse: string | null = null;

  // Abort signal — corta o stream com folga antes do maxDuration (90s)
  // pra conseguir devolver texto pro cliente em vez de cair em timeout.
  const abortController = new AbortController();
  const abortTimer = setTimeout(() => abortController.abort(), 80_000);

  // Pra agente Virais: se a mensagem da aluna pede listagem de virais
  // (não saudação, não ação sobre card já mostrado), FORÇA o modelo a
  // chamar search_virals em vez de inventar resposta livre. Gemini Flash
  // tem mania de "responder direto" mesmo com prompt forte.
  const forceSearchVirals = agent === "viral" && wantsViralList(lastUserText);
  if (forceSearchVirals) {
    console.log("[api/chat] forçando toolChoice=search_virals", {
      lastUserText: lastUserText.slice(0, 100),
    });
  }

  // Pra agente Info: se a aluna confirmou salvar produto depois de já ter
  // recebido análise, FORÇA o modelo a chamar save_product. Sem isso o
  // Gemini Pro respondia "estou salvando" sem chamar a tool — o produto
  // nunca entrava no catálogo e a aluna ficava esperando.
  const forceSaveProduct =
    agent === "info" && wantsSaveProduct(lastUserText, messages.length);
  const forceSaveScript =
    agent === "script" && wantsSaveScript(lastUserText, messages.length);
  if (forceSaveProduct) {
    console.log("[api/chat] forçando toolChoice=save_product", {
      lastUserText: lastUserText.slice(0, 100),
      messages: messages.length,
    });
  }

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages: finalMessages,
    tools,
    toolChoice: forceSearchVirals
      ? { type: "tool", toolName: "search_virals" }
      : forceSaveProduct
        ? { type: "tool", toolName: "save_product" }
        : forceSaveScript
          ? { type: "tool", toolName: "save_script" }
          : undefined,
    // Quando força uma tool específica, limitamos a 1 step — o modelo chama
    // a tool e a resposta determinística substitui o texto. Sem isso, o
    // toolChoice forçado se aplica a cada step e o modelo chamava a mesma
    // tool 3x (bug: produto salvo 3x). Sem força → 3 steps pra permitir
    // chain (busca → analisa → responde).
    stopWhen: stepCountIs(
      forceSearchVirals || forceSaveProduct || forceSaveScript ? 1 : 3,
    ),
    maxOutputTokens: 8192,
    // Temperature 0 pro Virais — modelo SÓ copia formatted_response da tool.
    // Scripts pode ficar criativo. Info/Help meio termo.
    temperature: agent === "viral" ? 0 : agent === "script" ? 0.7 : 0.2,
    abortSignal: abortController.signal,
    providerOptions: {
      google: {
        // Gemini 2.5 Pro EXIGE thinking mode (budget >0). Flash funciona com 0
        // (mais rápido, sem thinking). Pra cada agente, calibra de acordo:
        //   - info/script (Pro): budget pequeno (256 tokens) — pensa pouco mas
        //     respeita a API. Mais qualidade e ainda rápido.
        //   - viral/help (Flash): 0 — sem thinking, latência mínima.
        thinkingConfig:
          agent === "info" || agent === "script"
            ? { thinkingBudget: 256, includeThoughts: false }
            : { thinkingBudget: 0, includeThoughts: false },
      },
    },
    onError: ({ error }) => {
      const m = error instanceof Error ? error.message : String(error);
      capturedError = m;
      console.error("[api/chat streamText onError]", {
        agent,
        message: m,
        stack: error instanceof Error ? error.stack : undefined,
      });
    },
  });

  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // fullStream emite text-delta, tool-call, tool-result, error, finish.
        // Iteramos sobre tudo pra ter visibilidade total.
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            // Se já temos resposta determinística (tool com formatted_response),
            // ignoramos o que o modelo gera — vamos sobrescrever no fim.
            if (deterministicResponse) continue;
            const text = part.text;
            if (text) {
              accumulated += text;
              controller.enqueue(encoder.encode(text));
            }
          } else if (part.type === "tool-call") {
            toolEvents.push({ name: part.toolName });
            console.log("[tool-call]", { agent, name: part.toolName, input: part.input });
          } else if (part.type === "tool-result") {
            const out = part.output as
              | {
                  ok?: boolean;
                  error?: string;
                  formatted_response?: string;
                  count?: number;
                  fell_back_to_general?: boolean;
                  id?: string;
                  url_path?: string;
                  name?: string;
                  title?: string;
                }
              | undefined;
            toolEvents.push({ name: part.toolName, ok: out?.ok, error: out?.error });
            console.log("[tool-result]", {
              agent,
              name: part.toolName,
              ok: out?.ok,
              error: out?.error,
              count: out?.count,
              hasFormatted: !!out?.formatted_response,
            });

            // Resposta determinística: se a tool de virais retornou
            // formatted_response, monta a resposta no servidor sem deixar
            // o Gemini gerar texto. Garante 100% que cards são reais.
            // Resposta determinística pra get_viral_details: transcrição
            // vem direto do scrape (não deixa Gemini inventar quando a tool
            // falha ou retorna pouco texto).
            const detailsOut = out as
              | (typeof out & {
                  transcription?: string;
                  hook_first_sentence?: string;
                  caption?: string;
                })
              | undefined;
            if (part.toolName === "get_viral_details") {
              const t = detailsOut?.transcription?.trim() ?? "";
              if (detailsOut?.ok && t.length > 0) {
                const hook = detailsOut.hook_first_sentence;
                const cap = detailsOut.caption;
                let block = `**O que a criadora fala no vídeo (transcrição real):**\n\n> ${t.replace(/\s+/g, " ").trim()}\n`;
                if (hook && hook.trim().length > 0 && !t.includes(hook)) {
                  block += `\n**Hook (primeira frase):** "${hook.trim()}"\n`;
                }
                if (cap && cap.trim().length > 0) {
                  block += `\n**Caption do post:** ${cap.trim()}\n`;
                }
                block +=
                  "\nQuer que eu te passe pra Scripts gerar hooks inspirados nesse vídeo ou prefere ver outro?";
                deterministicResponse = block;
              } else {
                // Transcrição ainda não processada OU scrape degradado.
                // Mensagem neutra positiva — sem palavras proibidas.
                const cap = detailsOut?.caption?.trim();
                const capBlock =
                  cap && cap.length > 0
                    ? `\n\n**Caption do post:** ${cap}\n`
                    : "";
                deterministicResponse =
                  `Esse vídeo eu ainda tô finalizando a análise — vou trazer a transcrição completa em instantes.${capBlock}\n\nEnquanto isso, posso te passar pra Scripts gerar hooks com o que já temos da criadora e do produto?`;
              }
            }

            // Resposta determinística pra save_viral: garante que o link
            // /virais/<uuid> está correto (Gemini estava colocando o
            // source_video_id em vez do uuid retornado pela tool).
            if (
              part.toolName === "save_viral" &&
              out?.ok &&
              out.url_path
            ) {
              deterministicResponse = `Pronto, salvei na sua biblioteca 💕 [Ver agora](${out.url_path})\n\nQuer que eu te mostre detalhes desse vídeo ou bora pra outro?`;
            }
            // Resposta determinística pra save_product
            if (
              part.toolName === "save_product" &&
              out?.ok &&
              out.url_path
            ) {
              const name = out.name ?? "produto";
              deterministicResponse = `Salvinho aqui pra você 💖 [Ver ${name}](${out.url_path})\n\nQuer que eu te leve pra Scripts gerar hooks pra ele? ✨`;
            }
            // Resposta determinística pra update_product
            if (
              part.toolName === "update_product" &&
              out?.ok &&
              out.url_path
            ) {
              const name = out.name ?? "produto";
              deterministicResponse = `Anotei aqui na ficha 💕 [Ver ${name}](${out.url_path}) — atualizei pra você.\n\nMais alguma coisa pra agregar?`;
            }
            // save_script: APPENDA confirmação aos roteiros já gerados (não
            // sobrescreve, senão a aluna perde o conteudo visivel na conversa).
            if (
              part.toolName === "save_script" &&
              out?.ok &&
              out.url_path
            ) {
              const title = out.title ?? "roteiros";
              appendResponse = `\n\n---\n\n💕 Salvei os roteiros pra você acessar quando quiser → [Ver ${title}](${out.url_path})\n\nQuer mais variações com outro estilo ou prefere ir pra outro produto?`;
            }

            if (
              part.toolName === "search_virals" &&
              out?.formatted_response &&
              out.formatted_response.trim().length > 0
            ) {
              const richOut = out as typeof out & { used_days?: number };
              let intro = "Aqui está o que tá bombando no TikTok Shop:";
              if (richOut.fell_back_to_general) {
                intro =
                  "Não tinha viral específico pra esse nicho no período, mas isso aqui está bombando no geral:";
              }
              const outro =
                "Quer que eu salve algum desses na sua biblioteca ou veja detalhes? É só falar o número.";
              deterministicResponse = `${intro}\n\n${out.formatted_response}\n\n${outro}`;
            }
          } else if (part.type === "error") {
            const err = part.error;
            const m = err instanceof Error ? err.message : String(err);
            capturedError = m;
            console.error("[stream error part]", { agent, message: m });
          }
        }

        // `totalUsage` soma os tokens de TODOS os steps (quando há tool
        // calling com stopWhen=N, a chamada faz múltiplos rounds e cada
        // um conta). `usage` sozinho retorna só o último step — subestima
        // o custo real em até 5x quando o modelo chama tools.
        const [finishReason, usage] = await Promise.all([
          Promise.resolve(result.finishReason).catch(() => "unknown" as const),
          Promise.resolve(result.totalUsage)
            .catch(() => result.usage)
            .catch(() => ({ inputTokens: 0, outputTokens: 0 })),
        ]);

        // RECUPERAÇÃO DE TOOL CODE VAZADO. Gemini às vezes emite a chamada da
        // tool em formato Python literal no texto em vez de fazer a tool call
        // estruturada. Detecta e salva manualmente.
        if (
          agent === "script" &&
          !appendResponse &&
          !deterministicResponse &&
          accumulated.includes("tool_code") &&
          accumulated.includes("save_script")
        ) {
          const leaked = extractLeakedSaveScriptParams(accumulated);
          if (leaked) {
            console.warn("[tool_code leak] recuperando save_script manual", {
              agent,
              title: leaked.title,
              scriptsCount: leaked.scripts.length,
            });
            const { data: saved, error: saveErr } = await supabase
              .from("generated_scripts")
              .insert({
                user_id: user.id,
                product_id: leaked.product_id ?? null,
                title: leaked.title,
                hooks: leaked.scripts,
                model: "gemini-2.5-pro",
              })
              .select("id, title")
              .single();
            if (!saveErr && saved) {
              // Limpa o bloco tool_code do output e appenda o link
              accumulated = accumulated.replace(TOOL_CODE_LEAK_REGEX, "").trimEnd();
              appendResponse = `\n\n---\n\n💕 Salvei os roteiros pra você acessar quando quiser → [Ver ${saved.title}](/scripts/${saved.id})\n\nQuer mais variações com outro estilo?`;
            } else {
              console.error("[tool_code leak] insert falhou", saveErr);
            }
          } else {
            console.warn("[tool_code leak] detectado mas parse falhou", {
              agent,
              tail: accumulated.slice(-300),
            });
          }
        }

        // 4ª CAMADA — PARSER DE MARKDOWN. Se ainda não salvou e a resposta
        // tem 3+ roteiros formatados (ROTEIRO N — Estilo: X), salva pelo
        // parser. Garante que SE a aluna VIU os 5 roteiros no chat, eles
        // ESTÃO em /scripts. Funciona mesmo se o modelo só gerou texto
        // markdown sem nenhuma forma de tool call.
        if (
          agent === "script" &&
          !appendResponse &&
          !deterministicResponse &&
          /\*\*\s*ROTEIRO\s+\d+/i.test(accumulated)
        ) {
          const parsed = parseScriptsFromMarkdown(accumulated);
          if (parsed.length >= 3) {
            // Tenta pegar nome do produto pelas mentions (se houver) ou
            // usa título genérico.
            const productLabel =
              mentions.find((m) => m.kind === "product")?.label ?? "roteiros";
            const productId =
              mentions.find((m) => m.kind === "product")?.id ?? null;
            const title = `${parsed.length} roteiros · ${productLabel}`;
            console.warn(
              "[markdown parser] salvando roteiros sem tool call estruturada",
              { agent, count: parsed.length, title },
            );
            const { data: saved, error: saveErr } = await supabase
              .from("generated_scripts")
              .insert({
                user_id: user.id,
                product_id: productId,
                title,
                hooks: parsed,
                model: "gemini-2.5-pro",
              })
              .select("id, title")
              .single();
            if (!saveErr && saved) {
              appendResponse = `\n\n---\n\n💕 Salvei os roteiros pra você acessar quando quiser → [Ver ${saved.title}](/scripts/${saved.id})\n\nQuer mais variações com outro estilo?`;
            } else {
              console.error("[markdown parser] insert falhou", saveErr);
            }
          }
        }

        // Sobrescreve com a resposta determinística da tool (zero alucinação).
        if (deterministicResponse) {
          accumulated = deterministicResponse;
          controller.enqueue(encoder.encode(deterministicResponse));
          console.log("[api/chat] resposta determinística aplicada", {
            agent,
            len: deterministicResponse.length,
          });
        } else if (appendResponse && accumulated.trim()) {
          // Tem conteúdo do modelo + tool de confirmação: appenda no final.
          // Ex: roteiros gerados + "salvei pra você [link]".
          accumulated = accumulated + appendResponse;
          controller.enqueue(encoder.encode(appendResponse));
          console.log("[api/chat] resposta com append", {
            agent,
            baseLen: accumulated.length - appendResponse.length,
            appendLen: appendResponse.length,
          });
        } else if (appendResponse) {
          // Sem conteúdo do modelo, só a confirmação. Usa o append como fallback.
          const fallback = appendResponse.trimStart();
          accumulated = fallback;
          controller.enqueue(encoder.encode(fallback));
        } else if (!accumulated.trim()) {
          // Mensagem neutra positiva — sem palavras proibidas.
          // Log interno tem o motivo técnico.
          const summary =
            "Tô finalizando essa análise. Manda de novo em instantes ou me pede outra coisa — já consigo agora.";
          accumulated = summary;
          controller.enqueue(encoder.encode(summary));
          console.warn("[api/chat] empty model response", {
            agent,
            conversationId,
            finishReason,
            usage,
            hasTools: !!tools,
            capturedError,
            toolEvents,
          });
        } else {
          console.log("[api/chat] ok", {
            agent,
            finishReason,
            outputTokens: usage?.outputTokens,
            toolEvents: toolEvents.length,
          });
        }

        await supabase.from("conversation_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: accumulated,
          tokens_in: usage?.inputTokens ?? null,
          tokens_out: usage?.outputTokens ?? null,
        });

        // Tracking de uso/custo da IA por aluna (best-effort)
        const modelId =
          (models[agent] as { modelId?: string }).modelId ?? "unknown";
        await recordUsage({
          userId: user.id,
          agent,
          model: modelId,
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/chat] runtime error", {
          agent,
          conversationId,
          message,
          stack: err instanceof Error ? err.stack : undefined,
        });
        // Mensagem neutra pro usuário — log interno tem o detalhe técnico.
        const errText =
          "Tô finalizando o processamento dessa resposta. Em instantes te trago — tenta mandar de novo, ou me pede outra coisa que eu já consigo agora.";
        if (!accumulated) {
          controller.enqueue(encoder.encode(errText));
        }
        await supabase.from("conversation_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: accumulated || errText,
        });
      } finally {
        clearTimeout(abortTimer);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
