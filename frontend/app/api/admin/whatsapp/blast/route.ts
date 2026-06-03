import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import {
  enqueueMotivationalBlast,
  enqueueOutbox,
  getServiceClient,
  pickNextMotivational,
} from "@/lib/whatsapp-campaigns";
import { renderMotivational } from "@/lib/whatsapp-templates/motivational";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/blast
 *
 * Body:
 *   {
 *     mode: "test_admin" | "all_active",
 *     test_phone?: string,    // requerido se mode=test_admin
 *     test_name?: string,
 *   }
 *
 *   - mode=test_admin: enfileira UMA mensagem so pro telefone informado
 *     (usado pra ver como vai chegar antes de disparar pra todas).
 *
 *   - mode=all_active: enfileira o proximo motivacional pra TODAS as
 *     alunas com whatsapp cadastrado + plan_active=true OR role=admin.
 *     Cadencia automatica de BLAST_INTERVAL_MS entre cada envio.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { user: adminUser } = guard;

  const supabase = getServiceClient();

  let body: {
    mode?: string;
    test_phone?: string;
    test_name?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // -------------------- MODO TESTE --------------------
  if (body.mode === "test_admin") {
    const phone = (body.test_phone ?? "").trim();
    const name = (body.test_name ?? "admin").trim();
    if (!phone) {
      return NextResponse.json({ error: "missing_test_phone" }, { status: 400 });
    }

    // No teste, escolhe o proximo template baseado no historico do admin
    // (pra ver progressão real). Usa o admin como user_id no outbox —
    // requer que o admin tenha um profile (todo admin tem).
    const entry = await pickNextMotivational(supabase, adminUser.id);
    const text = renderMotivational(entry, { firstName: name });

    const r = await enqueueOutbox(supabase, {
      userId: adminUser.id,
      phone,
      templateKey: entry.key,
      text,
      metadata: { campaign: "test_admin", theme: entry.theme },
      skipWeeklyLimit: true,
    });

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, reason: r.reason, template_key: entry.key, preview: text },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      outbox_id: r.outbox_id,
      template_key: entry.key,
      theme: entry.theme,
      preview: text,
      sticky_assigned: r.sticky_assigned,
      note: "Mensagem enfileirada. Aguarda ate 1min pro cron flush enviar.",
    });
  }

  // -------------------- MODO PRODUCAO (todas) --------------------
  if (body.mode === "all_active") {
    // Filtro: tem whatsapp + (plan_active OU é admin)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, plan_active, role")
      .not("whatsapp", "is", null)
      .or("plan_active.eq.true,role.eq.admin");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (profiles ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string | null,
      whatsapp: p.whatsapp as string | null,
    }));

    const campaign = `blast_${Date.now()}`;
    const result = await enqueueMotivationalBlast(supabase, users, {
      campaignKey: campaign,
    });

    return NextResponse.json({
      ok: true,
      campaign,
      total_users: users.length,
      ...result,
      note: `${result.enqueued} mensagens enfileiradas. Serao enviadas escalonadas (cadencia 4.5s) pelo cron flush.`,
    });
  }

  return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
}
