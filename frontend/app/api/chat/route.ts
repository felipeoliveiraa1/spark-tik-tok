import { streamText, type ModelMessage } from "ai";
import { models } from "@/lib/ai";
import { SYSTEM_PROMPTS } from "@/lib/agent-prompts";
import { type AgentId } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  agent?: AgentId;
  messages?: ModelMessage[];
};

const VALID_AGENTS: AgentId[] = ["info", "viral", "script", "help"];

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const agent = body.agent && VALID_AGENTS.includes(body.agent) ? body.agent : "help";
  const messages = body.messages ?? [];

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "no_messages" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const result = streamText({
    model: models[agent],
    system: SYSTEM_PROMPTS[agent],
    messages,
    maxOutputTokens: 2048,
  });

  return result.toTextStreamResponse();
}
