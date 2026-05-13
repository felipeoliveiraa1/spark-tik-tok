import { streamText, tool, stepCountIs, type ModelMessage, type ToolSet } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
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

type Body = {
  conversation_id?: string;
  messages?: ModelMessage[];
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

/**
 * Tools que o agente Virais pode chamar. Os nomes e descrições NUNCA mencionam
 * a fonte real dos dados (Vyral) — o modelo só vê "nossa base interna".
 */
function buildViralTools(): ToolSet {
  return {
    search_virals: tool({
      description:
        "Busca vídeos que estão viralizando agora no TikTok Shop. Use sempre que a aluna pedir 'o que tá bombando', 'virais da semana', 'top vídeos', etc. Retorna lista com criador, métricas (views, GMV em BRL), hook e URL clicável do vídeo no TikTok.",
      inputSchema: z.object({
        niche: z
          .enum(NICHE_ENUM)
          .optional()
          .describe("Nicho do produto. Omita se a aluna quer um overview geral."),
        country: z
          .enum(COUNTRY_ENUM)
          .default("BR")
          .describe("País. BR pra Brasil, US pra Estados Unidos."),
        days: z
          .union([z.literal(7), z.literal(14), z.literal(30), z.literal(90)])
          .default(7)
          .describe("Período em dias retroativos."),
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
        "Pega detalhes completos de um vídeo viral específico: transcrição estruturada (hook, problema, solução, CTA), métricas detalhadas e link do produto. Use depois que a aluna pedir 'me conta mais sobre o vídeo X' ou quando ela quiser estudar o gancho a fundo.",
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
      description:
        "Top produtos vendendo no TikTok Shop por país e categoria. Use quando a aluna perguntar 'o que tá vendendo em <categoria>' ou quiser comparar produtos.",
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
    });
  }

  // Tools por agente:
  // - info: Google Search nativo
  // - viral: search_virals / get_viral_details / get_top_products (chamam o scraper)
  // - script, help: sem tools
  let tools: ToolSet | undefined;
  if (agent === "info") {
    tools = { google_search: google.tools.googleSearch({}) };
  } else if (agent === "viral") {
    tools = buildViralTools();
  }

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages,
    tools,
    // Multi-step: deixa o modelo chamar tool, receber resultado, e responder.
    stopWhen: stepCountIs(5),
    maxOutputTokens: 4096,
    onFinish: async ({ text, usage }) => {
      await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: text,
        tokens_in: usage?.inputTokens ?? null,
        tokens_out: usage?.outputTokens ?? null,
      });
    },
  });

  return result.toTextStreamResponse();
}
