import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { callWhatsAppFlushNow, ScraperClientError } from "@/lib/scraper-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/flush — forca processamento imediato da fila.
 * Util pra nao esperar o setInterval do worker.
 */
export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const result = await callWhatsAppFlushNow();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScraperClientError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status ?? 502 },
      );
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "erro" },
      { status: 500 },
    );
  }
}
