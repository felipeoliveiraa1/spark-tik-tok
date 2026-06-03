import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { callWhatsAppBlast, ScraperClientError } from "@/lib/scraper-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/blast — proxy fino pro backend Contabo.
 *
 * Toda logica (enqueue, rotation 365, sticky, evo) roda no worker do
 * VPS. Aqui so validamos admin e repassamos.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { user: adminUser } = guard;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await callWhatsAppBlast({
      mode: body.mode as "test_admin" | "all_active",
      test_phone: typeof body.test_phone === "string" ? body.test_phone : undefined,
      test_name: typeof body.test_name === "string" ? body.test_name : undefined,
      admin_user_id: adminUser.id,
    });
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
