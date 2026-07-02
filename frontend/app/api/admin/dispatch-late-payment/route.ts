import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { sendEmail } from "@/lib/resend";
import { buildPagamentoAtrasadoEmail } from "@/lib/email-templates/pagamento-atrasado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/dispatch-late-payment — dispara email de pagamento em atraso
 * pra TODAS as alunas com plan_status = 'late'.
 *
 * Fluxo por aluna:
 *   1) checa dedup em email_events (kind=late_payment_broadcast + dedup_key do dia BRT)
 *   2) se ja enviou hoje → skipped_already_sent++
 *   3) senao → sendEmail via Resend + insert em email_events (reserva o slot)
 *   4) delay 200ms entre envios pra respeitar rate limit Resend (~5/s)
 *
 * Failures por aluna nao interrompem o loop — coletadas em errors[].
 */

const SEND_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Retorna YYYY-MM-DD no timezone BRT (UTC-3). */
function todayBrtDateStr(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type LateProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  plan_status: string | null;
  plan_next_payment: string | null;
  plan_renewed_at: string | null;
};

export async function POST(_req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const svc = getServiceClient();

  // 1) Busca todas as alunas com plan_status = 'late' + email valido
  const { data: rawProfiles, error: qErr } = await svc
    .from("profiles")
    .select("id, email, first_name, plan_status, plan_next_payment, plan_renewed_at")
    .eq("plan_status", "late")
    .not("email", "is", null);

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const profiles: LateProfile[] = ((rawProfiles as LateProfile[] | null) ?? []).filter(
    (p) => typeof p.email === "string" && p.email.trim().length > 0,
  );

  const total = profiles.length;
  const errors: Array<{ email: string; message: string }> = [];
  let sent = 0;
  let skippedAlreadySent = 0;

  if (total === 0) {
    return NextResponse.json({
      total: 0,
      sent: 0,
      skipped_already_sent: 0,
      errors: [],
    });
  }

  const dateStr = todayBrtDateStr();
  const kind = "late_payment_broadcast";
  const dedupKey = `${kind}:${dateStr}`;

  for (const profile of profiles) {
    const email = profile.email as string;

    try {
      // 2a) Dedup: ja enviou hoje pra essa aluna?
      const { data: existing, error: dedupErr } = await svc
        .from("email_events")
        .select("id")
        .eq("user_id", profile.id)
        .eq("kind", kind)
        .eq("dedup_key", dedupKey)
        .limit(1)
        .maybeSingle();

      if (dedupErr) {
        errors.push({ email, message: `dedup_check: ${dedupErr.message}` });
        continue;
      }

      if (existing) {
        skippedAlreadySent += 1;
        continue;
      }

      // 2b) Calcula daysLate (dias desde plan_next_payment)
      const anchor = profile.plan_next_payment ?? profile.plan_renewed_at ?? null;
      let daysLate: number | undefined;
      if (anchor) {
        const diff = Math.floor((Date.now() - new Date(anchor).getTime()) / 86400000);
        daysLate = diff > 0 ? diff : undefined;
      }

      // 2c) Monta email
      const updateUrl = "https://www.metodotts.app/conta";
      const built = buildPagamentoAtrasadoEmail({
        firstName: profile.first_name ?? "amiga",
        updateUrl,
        daysLate,
      });

      // 2d) Envia
      const result = await sendEmail({
        to: email,
        subject: built.subject,
        text: built.text,
        html: built.html,
        tags: [
          { name: "kind", value: kind },
          { name: "date", value: dateStr },
        ],
      });

      if (!result.ok) {
        errors.push({ email, message: `send: ${result.error}` });
        // delay mesmo em falha pra nao martelar Resend
        await sleep(SEND_DELAY_MS);
        continue;
      }

      // 2e) Registra em email_events (audit + dedup pra proximas execucoes)
      const { error: insertErr } = await svc.from("email_events").insert({
        user_id: profile.id,
        kind,
        sent_at: new Date().toISOString(),
        dedup_key: dedupKey,
        meta: {
          days_late: daysLate ?? null,
          plan_next_payment: profile.plan_next_payment,
          plan_renewed_at: profile.plan_renewed_at,
          resend_id: result.id,
          to: email,
        },
      });

      if (insertErr) {
        // Email ja foi enviado com sucesso — soh loga o erro de audit
        errors.push({ email, message: `audit_insert: ${insertErr.message}` });
      }

      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      errors.push({ email, message });
    }

    // Rate limit — 200ms entre envios (~5/s, folgado no limite Resend Pro)
    await sleep(SEND_DELAY_MS);
  }

  return NextResponse.json({
    total,
    sent,
    skipped_already_sent: skippedAlreadySent,
    errors,
  });
}
