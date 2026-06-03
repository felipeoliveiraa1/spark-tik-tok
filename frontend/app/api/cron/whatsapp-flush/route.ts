import { NextResponse } from "next/server";
import { flushOutbox, getServiceClient } from "@/lib/whatsapp-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/whatsapp-flush
 *
 * Chamado pelo Vercel Cron a cada 1 minuto. Processa ate 15 mensagens
 * pendentes maduras (scheduled_at <= now()) — chama Evo na instancia
 * correta de cada uma e marca status.
 *
 * Autenticacao: header `Authorization: Bearer <CRON_SECRET>` (Vercel
 * envia automaticamente em cron jobs). Se a env nao estiver setada,
 * aceita qualquer chamada (modo dev local).
 */

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return true; // dev sem segredo
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  console.log("[whatsapp-flush] iniciando...");
  const supabase = getServiceClient();
  const stats = await flushOutbox(supabase, 15);
  console.log(
    `[whatsapp-flush] done em ${Date.now() - start}ms — processed=${stats.processed} sent=${stats.sent} failed=${stats.failed} skipped=${stats.skipped}`,
  );

  return NextResponse.json({
    ok: true,
    ...stats,
    ran_at: new Date().toISOString(),
    elapsed_ms: Date.now() - start,
  });
}
