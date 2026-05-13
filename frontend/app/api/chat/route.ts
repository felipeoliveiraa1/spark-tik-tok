import { streamText, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { models } from "@/lib/ai";
import { SYSTEM_PROMPTS } from "@/lib/agent-prompts";
import { type AgentId } from "@/lib/agents";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  conversation_id?: string;
  messages?: ModelMessage[];
};

const VALID_AGENTS: AgentId[] = ["info", "viral", "script", "help"];

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

  // Agente Informação tem busca na web (Google Search nativo do Gemini).
  // Outros agentes não — economiza quota.
  const tools = agent === "info" ? { google_search: google.tools.googleSearch({}) } : undefined;

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages,
    tools,
    maxOutputTokens: 2048,
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
