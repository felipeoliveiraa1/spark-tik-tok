import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cliente com service_role pra bypassar RLS. Usado SO pra ler dados de
 * outras alunas pro ranking publico — campos sao restritos via SELECT
 * (sem email/whatsapp/CPF). Necessario porque a policy aberta em
 * profiles/monthly_revenue foi removida (vazava dados sensiveis).
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE envs ausentes pro ranking");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/ranking?period=month|week|all
 *
 * Score ponderado:
 *   score = (faturamento_normalizado * 0.6) + (consistencia_checkin * 0.4)
 *
 *   faturamento_normalizado = faturamento_aluna / max(faturamento_global)
 *   consistencia_checkin = dias_completos_no_periodo / dias_totais_no_periodo
 *
 * Só aparecem alunas com ranking_opt_in = true. Resposta inclui top 50,
 * com posição, nome, avatar, cidade, score, faturamento e aderência.
 */

type Period = "week" | "month" | "all";

function periodBounds(period: Period): {
  ymList: string[] | null;
  dateFrom: string | null;
  dateTo: string;
  daysTotal: number;
} {
  const today = new Date();
  const dateTo = today.toISOString().slice(0, 10);

  if (period === "week") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    const dateFrom = from.toISOString().slice(0, 10);
    // YM list: mes(es) cobertos pelo periodo (1-2 meses)
    const ymSet = new Set<string>();
    for (let i = 0; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      ymSet.add(d.toISOString().slice(0, 7));
    }
    return {
      ymList: Array.from(ymSet),
      dateFrom,
      dateTo,
      daysTotal: 7,
    };
  }

  if (period === "month") {
    const ym = today.toISOString().slice(0, 7);
    const firstDay = `${ym}-01`;
    const daysTotal = today.getDate(); // dias até hoje no mês atual
    return {
      ymList: [ym],
      dateFrom: firstDay,
      dateTo,
      daysTotal,
    };
  }

  // all: 365 dias atrás como janela máxima
  const from = new Date(today);
  from.setDate(from.getDate() - 364);
  return {
    ymList: null, // todos
    dateFrom: from.toISOString().slice(0, 10),
    dateTo,
    daysTotal: 365,
  };
}

export async function GET(request: Request) {
  // anon client APENAS pra autenticar — garante que so aluna logada acessa
  const authClient = await getSupabaseServer();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // service_role client pra ler dados de OUTRAS alunas (bypassa RLS).
  // Selects sao restritos a colunas publicas (sem email/whatsapp/CPF).
  // Antes usava anon com cookie do user — RLS bloqueava daily_completions
  // de outras alunas, todas apareciam com 0% consistencia no ranking.
  const supabase = getServiceClient();

  const { searchParams } = new URL(request.url);
  const periodRaw = (searchParams.get("period") ?? "month") as Period;
  const period: Period = ["week", "month", "all"].includes(periodRaw)
    ? periodRaw
    : "month";

  const { ymList, dateFrom, dateTo, daysTotal } = periodBounds(period);

  // 1) Profiles que optaram pelo ranking E tem plano ATIVO (active ou
  //    trial em curso). Quem caiu pra inactive/canceled/refunded/late
  //    nao aparece — ranking eh vitrine de quem ta dentro do app hoje.
  //    Trial expirado vira 'inactive' via cron expireTrials, entao basta
  //    filtrar plan_status. Tambem exclui staff (admin/crm_agent).
  const { data: profilesData, error: pErr } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, cidade_uf, meta_mensal_brl, niche, role")
    .eq("ranking_opt_in", true)
    .eq("plan_active", true)
    .in("plan_status", ["active", "trial"]);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  // Exclui contas internas (admin/crm_agent) — sao staff, nao criadoras.
  const profiles = (profilesData ?? []).filter(
    (p) => p.role !== "admin" && p.role !== "crm_agent",
  );
  if (profiles.length === 0) {
    return NextResponse.json({
      period,
      total: 0,
      ranking: [],
      me: null,
    });
  }
  const userIds = profiles.map((p) => p.id);

  // 2) Revenue do periodo (so valor, sem notes)
  let revenueQuery = supabase
    .from("monthly_revenue")
    .select("user_id, year_month, amount_brl")
    .in("user_id", userIds);
  if (ymList) {
    revenueQuery = revenueQuery.in("year_month", ymList);
  }
  const { data: revenueData, error: rErr } = await revenueQuery;
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const revenueByUser = new Map<string, number>();
  for (const r of revenueData ?? []) {
    const cur = revenueByUser.get(r.user_id as string) ?? 0;
    revenueByUser.set(r.user_id as string, cur + Number(r.amount_brl ?? 0));
  }

  // 3) Daily completions no periodo
  let completionsQuery = supabase
    .from("daily_completions")
    .select("user_id, date")
    .in("user_id", userIds);
  if (dateFrom) completionsQuery = completionsQuery.gte("date", dateFrom);
  completionsQuery = completionsQuery.lte("date", dateTo);
  const { data: completionsData, error: cErr } = await completionsQuery;
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const completionsByUser = new Map<string, number>();
  for (const c of completionsData ?? []) {
    const cur = completionsByUser.get(c.user_id as string) ?? 0;
    completionsByUser.set(c.user_id as string, cur + 1);
  }

  // 4) Calcula score
  const maxRevenue = Math.max(...Array.from(revenueByUser.values()), 1);

  type Row = {
    user_id: string;
    name: string;
    avatar_url: string | null;
    cidade_uf: string | null;
    niche: string | null;
    revenue_brl: number;
    checkins_done: number;
    days_total: number;
    revenue_norm: number;
    checkin_consistency: number;
    score: number;
  };

  const rows: Row[] = profiles.map((p) => {
    const rev = revenueByUser.get(p.id) ?? 0;
    const checks = completionsByUser.get(p.id) ?? 0;
    const revenueNorm = rev / maxRevenue;
    const consistency = Math.min(1, checks / Math.max(1, daysTotal));
    // Consistencia diaria pesa mais que faturamento — quem mantem
    // disciplina merece o destaque. Faturamento entra como sinal
    // secundario porque varia muito por mes/lancamento/sorte de produto.
    const score = consistency * 0.6 + revenueNorm * 0.4;
    return {
      user_id: p.id,
      name: p.name ?? "Criadora",
      avatar_url: p.avatar_url,
      cidade_uf: p.cidade_uf,
      niche: p.niche ?? null,
      revenue_brl: rev,
      checkins_done: checks,
      days_total: daysTotal,
      revenue_norm: Number(revenueNorm.toFixed(4)),
      checkin_consistency: Number(consistency.toFixed(4)),
      score: Number(score.toFixed(4)),
    };
  });

  rows.sort((a, b) => b.score - a.score);
  const ranked = rows.slice(0, 50).map((r, i) => ({ position: i + 1, ...r }));

  const meIndex = rows.findIndex((r) => r.user_id === user.id);
  const me =
    meIndex >= 0
      ? { position: meIndex + 1, ...rows[meIndex] }
      : null;

  return NextResponse.json({
    period,
    total: profiles.length,
    days_total: daysTotal,
    ranking: ranked,
    me,
  });
}
