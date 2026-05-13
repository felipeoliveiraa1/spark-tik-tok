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
        id: z.string().uuid().optional(),
        name: z.string().optional(),
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
          .url()
          .optional()
          .describe("URL pública da foto (se a aluna anexou no chat, use essa URL)."),
        category: z.string().optional(),
        target_audience: z.string().optional(),
        pain_points: z.array(z.string()).optional(),
        strengths: z.array(z.string()).optional(),
        price_range: z.string().optional(),
        competitors: z.array(z.string()).optional(),
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
          .enum(NICHE_ENUM)
          .optional()
          .describe("Nicho do produto. Omita pra overview geral."),
        country: z.enum(COUNTRY_ENUM).default("BR"),
        days: z
          .union([z.literal(7), z.literal(14), z.literal(30), z.literal(90)])
          .default(7),
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ niche, country, days, limit }) => {
        try {
          const data = await searchVyralVideos({
            niche,
            country,
            lastDays: days,
            limit,
            sortBy: "views",
          });
          return {
            ok: true,
            count: data.videos.length,
            videos: data.videos.map((v) => ({
              id: v.id,
              creator: v.creator,
              url: v.url,
              thumbnail: v.thumbnailUrl ?? null,
              country: v.country,
              niche: v.niche ?? null,
              hook: v.hookPreview ?? null,
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
        "Detalhes completos de um vídeo viral: transcrição estruturada (hook/problema/solução/CTA), métricas e link do produto. Use quando a aluna pedir 'mais info sobre o vídeo X'.",
      inputSchema: z.object({
        video_id: z.string().describe("ID do vídeo retornado por search_virals."),
      }),
      execute: async ({ video_id }) => {
        try {
          const data = await getVyralTranscription(video_id);
          return {
            ok: true,
            video_id: data.videoId,
            language: data.language,
            full_text: data.full,
            structure: {
              hook: data.structure.hook,
              problem: data.structure.problem ?? null,
              solution: data.structure.solution ?? null,
              cta: data.structure.cta ?? null,
            },
            context: data.contexto ?? null,
            template: data.template ?? null,
            insights: data.insights ?? [],
          };
        } catch (err) {
          const msg = err instanceof ScraperClientError ? err.message : "falha desconhecida";
          return { ok: false, error: msg };
        }
      },
    }),

    get_top_products: tool({
      description: "Top produtos vendendo no TikTok Shop por país e categoria.",
      inputSchema: z.object({
        country: z.enum(COUNTRY_ENUM).default("BR"),
        niche: z.enum(NICHE_ENUM).optional(),
      }),
      execute: async ({ country, niche }) => {
        try {
          const data = await getVyralTopProducts({ country, niche });
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
        product_id: z.string().uuid().optional(),
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
          .min(1),
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

  const fallback =
    "Tive uma instabilidade pra puxar os dados agora — tenta de novo em 1 minutinho ou reformula a pergunta.";

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages: finalMessages,
    tools,
    stopWhen: stepCountIs(6),
    maxOutputTokens: 8192,
    // Desliga o "thinking" do Gemini 2.5 Flash. Sem isso, o modelo consome todo
    // o budget de output em raciocínio interno e termina sem emitir texto.
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0,
          includeThoughts: false,
        },
      },
    },
    onError: ({ error }) => {
      console.error("[api/chat streamText error]", {
        agent,
        message: error instanceof Error ? error.message : String(error),
      });
    },
    onFinish: async ({ text, usage, finishReason }) => {
      const finalText = text?.trim() ? text : fallback;
      await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: finalText,
        tokens_in: usage?.inputTokens ?? null,
        tokens_out: usage?.outputTokens ?? null,
      });
      if (!text?.trim()) {
        console.warn("[api/chat] empty text from model", {
          agent,
          conversationId,
          finishReason,
          usage,
        });
      }
    },
  });

  return result.toTextStreamResponse();
}
