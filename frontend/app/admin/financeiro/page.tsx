"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { cn } from "@/lib/cn";

type Money = { gross_cents: number; net_cents: number };

type MonthBucket = {
  month: string;
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

type FinanceiroData = {
  currency: "BRL";
  mrr: { gross: number; net: number };
  arr: { gross: number; net: number };
  active_customers: number;
  new_customers_30d: number;
  churned_30d: number;
  churn_30d_pct: number;
  avg_ticket: number;
  revenue: {
    last_30d: Money;
    current_month: Money;
    prev_month: Money;
  };
  monthly_history: MonthBucket[];
  status_breakdown: Record<string, number>;
  recent_transactions: Transaction[];
  upcoming_30d: { count: number; projected_gross: number; projected_net: number };
};

const STATUS_LABELS: Record<string, { label: string; emoji: string; tone: string }> = {
  active: { label: "Ativa", emoji: "🟢", tone: "good" },
  trial: { label: "Trial", emoji: "🎁", tone: "brand" },
  late: { label: "Atrasada", emoji: "🟠", tone: "warn" },
  canceled: { label: "Cancelada", emoji: "⚪", tone: "neutral" },
  refunded: { label: "Reembolsada", emoji: "🔵", tone: "neutral" },
  chargeback: { label: "Chargeback", emoji: "🔴", tone: "bad" },
  inactive: { label: "Inativa", emoji: "⏸️", tone: "neutral" },
};

const MONTH_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function fmtBRL(cents: number, opts?: { compact?: boolean }): string {
  const reais = cents / 100;
  if (opts?.compact && Math.abs(reais) >= 1000) {
    return `R$ ${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtMonth(key: string): string {
  const [, m] = key.split("-");
  const idx = parseInt(m, 10) - 1;
  return MONTH_PT[idx] ?? key;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function eventLabel(t: string): { label: string; emoji: string } {
  switch (t) {
    case "order_approved":
      return { label: "Nova venda", emoji: "💕" };
    case "subscription_renewed":
      return { label: "Renovação", emoji: "🔄" };
    case "subscription_canceled":
      return { label: "Cancelamento", emoji: "❌" };
    case "subscription_late":
      return { label: "Atraso", emoji: "⏰" };
    case "order_refunded":
      return { label: "Reembolso", emoji: "↩️" };
    case "chargeback":
      return { label: "Chargeback", emoji: "🚨" };
    default:
      return { label: t, emoji: "✨" };
  }
}

export default function AdminFinanceiroPage() {
  const [data, setData] = React.useState<FinanceiroData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/financeiro", { cache: "no-store" });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(d.error ?? "Erro ao carregar");
          return;
        }
        const d = (await res.json()) as FinanceiroData;
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setError("Erro de rede");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial rounded-spark-3xl mb-8 px-6 lg:px-10 py-10 lg:py-12">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-20 w-[360px] h-[360px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[360px] h-[360px]" />
        <SparkleField count={10} seed={4242} className="opacity-50" />

        <div className="relative">
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pro painel
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={700}>
            <div className="mt-5 text-eyebrow text-spark-brand-deep">✦ financeiro</div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              valores + <span className="text-grad-brand">projeções.</span>
            </h1>
            <p className="mt-3 text-fluid-body text-spark-ink-70 leading-snug max-w-[58ch] font-semibold">
              MRR, ARR, churn, ticket médio, evolução mensal e projeção dos próximos 30 dias.
              Tudo derivado dos webhooks pagos do Kiwify + status das alunas.
            </p>
          </SectionReveal>
        </div>
      </section>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-spark-ink-50">
          <Loader2 size={24} strokeWidth={2} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-spark-2xl bg-bad/5 border border-bad/20 px-6 py-5 text-bad font-extrabold">
          {error}
        </div>
      ) : data ? (
        <FinanceiroContent data={data} />
      ) : null}
    </div>
  );
}

// =================================================================
// CONTENT
// =================================================================

function FinanceiroContent({ data }: { data: FinanceiroData }) {
  const monthDelta =
    data.revenue.prev_month.gross_cents > 0
      ? ((data.revenue.current_month.gross_cents - data.revenue.prev_month.gross_cents) /
          data.revenue.prev_month.gross_cents) *
        100
      : 0;

  return (
    <div className="space-y-8">
      {/* KPIs principais — MRR/ARR + Customers */}
      <section>
        <div className="text-eyebrow text-spark-brand mb-3">✦ recorrência</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="MRR bruto"
            value={fmtBRL(data.mrr.gross)}
            sub={`Líquido: ${fmtBRL(data.mrr.net)}`}
            tone="brand"
            emoji="📊"
          />
          <KpiCard
            label="ARR projetado"
            value={fmtBRL(data.arr.gross)}
            sub={`Líquido: ${fmtBRL(data.arr.net)}`}
            emoji="📈"
          />
          <KpiCard
            label="Assinantes ativas"
            value={String(data.active_customers)}
            sub={`+${data.new_customers_30d} nos últimos 30d`}
            tone="good"
            emoji="💕"
          />
          <KpiCard
            label="Churn 30d"
            value={fmtPct(data.churn_30d_pct)}
            sub={`${data.churned_30d} cancel/refund`}
            tone={data.churn_30d_pct > 5 ? "warn" : "neutral"}
            emoji="📉"
          />
        </div>
      </section>

      {/* KPIs Receita */}
      <section>
        <div className="text-eyebrow text-spark-brand mb-3">✦ receita</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Mês corrente"
            value={fmtBRL(data.revenue.current_month.gross_cents)}
            sub={`Líquido: ${fmtBRL(data.revenue.current_month.net_cents)}`}
            tone="brand"
            emoji="💰"
          />
          <KpiCard
            label="Mês anterior"
            value={fmtBRL(data.revenue.prev_month.gross_cents)}
            sub={`Líquido: ${fmtBRL(data.revenue.prev_month.net_cents)}`}
            emoji="🗓️"
          />
          <KpiCard
            label="MoM"
            value={`${monthDelta >= 0 ? "+" : ""}${monthDelta.toFixed(1)}%`}
            sub="Mês atual vs anterior"
            tone={monthDelta >= 0 ? "good" : "warn"}
            emoji={monthDelta >= 0 ? "📈" : "📉"}
            ValueIcon={monthDelta >= 0 ? TrendingUp : TrendingDown}
          />
          <KpiCard
            label="Ticket médio (30d)"
            value={fmtBRL(data.avg_ticket)}
            sub={`Bruto por transação`}
            emoji="🎟️"
          />
        </div>
      </section>

      {/* Projeção próximos 30 dias */}
      <section>
        <div className="text-eyebrow text-spark-brand mb-3">✦ projeção 30 dias</div>
        <div className="rounded-spark-2xl bg-brand-grad-soft border-2 border-spark-brand/30 shadow-rest p-5 lg:p-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <div className="text-eyebrow text-spark-brand-deep mb-1.5 inline-flex items-center gap-1.5">
              <Calendar size={11} strokeWidth={2.5} />
              renovações esperadas
            </div>
            <div className="font-display lowercase tracking-tight leading-none text-spark-ink text-[40px]">
              {data.upcoming_30d.count}
            </div>
            <div className="mt-1 text-[12px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              alunas
            </div>
          </div>
          <div>
            <div className="text-eyebrow text-spark-brand-deep mb-1.5">receita bruta</div>
            <div className="font-display lowercase tracking-tight leading-none text-spark-ink text-[36px]">
              {fmtBRL(data.upcoming_30d.projected_gross)}
            </div>
            <div className="mt-1 text-[12px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              total cobrado das alunas
            </div>
          </div>
          <div>
            <div className="text-eyebrow text-spark-brand-deep mb-1.5">receita líquida</div>
            <div className="font-display lowercase tracking-tight leading-none text-spark-brand-deep text-[36px]">
              {fmtBRL(data.upcoming_30d.projected_net)}
            </div>
            <div className="mt-1 text-[12px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              sua comissão estimada
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico mensal */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-eyebrow text-spark-brand">✦ evolução mensal</div>
            <div className="text-[12px] text-spark-ink-50 font-mono font-extrabold uppercase tracking-wider mt-1">
              últimos 12 meses · bruto + líquido
            </div>
          </div>
          <Legend />
        </div>
        <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest p-5 lg:p-6">
          <MonthlyChart history={data.monthly_history} />
        </div>
      </section>

      {/* Grid 2 col: status breakdown + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <section>
          <div className="text-eyebrow text-spark-brand mb-3">✦ status das alunas</div>
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
            <ul className="divide-y divide-spark-hairline">
              {Object.entries(data.status_breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => {
                  const meta = STATUS_LABELS[key] ?? STATUS_LABELS.inactive;
                  return (
                    <li key={key} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="text-[18px]" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="flex-1 text-[13.5px] font-extrabold text-spark-ink">
                        {meta.label}
                      </span>
                      <span className="font-mono font-extrabold text-spark-ink text-[18px]">
                        {count}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        </section>

        {/* Últimas transações */}
        <section>
          <div className="text-eyebrow text-spark-brand mb-3">✦ últimas transações</div>
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
            {data.recent_transactions.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-[28px] mb-2">✨</div>
                <div className="text-[13px] text-spark-ink-50 font-semibold">
                  Nenhuma transação registrada ainda.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-spark-hairline max-h-[460px] overflow-y-auto">
                {data.recent_transactions.map((tx, i) => {
                  const label = eventLabel(tx.event_type);
                  return (
                    <li key={`${tx.order_id}-${i}`} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[18px] shrink-0" aria-hidden>
                        {label.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-extrabold text-spark-ink tracking-tight truncate">
                          {tx.customer_email ?? "—"}
                        </div>
                        <div className="text-[10.5px] text-spark-ink-50 font-mono mt-0.5">
                          {label.label} · {fmtDate(tx.created_at)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13.5px] font-extrabold text-spark-ink font-mono">
                          {fmtBRL(tx.gross_cents)}
                        </div>
                        <div className="text-[10.5px] text-good font-extrabold font-mono">
                          +{fmtBRL(tx.net_cents)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Nota explicativa */}
      <div className="rounded-spark-2xl bg-spark-surface-sunken/60 border border-spark-hairline px-5 py-4 text-[12px] text-spark-ink-50 leading-relaxed font-mono">
        ✦ <strong className="text-spark-ink-70">Bruto</strong> = total cobrado das alunas (charge_amount Kiwify).{" "}
        <strong className="text-spark-ink-70">Líquido</strong> = sua comissão depois das taxas Kiwify e split com
        co-produtor (my_commission). MRR considera apenas alunas com plan_status ∈ (active, late) e
        cobrança nos últimos 60 dias.
      </div>
    </div>
  );
}

// =================================================================
// KPI CARD
// =================================================================

function KpiCard({
  label,
  value,
  sub,
  tone,
  emoji,
  ValueIcon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "good" | "warn" | "bad" | "neutral";
  emoji: string;
  ValueIcon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  const bg =
    tone === "brand"
      ? "bg-brand-grad-soft border-spark-brand/20"
      : tone === "good"
        ? "bg-good/5 border-good/20"
        : tone === "warn"
          ? "bg-warn/5 border-warn/20"
          : tone === "bad"
            ? "bg-bad/5 border-bad/20"
            : "bg-spark-surface border-spark-hairline";
  const valueColor =
    tone === "brand"
      ? "text-spark-brand-deep"
      : tone === "good"
        ? "text-good"
        : tone === "warn"
          ? "text-warn"
          : tone === "bad"
            ? "text-bad"
            : "text-spark-ink";
  return (
    <div
      className={`rounded-spark-2xl border p-5 shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift ${bg}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[24px] leading-none">{emoji}</div>
        {ValueIcon && <ValueIcon size={14} strokeWidth={2.5} className={valueColor} />}
      </div>
      <div
        className={`mt-3 font-extrabold font-mono tracking-tight leading-none ${valueColor}`}
        style={{ fontSize: "clamp(1.5rem, 2.4vw, 1.875rem)" }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-spark-ink-50 mt-2 font-extrabold uppercase tracking-wider">
        {label}
      </div>
      {sub && (
        <div className="text-[11px] text-spark-ink-70 mt-1.5 leading-snug font-semibold">
          {sub}
        </div>
      )}
    </div>
  );
}

// =================================================================
// CHART
// =================================================================

function Legend() {
  return (
    <div className="hidden sm:flex items-center gap-3 text-[10.5px] font-extrabold uppercase tracking-widest text-spark-ink-50">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-brand-grad" />
        Bruto
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-good" />
        Líquido
      </span>
    </div>
  );
}

function MonthlyChart({ history }: { history: MonthBucket[] }) {
  const maxValue = Math.max(
    1,
    ...history.map((m) => Math.max(m.gross_cents, m.net_cents)),
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }}>
        {history.map((m) => {
          const grossH = (m.gross_cents / maxValue) * 100;
          const netH = (m.net_cents / maxValue) * 100;
          return (
            <div key={m.month} className="flex flex-col items-center gap-2">
              <div
                className="w-full flex items-end gap-0.5 sm:gap-1"
                style={{ height: "180px" }}
                title={`${fmtMonth(m.month)}: bruto ${fmtBRL(m.gross_cents)}, líquido ${fmtBRL(m.net_cents)}, ${m.transactions} tx`}
              >
                <div
                  className="flex-1 bg-brand-grad rounded-t-md transition-all duration-700 ease-premium min-h-[2px]"
                  style={{ height: `${grossH}%` }}
                />
                <div
                  className="flex-1 bg-good rounded-t-md transition-all duration-700 ease-premium min-h-[2px]"
                  style={{ height: `${netH}%` }}
                />
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-spark-ink-50">
                {fmtMonth(m.month)}
              </div>
              <div className="text-[10px] font-mono text-spark-ink-70 hidden sm:block">
                {fmtBRL(m.gross_cents, { compact: true })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

void Sparkles;
void Users;
void CreditCard;
void AlertTriangle;
void ArrowRight;
