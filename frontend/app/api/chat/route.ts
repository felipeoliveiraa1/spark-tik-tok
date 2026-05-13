import { streamText, tool, stepCountIs, type ModelMessage, type ToolSet } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { models } from "@/lib/ai";
import { SYSTEM_PROMPTS } from "@/lib/agent-prompts";
import { type AgentId } from "@/lib/agents";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  searchVyralVideos,
  getVyralTranscription,
  getVyralTopProducts,
  ScraperClientError,
} from "@/lib/scraper-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Scraper Playwright leva 15-25s pra retornar a lista de virais. 60s dá
// margem pra tool rodar + modelo gerar texto final.
export const maxDuration = 60;

type Attachment = { url: string; mime?: string };

type Body = {
  conversation_id?: string;
  messages?: ModelMessage[];
  attachments?: Attachment[];
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

function deriveQueryFromMessage(text: string): string | undefined {
  if (!text) return undefined;
  const stripAccents = (s: string): string =>
    s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const lower = stripAccents(text);
  // Procura palavras-chave conhecidas no texto
  for (const hint of KEYWORD_HINTS) {
    if (lower.includes(stripAccents(hint))) return hint;
  }
  // Padrão "de <palavra>" ou "sobre <palavra>"
  const match = lower.match(/(?:de|sobre|do nicho|produtos de|virais de|virais do) ([a-z]{4,20})/i);
  if (match) {
    const word = match[1];
    // Ignora palavras genéricas
    if (["virais", "top", "hoje", "agora", "semana", "brasil", "tiktok"].includes(word)) {
      return undefined;
    }
    return word;
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
        "Lista os produtos que a aluna já salvou no Spark (id, nome, categoria, faixa de preço). Use sempre que ela mencionar 'meu produto X' ou pedir pra você lembrar do catálogo dela.",
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
  return {
    ...buildProductTools(supabase, userId),
    save_product: tool({
      description:
        "Salva uma nova ficha de produto pra aluna conseguir consultar depois em /produtos e referenciar em conversas com outros agentes. Chame SEMPRE que a aluna disser 'salva', 'guarda', 'adiciona aos meus produtos' ou similar. Devolva pra ela algo como 'Salvei! Você consulta em [Nome](/produtos/<id>)' usando markdown.",
      inputSchema: z.object({
        name: z.string().describe("Nome do produto."),
        image_url: z
          .string()
          .optional()
          .describe("URL pública da foto (se a aluna anexou no chat, passe essa URL aqui)."),
        category: z.string().optional(),
        target_audience: z.string().optional().describe("Público-alvo descrito em 1-2 frases."),
        pain_points: z.array(z.string()).optional().describe("Lista de dores que o produto resolve."),
        strengths: z.array(z.string()).optional().describe("Lista de pontos fortes."),
        price_range: z.string().optional().describe("Faixa de preço esperada no BR, ex: 'R$ 89-149'."),
        competitors: z.array(z.string()).optional().describe("Lista de marcas/produtos concorrentes."),
      }),
      execute: async (input) => {
        const { data, error } = await supabase
          .from("products")
          .insert({
            user_id: userId,
            name: input.name,
            image_url: input.image_url ?? null,
            category: input.category ?? null,
            target_audience: input.target_audience ?? null,
            pain_points: input.pain_points ?? null,
            strengths: input.strengths ?? null,
            price_range: input.price_range ?? null,
            competitors: input.competitors ?? null,
            raw_analysis: input,
          })
          .select("id, name")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id, name: data.name, url_path: `/produtos/${data.id}` };
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
      }),
      execute: async ({ query, niche, country, days, limit }) => {
        try {
          // Se o Gemini não passou query, derivamos da última mensagem do user.
          // Garante que "virais de academia" → query="academia" mesmo quando
          // o modelo "esquece" do prompt.
          const safeQuery =
            (query?.trim() || undefined) ?? fallbackQuery;
          if (!query?.trim() && fallbackQuery) {
            console.log("[search_virals] query derivada do user message", {
              fallbackQuery,
              lastUserText: lastUserText.slice(0, 120),
            });
          }
          // Quando temos query, IGNORA niche. A busca textual do Vyral já
          // é mais específica e categorias do Vyral nem sempre batem com
          // nosso enum. Gemini costuma passar ambos ("query+niche=beleza")
          // e isso fazia o filtro pós-extração zerar tudo.
          const safeNiche =
            !safeQuery && niche && NICHE_ENUM.includes(niche as (typeof NICHE_ENUM)[number])
              ? (niche as (typeof NICHE_ENUM)[number])
              : undefined;
          if (niche && safeQuery && niche !== safeQuery) {
            console.log("[search_virals] ignorando niche pq query está presente", {
              query: safeQuery,
              niche_ignorado: niche,
            });
          }
          const safeCountry = country === "US" ? "US" : "BR";
          const safeDays = ([7, 14, 30, 90] as const).includes(days as 7 | 14 | 30 | 90)
            ? (days as 7 | 14 | 30 | 90)
            : 7;
          const safeLimit = Math.min(Math.max(limit ?? 10, 1), 20);
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
            sortBy: "views",
          });
          let usedDays: 7 | 14 | 30 | 90 = safeDays;
          let fellBackToGeneral = false;

          // Se zerou E tem filtro estrito (niche ou query), tenta UMA
          // expansão maior antes do fallback geral.
          if (data.videos.length === 0 && (safeNiche || safeQuery)) {
            const expandTo: 7 | 14 | 30 | 90 = safeDays < 30 ? 30 : 90;
            data = await searchVyralVideos({
              query: safeQuery,
              niche: safeNiche,
              country: safeCountry,
              lastDays: expandTo,
              limit: safeLimit,
              sortBy: "views",
            });
            usedDays = expandTo;
          }

          // Se ainda zerou, cai pro feed geral sem filtros restritivos.
          if (data.videos.length === 0 && (safeNiche || safeQuery)) {
            data = await searchVyralVideos({
              country: safeCountry,
              lastDays: safeDays,
              limit: safeLimit,
              sortBy: "views",
            });
            fellBackToGeneral = true;
          }
          // Se ainda 0, retorna explicitamente vazio com instrução literal
          if (data.videos.length === 0) {
            return {
              ok: true,
              count: 0,
              videos: [],
              formatted_response: "",
              INSTRUCTION:
                "ZERO vídeos retornados pra esse filtro. SUA RESPOSTA DEVE SER LITERALMENTE: 'Tô sem dado real pra esse filtro agora. Quer testar 14 ou 30 dias, ou outro nicho?'. PROIBIDO inventar exemplos, criadores, métricas. Resposta curta, genérica, sem nomes.",
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

          const expandedPeriod = usedDays !== safeDays;
          return {
            ok: true,
            count: data.videos.length,
            fell_back_to_general: fellBackToGeneral,
            used_days: usedDays,
            expanded_period: expandedPeriod,
            formatted_response,
            INSTRUCTION: fellBackToGeneral
              ? `Nicho '${safeNiche}' não tinha vídeos suficientes. Mostre o conteúdo de formatted_response (top virais geral) com intro: 'Não tem viral específico de ${safeNiche} agora, mas isso aqui está bombando no geral:' e termine com 'Quer focar em outro nicho?'`
              : expandedPeriod
                ? `Período expandido pra ${usedDays} dias porque ${safeDays} dias tinha poucos cards do nicho. Mostre formatted_response com intro: 'Achei poucos virais de ${safeNiche} nos últimos ${safeDays} dias — então puxei dos últimos ${usedDays} dias pra ter mais variedade:' e outro 'Quer salvar algum ou ver detalhes?'.`
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
              comments: v.metrics.comments,
              shares: v.metrics.shares ?? null,
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
        try {
          const data = await getVyralTranscription(video_id, search_query);
          if (!data.full || data.full.trim().length < 10) {
            return {
              ok: false,
              error: "empty_transcription",
              INSTRUCTION:
                "Transcrição vazia ou indisponível pra esse vídeo. Resposta: 'A transcrição desse vídeo ainda não foi processada na base. Quer que eu te passe pra Scripts gerar hooks inspirados nele baseado no que sei (criador, métricas, caption)?'. PROIBIDO inventar uma transcrição.",
            };
          }
          return {
            ok: true,
            video_id: data.videoId,
            language: data.language,
            transcription: data.full,
            caption: data.contexto ?? null,
            hook_first_sentence: data.structure.hook?.text ?? null,
          };
        } catch (err) {
          const msg = err instanceof ScraperClientError ? err.message : "falha desconhecida";
          return {
            ok: false,
            error: msg,
            INSTRUCTION:
              "Tool retornou erro. Resposta: 'Tive uma instabilidade pra puxar a transcrição agora — tenta de novo em 1 min ou peço pra Scripts gerar hooks com base no que já temos.'. PROIBIDO inventar transcrição.",
          };
        }
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
        comments: z.number().optional(),
        shares: z.number().optional(),
        gmv_brl: z.number().optional().describe("Receita estimada em BRL."),
        product_name: z.string().optional(),
        product_shop_url: z.string().optional(),
        product_price_brl: z.number().optional(),
        product_id: z
          .string()
          .optional()
          .describe("UUID do produto da aluna que esse viral inspira (opcional)."),
      }),
      execute: async (input) => {
        const payload = {
          user_id: userId,
          source_video_id: input.source_video_id,
          product_id: input.product_id ?? null,
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
          comments: input.comments ?? null,
          shares: input.shares ?? null,
          estimated_revenue_brl: input.gmv_brl ?? null,
          product_name: input.product_name ?? null,
          product_shop_url: input.product_shop_url ?? null,
          product_price_brl: input.product_price_brl ?? null,
          raw: input,
        };
        const { data, error } = await supabase
          .from("saved_virals")
          .upsert(payload, { onConflict: "user_id,source_video_id" })
          .select("id")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, id: data.id, url_path: `/virais/${data.id}` };
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
    save_script: tool({
      description:
        "Salva a tabela de hooks gerada pra aluna conseguir consultar depois em /scripts. Chame SEMPRE que terminar uma tabela de hooks completa. Devolva o link [Ver scripts](/scripts/<id>) na sua resposta.",
      inputSchema: z.object({
        title: z.string().optional().describe("Título descritivo, ex: '10 hooks · Hidratante NAC'."),
        product_id: z.string().optional().describe("UUID do produto relacionado, se houver."),
        hooks: z
          .array(
            z.object({
              n: z.number().optional(),
              hook: z.string(),
              trigger: z.string().optional(),
              why: z.string().optional(),
              fire: z.string().optional(),
            }),
          )
          .describe("Array com a tabela de hooks gerada."),
      }),
      execute: async ({ title, product_id, hooks }) => {
        const { data, error } = await supabase
          .from("generated_scripts")
          .insert({
            user_id: userId,
            product_id: product_id ?? null,
            title: title ?? "10 hooks",
            hooks,
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
    tools = {
      google_search: google.tools.googleSearch({}),
      ...buildInfoTools(supabase, user.id),
    };
  } else if (agent === "viral") {
    tools = buildViralTools(supabase, user.id, lastUserText);
  } else if (agent === "script") {
    tools = buildScriptTools(supabase, user.id);
  } else if (agent === "help") {
    tools = buildHelpTools(supabase, user.id);
  }

  const finalMessages = attachImages(messages, attachments);

  // Captura o erro real do streamText (vem via callback).
  let capturedError: string | null = null;
  const toolEvents: { name: string; ok?: boolean; error?: string }[] = [];
  // Quando search_virals retorna formatted_response, substituímos o texto
  // do modelo por essa resposta determinística — zero alucinação possível.
  let deterministicResponse: string | null = null;

  // Abort signal — corta o stream com folga antes do maxDuration (60s)
  // pra conseguir devolver texto pro cliente em vez de cair em timeout.
  const abortController = new AbortController();
  const abortTimer = setTimeout(() => abortController.abort(), 55_000);

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

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages: finalMessages,
    tools,
    toolChoice: forceSearchVirals
      ? { type: "tool", toolName: "search_virals" }
      : undefined,
    stopWhen: stepCountIs(3),
    maxOutputTokens: 8192,
    // Temperature 0 pro Virais — modelo SÓ copia formatted_response da tool.
    // Scripts pode ficar criativo. Info/Help meio termo.
    temperature: agent === "viral" ? 0 : agent === "script" ? 0.7 : 0.2,
    abortSignal: abortController.signal,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0,
          includeThoughts: false,
        },
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
            if (
              part.toolName === "get_viral_details" &&
              detailsOut?.ok &&
              detailsOut.transcription
            ) {
              const t = detailsOut.transcription;
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
            }
            if (
              part.toolName === "get_viral_details" &&
              !detailsOut?.ok
            ) {
              deterministicResponse =
                "Não consegui puxar a transcrição desse vídeo agora — ele não está visível no feed atual ou a análise ainda não foi processada no nosso painel. Quer tentar outro vídeo, ou prefere que eu te passe pra Scripts gerar hooks inspirados nesse produto?";
            }

            // Resposta determinística pra save_viral: garante que o link
            // /virais/<uuid> está correto (Gemini estava colocando o
            // source_video_id em vez do uuid retornado pela tool).
            if (
              part.toolName === "save_viral" &&
              out?.ok &&
              out.url_path
            ) {
              deterministicResponse = `Salvei na sua biblioteca! [Ver agora](${out.url_path})\n\nQuer que eu te mostre detalhes desse vídeo ou bora pra outro?`;
            }
            // Resposta determinística pra save_product
            if (
              part.toolName === "save_product" &&
              out?.ok &&
              out.url_path
            ) {
              const name = out.name ?? "produto";
              deterministicResponse = `Salvei! [Ver ${name}](${out.url_path})\n\nQuer gerar scripts pra ele agora ou ver os virais que combinam?`;
            }
            // Resposta determinística pra save_script
            if (
              part.toolName === "save_script" &&
              out?.ok &&
              out.url_path
            ) {
              const title = out.title ?? "scripts";
              deterministicResponse = `Salvei! [Ver ${title}](${out.url_path})\n\nQuer que eu gere uma variação ou foca em outro produto?`;
            }

            if (
              part.toolName === "search_virals" &&
              out?.formatted_response &&
              out.formatted_response.trim().length > 0
            ) {
              const richOut = out as typeof out & {
                expanded_period?: boolean;
                used_days?: number;
              };
              let intro = "Aqui está o que tá bombando no TikTok Shop:";
              if (richOut.fell_back_to_general) {
                intro =
                  "Não tinha viral específico pra esse nicho no período, mas isso aqui está bombando no geral:";
              } else if (richOut.expanded_period && richOut.used_days) {
                intro = `Achei poucos virais nesse nicho nos últimos dias, então puxei dos últimos ${richOut.used_days} dias pra ter mais variedade:`;
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

        const [finishReason, usage] = await Promise.all([
          Promise.resolve(result.finishReason).catch(() => "unknown" as const),
          Promise.resolve(result.usage).catch(() => ({
            inputTokens: 0,
            outputTokens: 0,
          })),
        ]);

        // Sobrescreve com a resposta determinística da tool (zero alucinação).
        if (deterministicResponse) {
          accumulated = deterministicResponse;
          controller.enqueue(encoder.encode(deterministicResponse));
          console.log("[api/chat] resposta determinística aplicada", {
            agent,
            len: deterministicResponse.length,
          });
        } else if (!accumulated.trim()) {
          const summary = capturedError
            ? `⚠️ ${capturedError}`
            : `Não consegui formar uma resposta (motivo=${finishReason}, tokens_out=${usage?.outputTokens ?? "?"}, tools=${toolEvents.length})`;
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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[api/chat] runtime error", {
          agent,
          conversationId,
          message,
          stack: err instanceof Error ? err.stack : undefined,
        });
        const errText = `⚠️ Erro técnico: ${message.slice(0, 240)}`;
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
