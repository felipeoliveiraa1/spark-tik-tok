import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/admin/trials
 *
 * Trials ativos + KPIs por urgencia + funil de conversao.
 * Funil usa had_trial (migration 0029): true pra quem JA PASSOU por trial
 * em algum momento, mesmo que tenha virado pagante ou cancelado.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();

  // Trials ativos pra lista (ordenado por expiração mais próxima)
  const { data: trials, error } = await supabase
    .from("profiles")
    .select(
      "id, email, name, whatsapp, plan_status, plan_expires_at, created_at, last_seen_at",
    )
    .eq("plan_status", "trial")
    .eq("plan_active", true)
    .order("plan_expires_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    email: string;
    name: string | null;
    whatsapp: string | null;
    plan_status: string;
    plan_expires_at: string | null;
    created_at: string;
    last_seen_at: string | null;
  };

  const now = Date.now();
  const enriched = ((trials ?? []) as Row[]).map((r) => {
    const expiresAt = r.plan_expires_at ? new Date(r.plan_expires_at).getTime() : null;
    const hoursLeft = expiresAt ? Math.max(0, (expiresAt - now) / 3600_000) : null;
    const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null;
    const expired = expiresAt !== null && expiresAt < now;
    let urgency: "expired" | "today" | "soon" | "week" | "later";
    if (expiresAt === null) urgency = "later";
    else if (expired) urgency = "expired";
    else if (hoursLeft! < 24) urgency = "today";
    else if (hoursLeft! < 72) urgency = "soon";
    else if (hoursLeft! < 168) urgency = "week";
    else urgency = "later";

    return {
      ...r,
      hours_left: hoursLeft,
      days_left: daysLeft,
      expired,
      urgency,
    };
  });

  const kpis = {
    total: enriched.length,
    today: enriched.filter((r) => r.urgency === "today").length,
    soon: enriched.filter((r) => r.urgency === "soon").length,
    week: enriched.filter((r) => r.urgency === "week").length,
    later: enriched.filter((r) => r.urgency === "later").length,
    expired: enriched.filter((r) => r.urgency === "expired").length,
    com_whatsapp: enriched.filter((r) => r.whatsapp !== null).length,
  };

  // ===========================================================================
  // FUNIL DE CONVERSAO — usa had_trial (true pra todo mundo que passou por trial)
  // ===========================================================================
  const [
    totalHadTrial,
    convertidoPagante,
    convertidoLate,
    canceladoOuReembolsado,
    trialExpiradoTotal,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("had_trial", true)
      .or("role.is.null,role.neq.admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("had_trial", true)
      .eq("plan_status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("had_trial", true)
      .eq("plan_status", "late"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("had_trial", true)
      .in("plan_status", ["canceled", "refunded", "chargeback", "inactive"]),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan_status", "trial")
      .lt("plan_expires_at", new Date().toISOString()),
  ]);

  const total = totalHadTrial.count ?? 0;
  const pagantes = (convertidoPagante.count ?? 0) + (convertidoLate.count ?? 0);
  const cancelados = canceladoOuReembolsado.count ?? 0;
  const trialAtivos = enriched.filter((r) => !r.expired).length;
  const trialExpirados = trialExpiradoTotal.count ?? 0;
  const conversionRate = total > 0 ? Math.round((pagantes / total) * 100) : 0;

  return NextResponse.json({
    trials: enriched,
    kpis,
    funnel: {
      total_que_passou_trial: total,
      ativos_agora: trialAtivos,
      expirados_total: trialExpirados,
      converteram_pagante: pagantes,
      cancelaram_ou_reembolso: cancelados,
      conversion_rate_pct: conversionRate,
    },
  });
}
