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
const COUNTRY_ENUM = ["BR", "US"] as const;

// =================================================================
// Tools de produtos — disponíveis pra todos os agentes
// =================================================================
function buildProductTools(supabase: SupabaseClient, userId: string): ToolSet {
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
function buildViralTools(supabase: SupabaseClient, userId: string): ToolSet {
  return {
    ...buildProductTools(supabase, userId),
    search_virals: tool({
      description:
        "Busca vídeos que estão viralizando no TikTok Shop. Use sempre que a aluna pedir 'o que tá bombando', 'virais da semana', 'top vídeos'. Retorna criador, métricas (views, GMV em BRL), hook e URL clicável do TikTok.",
      inputSchema: z.object({
        niche: z
          .string()
          .optional()
          .describe(
            "Nicho do produto. Valores aceitos: beleza, saude, moda, casa, eletronicos, pet, fitness, acessorios, infantil, outros.",
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
      execute: async ({ niche, country, days, limit }) => {
        try {
          const safeNiche = niche && NICHE_ENUM.includes(niche as (typeof NICHE_ENUM)[number])
            ? (niche as (typeof NICHE_ENUM)[number])
            : undefined;
          const safeCountry = country === "US" ? "US" : "BR";
          const safeDays = ([7, 14, 30, 90] as const).includes(days as 7 | 14 | 30 | 90)
            ? (days as 7 | 14 | 30 | 90)
            : 7;
          const safeLimit = Math.min(Math.max(limit ?? 10, 1), 20);
          // Fallback: se filtro de nicho zera, tenta sem niche (mostra geral)
          let data = await searchVyralVideos({
            niche: safeNiche,
            country: safeCountry,
            lastDays: safeDays,
            limit: safeLimit,
            sortBy: "views",
          });
          let fellBackToGeneral = false;
          if (data.videos.length === 0 && safeNiche) {
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

          return {
            ok: true,
            count: data.videos.length,
            fell_back_to_general: fellBackToGeneral,
            formatted_response,
            INSTRUCTION: fellBackToGeneral
              ? `Nicho '${safeNiche}' não tinha vídeos no período. Mostre o conteúdo de formatted_response (top virais geral) com intro: 'Não tem viral específico de ${safeNiche} agora, mas isso aqui está bombando no geral:' e termine com 'Quer focar em outro nicho?'`
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
        "Transcrição do vídeo viral. AINDA EM DESENVOLVIMENTO — não tente usar essa tool antes da feature estar pronta. Sempre retorna { available: false }. Quando a aluna pedir transcrição, fale que ainda não tem acesso direto e ofereça delegar pra Scripts gerar hooks inspirados.",
      inputSchema: z.object({
        video_id: z.string().describe("ID do vídeo (não usado nesta versão)."),
      }),
      execute: async () => {
        return {
          ok: false,
          available: false,
          error: "transcription_not_available_yet",
          INSTRUCTION:
            "A tool de transcrição ainda está em desenvolvimento. Sua resposta DEVE SER: 'Ainda não tenho acesso direto à transcrição completa desse vídeo — essa feature tá saindo do forno. Mas posso te passar pra Scripts gerar hooks inspirados nesse viral. Quer?'. PROIBIDO inventar uma transcrição, hooks ou estrutura. Nem como exemplo. Nada.",
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

  // Persiste a mensagem do usuário (com attachments JSON)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    const userContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);
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
    tools = buildViralTools(supabase, user.id);
  } else if (agent === "script") {
    tools = buildScriptTools(supabase, user.id);
  } else if (agent === "help") {
    tools = buildHelpTools(supabase, user.id);
  }

  const finalMessages = attachImages(messages, attachments);

  // Captura o erro real do streamText (vem via callback).
  let capturedError: string | null = null;
  const toolEvents: { name: string; ok?: boolean; error?: string }[] = [];

  // Abort signal — corta o stream com folga antes do maxDuration (60s)
  // pra conseguir devolver texto pro cliente em vez de cair em timeout.
  const abortController = new AbortController();
  const abortTimer = setTimeout(() => abortController.abort(), 55_000);

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages: finalMessages,
    tools,
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
            const text = part.text;
            if (text) {
              accumulated += text;
              controller.enqueue(encoder.encode(text));
            }
          } else if (part.type === "tool-call") {
            toolEvents.push({ name: part.toolName });
            console.log("[tool-call]", { agent, name: part.toolName, input: part.input });
          } else if (part.type === "tool-result") {
            const out = part.output as { ok?: boolean; error?: string } | undefined;
            toolEvents.push({ name: part.toolName, ok: out?.ok, error: out?.error });
            console.log("[tool-result]", {
              agent,
              name: part.toolName,
              ok: out?.ok,
              error: out?.error,
            });
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

        if (!accumulated.trim()) {
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
