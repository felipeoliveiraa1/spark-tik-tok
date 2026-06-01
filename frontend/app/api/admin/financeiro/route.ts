import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/financeiro — metricas financeiras do negocio.
 *
 * Tudo derivado de `kiwify_events.payload` (charge_amount + my_commission)
 * + `profiles` (status do plano).
 *
 * Valores em CENTAVOS (charge_amount vem assim do Kiwify). UI converte.
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
  created_at: string;
  payload: {
    Commissions?: {
      charge_amount?: number;
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
    .select("event_type, customer_email, order_id, created_at, payload")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

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

  // ----- MRR: soma do ultimo pagamento por aluna ativa -----
  // "Ativa" = plan_active && plan_status in (active, late). Trial nao conta.
  const activeStatuses = new Set(["active", "late"]);
  const activeProfileIds = new Set(
    profiles
      .filter((p) => p.plan_active === true && activeStatuses.has(p.plan_status ?? ""))
      .map((p) => p.id),
  );
  const activeEmails = new Set(
    profiles
      .filter((p) => p.plan_active === true && activeStatuses.has(p.plan_status ?? ""))
      .map((p) => p.email),
  );

  // Pega ultimo evento pago de cada email ativo nos ultimos 60 dias
  // (window pra cobrir mensal + leve atraso).
  const recentPayments = new Map<string, { gross: number; net: number; date: string }>();
  const recentSince = daysAgo(62);
  for (const e of paidEvents) {
    if (!e.customer_email || !activeEmails.has(e.customer_email)) continue;
    if (new Date(e.created_at) < recentSince) continue;
    if (!recentPayments.has(e.customer_email)) {
      recentPayments.set(e.customer_email, {
        gross: e.payload?.Commissions?.charge_amount ?? 0,
        net: e.payload?.Commissions?.my_commission ?? 0,
        date: e.created_at,
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
    const key = monthKey(new Date(e.created_at));
    const bucket = monthsMap.get(key);
    if (!bucket) continue;
    bucket.gross_cents += e.payload?.Commissions?.charge_amount ?? 0;
    bucket.net_cents += e.payload?.Commissions?.my_commission ?? 0;
    bucket.transactions += 1;
    if (e.event_type === "order_approved") bucket.new_customers += 1;
  }

  // Cancelamentos por mes
  const canceledEvents = events.filter(
    (e) => e.event_type === "subscription_canceled" || e.event_type === "order_refunded",
  );
  for (const e of canceledEvents) {
    const key = monthKey(new Date(e.created_at));
    const bucket = monthsMap.get(key);
    if (bucket) bucket.churned += 1;
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
    const d = new Date(e.created_at);
    const gross = e.payload?.Commissions?.charge_amount ?? 0;
    const net = e.payload?.Commissions?.my_commission ?? 0;
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

  // ----- Churn 30d -----
  // Churned = subscription_canceled + order_refunded nos ultimos 30d
  // Customers in start of window = ativos + canceled (que ainda nao perderam acesso)
  let churned30 = 0;
  for (const e of canceledEvents) {
    if (new Date(e.created_at) >= since30) churned30 += 1;
  }
  const baseForChurn =
    activeProfileIds.size + (statusBreakdown.canceled ?? 0);
  const churn30Pct = baseForChurn > 0 ? (churned30 / baseForChurn) * 100 : 0;

  // ----- New customers 30d -----
  let newCustomers30 = 0;
  for (const e of paidEvents) {
    if (e.event_type !== "order_approved") continue;
    if (new Date(e.created_at) >= since30) newCustomers30 += 1;
  }

  // ----- Recent transactions (20 mais recentes) -----
  const recentTransactions: Transaction[] = paidEvents.slice(0, 20).map((e) => ({
    created_at: e.created_at,
    customer_email: e.customer_email,
    event_type: e.event_type,
    gross_cents: e.payload?.Commissions?.charge_amount ?? 0,
    net_cents: e.payload?.Commissions?.my_commission ?? 0,
    order_id: e.order_id,
  }));

  // ----- Projecao proximos 30d -----
  // Pra cada profile ativo com next_payment dentro de 30d, soma o ultimo
  // ticket dela (do recentPayments) como projecao.
  const within30 = new Date();
  within30.setUTCDate(within30.getUTCDate() + 30);
  let upcomingCount = 0;
  let upcomingGross = 0;
  let upcomingNet = 0;
  for (const p of profiles) {
    if (!activeStatuses.has(p.plan_status ?? "")) continue;
    if (!p.plan_next_payment) continue;
    const next = new Date(p.plan_next_payment);
    if (next > within30) continue;
    if (next < new Date()) continue; // ja venceu, nao projeta
    const lastPaid = recentPayments.get(p.email);
    if (lastPaid) {
      upcomingCount += 1;
      upcomingGross += lastPaid.gross;
      upcomingNet += lastPaid.net;
    } else {
      // Sem historico recente — usa avgTicket como fallback
      upcomingCount += 1;
      upcomingGross += avgTicketGrossCents;
      upcomingNet += Math.round(avgTicketGrossCents * 0.35); // estimativa rough
    }
  }

  return NextResponse.json({
    currency: "BRL",
    units: "cents",
    mrr: { gross: mrrGross, net: mrrNet },
    arr: { gross: mrrGross * 12, net: mrrNet * 12 },
    active_customers: activeProfileIds.size,
    new_customers_30d: newCustomers30,
    churned_30d: churned30,
    churn_30d_pct: churn30Pct,
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
      count: upcomingCount,
      projected_gross: upcomingGross,
      projected_net: upcomingNet,
    },
  });
}
