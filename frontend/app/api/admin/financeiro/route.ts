import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { hasActiveAccess } from "@/lib/plan-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/financeiro — metricas financeiras do negocio.
 *
 * Tudo derivado de `kiwify_events.payload` (charge_amount - kiwify_fee)
 * + `profiles` (status do plano).
 *
 * Valores em CENTAVOS (charge_amount vem assim do Kiwify). UI converte.
 *
 * NET = bruto - taxa Kiwify (NAO desconta split com co-produtor). O
 * usuario nao quer ver a propria %, so o liquido apos a plataforma.
 */

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type Money = { gross_cents: number; net_cents: number };

type MonthBucket = {
  month: string; // "2026-05"
  gross_cents: number;
  net_cents: number;
  new_customers: number;
  churned: number;
  transactions: number;
};

type Transaction = {
  created_at: string;
  customer_email: string | null;
  event_type: string;
  gross_cents: number;
  net_cents: number;
  order_id: string | null;
};

type KiwifyEventRow = {
  event_type: string;
  customer_email: string | null;
  order_id: string | null;
  processed_at: string;
  payload: {
    Commissions?: {
      charge_amount?: number;
      kiwify_fee?: number;
      my_commission?: number;
    };
    Subscription?: {
      next_payment?: string;
      customer_access?: {
        access_until?: string;
      };
    };
    order_status?: string;
  } | null;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  plan_active: boolean | null;
  plan_status: string | null;
  plan_next_payment: string | null;
  plan_renewed_at: string | null;
  plan_canceled_at: string | null;
  plan_expires_at: string | null;
  role: string | null;
};

/**
 * Net = bruto - taxa Kiwify. NAO desconta o split com co-produtor (essa
 * parte fica fora do dashboard porque o usuario nao quer ver a propria
 * porcentagem, so o liquido apos taxa da plataforma).
 */
function netOf(row: KiwifyEventRow): number {
  const gross = row.payload?.Commissions?.charge_amount ?? 0;
  const fee = row.payload?.Commissions?.kiwify_fee ?? 0;
  return Math.max(0, gross - fee);
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfPrevMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const svc = getServiceClient();

  // 1) Eventos pagos (order_approved + paid OU subscription_renewed) ate 13 meses atras
  const since = daysAgo(395).toISOString();
  const { data: rawEvents, error: evErr } = await svc
    .from("kiwify_events")
    .select("event_type, customer_email, order_id, processed_at, payload")
    .gte("processed_at", since)
    .order("processed_at", { ascending: false });

  if (evErr) {
    return NextResponse.json({ error: evErr.message }, { status: 500 });
  }

  const events: KiwifyEventRow[] = (rawEvents as KiwifyEventRow[] | null) ?? [];

  // Eventos que representam dinheiro entrando: order_approved (paid) + subscription_renewed
  const paidEvents = events.filter((e) => {
    if (e.event_type === "order_approved") return e.payload?.order_status === "paid";
    return e.event_type === "subscription_renewed";
  });

  // 2) Perfis pra status breakdown + churn
  const { data: rawProfiles, error: profErr } = await svc
    .from("profiles")
    .select(
      "id, email, name, plan_active, plan_status, plan_next_payment, plan_renewed_at, plan_canceled_at, plan_expires_at, role",
    )
    .or("role.is.null,role.neq.admin");

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }
  const profiles: ProfileRow[] = (rawProfiles as ProfileRow[] | null) ?? [];

  // ----- Quem tem ACESSO hoje (pra card "Assinantes ativas") -----
  // Usa hasActiveAccess pra consistencia com middleware/proxy. Inclui:
  // active, late, trial-nao-expirado, canceled-com-data-futura.
  const accessProfileIds = new Set(
    profiles.filter((p) => hasActiveAccess(p)).map((p) => p.id),
  );

  // ----- Quem PAGA (pra MRR) — exclui trial -----
  // MRR considera so quem cobrou recorrente: active + late (trial nao
  // gera receita; canceled tambem nao gera receita futura).
  const payingStatuses = new Set(["active", "late"]);
  const payingEmails = new Set(
    profiles
      .filter((p) => p.plan_active === true && payingStatuses.has(p.plan_status ?? ""))
      .map((p) => p.email),
  );

  // ----- Trial ativas (sub-conjunto das ativas, NAO sobrepoe pagantes) -----
  const now = Date.now();
  const trialCustomers = profiles.filter(
    (p) =>
      p.plan_status === "trial" &&
      p.plan_active === true &&
      (!p.plan_expires_at || new Date(p.plan_expires_at).getTime() > now),
  ).length;

  // Pega ultimo evento pago de cada email ativo nos ultimos 60 dias
  // (window pra cobrir mensal + leve atraso).
  const recentPayments = new Map<string, { gross: number; net: number; date: string }>();
  const recentSince = daysAgo(62);
  for (const e of paidEvents) {
    if (!e.customer_email || !payingEmails.has(e.customer_email)) continue;
    if (new Date(e.processed_at) < recentSince) continue;
    if (!recentPayments.has(e.customer_email)) {
      recentPayments.set(e.customer_email, {
        gross: e.payload?.Commissions?.charge_amount ?? 0,
        net: netOf(e),
        date: e.processed_at,
      });
    }
  }

  let mrrGross = 0;
  let mrrNet = 0;
  for (const p of recentPayments.values()) {
    mrrGross += p.gross;
    mrrNet += p.net;
  }

  // ----- Receita por mes (ultimos 12 meses) -----
  const monthsMap = new Map<string, MonthBucket>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = monthKey(d);
    monthsMap.set(key, {
      month: key,
      gross_cents: 0,
      net_cents: 0,
      new_customers: 0,
      churned: 0,
      transactions: 0,
    });
  }

  for (const e of paidEvents) {
    const key = monthKey(new Date(e.processed_at));
    const bucket = monthsMap.get(key);
    if (!bucket) continue;
    bucket.gross_cents += e.payload?.Commissions?.charge_amount ?? 0;
    bucket.net_cents += netOf(e);
    bucket.transactions += 1;
    if (e.event_type === "order_approved") bucket.new_customers += 1;
  }

  // Cancelamentos por mes — dedupe por email pra nao contar 2x quando
  // Kiwify dispara subscription_canceled + order_refunded em sequencia
  // (acontece quando aluna cancela e pede reembolso no mesmo fluxo).
  // Contamos UMA aluna por mes mesmo se tiver multiplos eventos de churn.
  const canceledEvents = events.filter(
    (e) => e.event_type === "subscription_canceled" || e.event_type === "order_refunded",
  );
  const churnedByMonth = new Map<string, Set<string>>();
  for (const e of canceledEvents) {
    if (!e.customer_email) continue;
    const key = monthKey(new Date(e.processed_at));
    const set = churnedByMonth.get(key) ?? new Set<string>();
    set.add(e.customer_email);
    churnedByMonth.set(key, set);
  }
  for (const [key, emails] of churnedByMonth) {
    const bucket = monthsMap.get(key);
    if (bucket) bucket.churned = emails.size;
  }

  const monthlyHistory = Array.from(monthsMap.values());

  // ----- Receita corrente vs passado -----
  const startCurrent = startOfCurrentMonth();
  const startPrev = startOfPrevMonth();
  const currentMonthRevenue: Money = { gross_cents: 0, net_cents: 0 };
  const prevMonthRevenue: Money = { gross_cents: 0, net_cents: 0 };
  const last30Revenue: Money = { gross_cents: 0, net_cents: 0 };
  const since30 = daysAgo(30);

  let last30Tx = 0;
  for (const e of paidEvents) {
    const d = new Date(e.processed_at);
    const gross = e.payload?.Commissions?.charge_amount ?? 0;
    const net = netOf(e);
    if (d >= startCurrent) {
      currentMonthRevenue.gross_cents += gross;
      currentMonthRevenue.net_cents += net;
    } else if (d >= startPrev && d < startCurrent) {
      prevMonthRevenue.gross_cents += gross;
      prevMonthRevenue.net_cents += net;
    }
    if (d >= since30) {
      last30Revenue.gross_cents += gross;
      last30Revenue.net_cents += net;
      last30Tx += 1;
    }
  }

  const avgTicketGrossCents = last30Tx > 0 ? Math.round(last30Revenue.gross_cents / last30Tx) : 0;

  // ----- Status breakdown -----
  const statusBreakdown: Record<string, number> = {
    active: 0,
    trial: 0,
    late: 0,
    canceled: 0,
    refunded: 0,
    chargeback: 0,
    inactive: 0,
  };
  for (const p of profiles) {
    const s = p.plan_status ?? "inactive";
    if (s in statusBreakdown) statusBreakdown[s] += 1;
    else statusBreakdown.inactive += 1;
  }

  // ----- Churn 30d ----- (dedupe por email, ver comentario acima)
  const churnedEmails30 = new Set<string>();
  for (const e of canceledEvents) {
    if (!e.customer_email) continue;
    if (new Date(e.processed_at) >= since30) churnedEmails30.add(e.customer_email);
  }
  const churned30 = churnedEmails30.size;
  const baseForChurn =
    accessProfileIds.size + (statusBreakdown.canceled ?? 0);
  const churn30Pct = baseForChurn > 0 ? (churned30 / baseForChurn) * 100 : 0;

  // ----- Renewals 30d + renewal rate -----
  // renewals_30d = count de subscription_renewed nos ultimos 30 dias (unico por email)
  // renewal_rate = renewals / (renewals + churned) — quanto da base ta se mantendo
  const renewedEmails30 = new Set<string>();
  for (const e of paidEvents) {
    if (e.event_type !== "subscription_renewed") continue;
    if (!e.customer_email) continue;
    if (new Date(e.processed_at) >= since30) renewedEmails30.add(e.customer_email);
  }
  const renewals30 = renewedEmails30.size;
  const renewalRate30Pct =
    renewals30 + churned30 > 0
      ? (renewals30 / (renewals30 + churned30)) * 100
      : 0;

  // ----- Refund rate lifetime -----
  const refundedTotal = statusBreakdown.refunded ?? 0;
  const totalEverPaid =
    profiles.filter(
      (p) =>
        p.plan_status === "active" ||
        p.plan_status === "late" ||
        p.plan_status === "canceled" ||
        p.plan_status === "refunded" ||
        p.plan_status === "chargeback",
    ).length;
  const refundRatePct =
    totalEverPaid > 0 ? (refundedTotal / totalEverPaid) * 100 : 0;

  // ----- New customers 30d -----
  let newCustomers30 = 0;
  for (const e of paidEvents) {
    if (e.event_type !== "order_approved") continue;
    if (new Date(e.processed_at) >= since30) newCustomers30 += 1;
  }

  // ----- Recent transactions (20 mais recentes) -----
  const recentTransactions: Transaction[] = paidEvents.slice(0, 20).map((e) => ({
    created_at: e.processed_at,
    customer_email: e.customer_email,
    event_type: e.event_type,
    gross_cents: e.payload?.Commissions?.charge_amount ?? 0,
    net_cents: netOf(e),
    order_id: e.order_id,
  }));

  // ----- Projecao proximos 30d — segmentada em buckets 7/14/30 -----
  // Pra cada profile ativo com next_payment dentro de 30d, soma o ultimo
  // ticket dela (do recentPayments) como projecao. Segmenta por janela
  // (0-7d, 8-14d, 15-30d) — Yara consegue ver quem tá pra renovar YA.
  const nowDate = new Date();
  const in7d = new Date(nowDate.getTime() + 7 * 86400000);
  const in14d = new Date(nowDate.getTime() + 14 * 86400000);
  const in30d = new Date(nowDate.getTime() + 30 * 86400000);
  const upcomingBuckets = {
    d7: 0,
    d14: 0,
    d30: 0,
    total: 0,
    projected_gross: 0,
    projected_net: 0,
  };
  for (const p of profiles) {
    if (!payingStatuses.has(p.plan_status ?? "")) continue;
    if (!p.plan_next_payment) continue;
    const next = new Date(p.plan_next_payment);
    if (next > in30d) continue;
    if (next < nowDate) continue; // ja venceu, entra em late nao em upcoming
    const lastPaid = recentPayments.get(p.email);
    const gross = lastPaid?.gross ?? avgTicketGrossCents;
    const net = lastPaid?.net ?? Math.round(avgTicketGrossCents * 0.87);
    upcomingBuckets.total += 1;
    upcomingBuckets.projected_gross += gross;
    upcomingBuckets.projected_net += net;
    if (next <= in7d) upcomingBuckets.d7 += 1;
    else if (next <= in14d) upcomingBuckets.d14 += 1;
    else upcomingBuckets.d30 += 1;
  }

  // ----- Risk summary — alunas em risco de churn ----- (buckets acionaveis)
  const in3d = new Date(nowDate.getTime() + 3 * 86400000);
  const lateSince1d = new Date(nowDate.getTime() - 1 * 86400000);
  const lateSince3d = new Date(nowDate.getTime() - 3 * 86400000);
  const lateSince4d = new Date(nowDate.getTime() - 4 * 86400000);
  const lateSince14d = new Date(nowDate.getTime() - 14 * 86400000);
  const risk = {
    renewal_7d: 0, // ja considerado em upcomingBuckets.d7
    late_1_3d: 0, // plan_status=late OU next_payment 1-3d atras
    late_4_14d: 0, // 4-14d atras (alto risco churn)
    trial_expiring_3d: 0,
    mrr_at_risk_cents: 0,
  };
  risk.renewal_7d = upcomingBuckets.d7;
  for (const p of profiles) {
    // Late 1-3 dias (dunning window Kiwify — bastante recuperavel)
    if (p.plan_next_payment) {
      const next = new Date(p.plan_next_payment);
      if (next < nowDate && next >= lateSince3d) {
        risk.late_1_3d += 1;
        const lastPaid = recentPayments.get(p.email);
        risk.mrr_at_risk_cents += lastPaid?.gross ?? avgTicketGrossCents;
      } else if (next < lateSince4d && next >= lateSince14d) {
        risk.late_4_14d += 1;
        const lastPaid = recentPayments.get(p.email);
        risk.mrr_at_risk_cents += lastPaid?.gross ?? avgTicketGrossCents;
      }
    }
    // Trial expirando 3d
    if (
      p.plan_status === "trial" &&
      p.plan_active === true &&
      p.plan_expires_at
    ) {
      const exp = new Date(p.plan_expires_at);
      if (exp >= nowDate && exp <= in3d) {
        risk.trial_expiring_3d += 1;
      }
    }
  }
  void lateSince1d; // reservado pra bucket futuro "just missed"

  return NextResponse.json({
    currency: "BRL",
    units: "cents",
    generated_at: new Date().toISOString(),
    mrr: { gross: mrrGross, net: mrrNet },
    arr: { gross: mrrGross * 12, net: mrrNet * 12 },
    active_customers: accessProfileIds.size,
    paying_customers: payingEmails.size,
    trial_customers: trialCustomers,
    new_customers_30d: newCustomers30,
    churned_30d: churned30,
    churn_30d_pct: churn30Pct,
    renewals_30d: renewals30,
    renewal_rate_30d_pct: renewalRate30Pct,
    refund_rate_lifetime_pct: refundRatePct,
    avg_ticket: avgTicketGrossCents,
    revenue: {
      last_30d: last30Revenue,
      current_month: currentMonthRevenue,
      prev_month: prevMonthRevenue,
    },
    monthly_history: monthlyHistory,
    status_breakdown: statusBreakdown,
    recent_transactions: recentTransactions,
    upcoming_30d: {
      count: upcomingBuckets.total,
      d7: upcomingBuckets.d7,
      d14: upcomingBuckets.d14,
      d30: upcomingBuckets.d30,
      projected_gross: upcomingBuckets.projected_gross,
      projected_net: upcomingBuckets.projected_net,
    },
    risk_summary: {
      renewal_7d: risk.renewal_7d,
      late_1_3d: risk.late_1_3d,
      late_4_14d: risk.late_4_14d,
      trial_expiring_3d: risk.trial_expiring_3d,
      mrr_at_risk_cents: risk.mrr_at_risk_cents,
    },
  });
}
