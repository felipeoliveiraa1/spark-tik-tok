import { NextResponse } from "next/server";
import { generateText } from "ai";
import { models } from "@/lib/ai";

/**
 * Quick smoke-test endpoint for the Gemini integration.
 *
 *   curl -X POST <site>/api/ai/ping -d '{"prompt":"diga oi"}' -H "content-type: application/json"
 *
 * Returns: { text, model, latencyMs }
 *
 * Remove this route once we have real agent endpoints landing — it has no
 * auth, no rate limit, and burns Gemini quota.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { prompt?: string };
  try {
    body = (await request.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "diga oi em uma frase, em pt-BR.";

  const started = Date.now();
  try {
    const result = await generateText({
      model: models.default,
      prompt,
      // Generous budget — gemini-flash-latest spends most tokens on internal
      // "thinking" before producing the answer; under-budgeting truncates it.
      maxOutputTokens: 1024,
    });

    return NextResponse.json({
      text: result.text,
      model: "gemini-flash-latest",
      tokens: result.usage,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "ai_failed", message }, { status: 500 });
  }
}
