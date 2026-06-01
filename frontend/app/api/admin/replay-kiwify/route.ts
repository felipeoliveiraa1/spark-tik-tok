import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/replay-kiwify
 *   body: { payload: object }  — JSON puro do webhook Kiwify (com ou sem
 *          envelope `{order: {...}}`). Pode colar do "Histórico de envios"
 *          do dashboard Kiwify.
 *
 * Reprocessa manualmente uma compra/renovação. Util quando o Kiwify nao
 * disparou o webhook ou ficamos sem receber por config errada.
 *
 * Estrategia: chama o proprio /api/webhooks/kiwify internamente com
 * signature valida calculada aqui. Reusa 100% do handler — idempotente
 * (event_id = order_id::event_type evita duplicacao).
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: { payload?: unknown };
  try {
    body = (await request.json()) as { payload?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  }

  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;
  if (!secret) {
    return NextResponse.json(
      { error: "KIWIFY_WEBHOOK_TOKEN nao configurado" },
      { status: 500 },
    );
  }

  // Calcula signature do mesmo jeito que o Kiwify
  const payloadStr = JSON.stringify(body.payload);
  const signature = createHmac("sha1", secret).update(payloadStr).digest("hex");

  // Chama o webhook handler interno
  const url = new URL(request.url);
  const webhookUrl = `${url.origin}/api/webhooks/kiwify?signature=${signature}`;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-replay": "1",
      },
      body: payloadStr,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(
      { status: res.status, ok: res.ok, webhook_response: data },
      { status: res.ok ? 200 : res.status },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown_error" },
      { status: 500 },
    );
  }
}
