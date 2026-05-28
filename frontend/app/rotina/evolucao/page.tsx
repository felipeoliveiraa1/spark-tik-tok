"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, TrendingUp, TrendingDown, ChevronRight, Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import {
  type CheckinRow,
  smartDateLabel,
  MOOD_OPTIONS,
} from "@/lib/checkin-config";

/**
 * /rotina/evolucao — Dashboard de evolução da Rotina Yara.
 *
 * Filtros: 7d | 30d | mês
 * Conteúdo:
 *   1. Streak hero (atual + recorde)
 *   2. KPIs principais (4 cards: vídeos, vendas R$, comissão R$, aderência média)
 *   3. Heatmap de consistência (estilo GitHub)
 *   4. Tabela com os check-ins do período
 */

type Period = "7d" | "30d" | "month";

type SummaryAggregate = {
  days_with_checkin: number;
  videos_posted: number;
  videos_recorded: number;
  live_chat_days: number;
  live_shop_days: number;
  analytics_days: number;
  comms_days: number;
  skincare_morning_days: number;
  skincare_night_days: number;
  supplementation_days: number;
  gym_days: number;
  sleep_hygiene_days: number;
  sales_brl: number;
  commission_brl: number;
  total_views: number;
  avg_adherence: number;
  avg_energy: number | null;
};

type SummaryResponse = {
  period: Period;
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  current: SummaryAggregate;
  previous: SummaryAggregate;
  rows: Array<{
    date: string;
    adherence: number;
    videos_posted: number;
    sales_brl: number | null;
    commission_brl: number | null;
    mood: CheckinRow["mood"];
  }>;
};

type StreakResponse = {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  today_done: boolean;
  last_checkin: string | null;
};

// =================================================================
// Hooks
// =================================================================

function useSummary(period: Period) {
  const [data, setData] = React.useState<SummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/checkins/summary?period=${period}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SummaryResponse | null) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);
  return { data, loading };
}

function useStreak() {
  const [data, setData] = React.useState<StreakResponse | null>(null);
  React.useEffect(() => {
    fetch("/api/checkins/streak", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StreakResponse | null) => setData(d))
      .catch(() => {});
  }, []);
  return data;
}

// =================================================================
// Componentes
// =================================================================

function PeriodChips({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const options: Array<{ value: Period; label: string }> = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "month", label: "Esse mês" },
  ];
  return (
    <div className="flex gap-2 mb-5 overflow-x-auto -mx-1 px-1 no-scrollbar">
      {options.map((opt) => {
        const active = period === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "px-4 py-2 rounded-full text-[12.5px] font-extrabold whitespace-nowrap transition-all active:scale-95",
              active
                ? "bg-spark-ink text-white"
                : "bg-spark-surface border border-spark-hairline text-spark-ink-70 hover:border-spark-brand/30",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StreakHero({ streak }: { streak: StreakResponse | null }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const total = streak?.total_checkins ?? 0;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 text-white p-5 mb-5 overflow-hidden relative shadow-[0_12px_32px_-16px_rgba(255,90,120,0.45)]">
      <div
        aria-hidden
        className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl pointer-events-none"
      />
      <div className="relative flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Flame size={32} strokeWidth={2.2} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
            Sua sequência
          </div>
          <div className="mt-0.5 text-[36px] font-extrabold leading-none">
            {current}
            <span className="text-[16px] font-bold opacity-80 ml-1.5">
              {current === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-3 text-white/95">
        <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
          <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-80">
            Recorde
          </div>
          <div className="text-[18px] font-extrabold mt-0.5">
            {longest} {longest === 1 ? "dia" : "dias"}
          </div>
        </div>
        <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-3">
          <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-80">
            Check-ins
          </div>
          <div className="text-[18px] font-extrabold mt-0.5">{total}</div>
        </div>
      </div>
      {!streak?.today_done && (
        <Link
          href="/rotina/hoje"
          className="relative mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-spark-brand-deep text-[13px] font-extrabold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={14} strokeWidth={2.5} />
          Fazer check-in de hoje
        </Link>
      )}
    </div>
  );
}

function KpiCard({
  emoji,
  label,
  value,
  prev,
  format,
  tone,
}: {
  emoji: string;
  label: string;
  value: number;
  prev: number;
  format?: "money" | "int";
  tone?: "brand";
}) {
  const delta = value - prev;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;
  const up = delta > 0;
  const down = delta < 0;
  const display =
    format === "money"
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        }).format(value)
      : new Intl.NumberFormat("pt-BR").format(Math.round(value));
  return (
    <div
      className={cn(
        "rounded-2xl border p-3.5",
        tone === "brand"
          ? "bg-spark-brand-soft/40 border-spark-brand/20"
          : "bg-spark-surface border-spark-hairline",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-spark-ink-50 uppercase tracking-wider">
        <span>{emoji}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-[22px] font-extrabold text-spark-ink leading-none tracking-tight">
        {display}
      </div>
      {pct !== null && (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-[11px] font-bold",
            up && "text-good",
            down && "text-bad",
            !up && !down && "text-spark-ink-50",
          )}
        >
          {up && <TrendingUp size={11} strokeWidth={2.5} />}
          {down && <TrendingDown size={11} strokeWidth={2.5} />}
          <span>
            {up ? "+" : ""}
            {pct}%
          </span>
          <span className="text-spark-ink-50 font-semibold">vs período anterior</span>
        </div>
      )}
    </div>
  );
}

/**
 * Heatmap simples 7×N — cada quadradinho é 1 dia. Cor varia com % aderência.
 * Não usa biblioteca, SVG puro.
 */
function ConsistencyHeatmap({
  rows,
  range,
}: {
  rows: SummaryResponse["rows"];
  range: { from: string; to: string };
}) {
  // Constrói grid: cada dia do range, marcando os que têm check-in
  const days = React.useMemo(() => {
    const adherenceByDate = new Map<string, number>();
    for (const r of rows) adherenceByDate.set(r.date, r.adherence);

    const from = new Date(range.from + "T00:00:00Z");
    const to = new Date(range.to + "T00:00:00Z");
    const list: Array<{ date: string; adherence: number | null }> = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const iso = cursor.toISOString().slice(0, 10);
      list.push({ date: iso, adherence: adherenceByDate.get(iso) ?? null });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return list;
  }, [rows, range]);

  // Agrupa em colunas de 7 (semanas). Domingos primeiro? Vamos só ir em sequência.
  const weeks: Array<Array<{ date: string; adherence: number | null }>> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const colorFor = (a: number | null) => {
    if (a === null) return "bg-spark-surface-sunken";
    if (a >= 80) return "bg-spark-brand";
    if (a >= 60) return "bg-spark-brand/70";
    if (a >= 40) return "bg-spark-brand/50";
    if (a > 0) return "bg-spark-brand/25";
    return "bg-spark-surface-sunken";
  };

  return (
    <div className="rounded-3xl bg-spark-surface border border-spark-hairline p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-wider">
            Consistência
          </div>
          <div className="text-[14px] font-extrabold text-spark-ink mt-0.5">
            Aderência por dia
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10.5px] text-spark-ink-50">
          <span>Pouco</span>
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-spark-surface-sunken" />
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-spark-brand/25" />
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-spark-brand/50" />
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-spark-brand/70" />
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-spark-brand" />
          <span>Tudo</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 shrink-0">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${
                  day.adherence === null ? "sem check-in" : `${day.adherence}%`
                }`}
                className={cn(
                  "w-4 h-4 rounded-sm transition-colors",
                  colorFor(day.adherence),
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mini bar chart SVG — uma barra por dia mostrando aderência (0-100).
 */
function AdherenceBarChart({ rows, range }: { rows: SummaryResponse["rows"]; range: { from: string; to: string } }) {
  const days = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.date, r.adherence);
    const from = new Date(range.from + "T00:00:00Z");
    const to = new Date(range.to + "T00:00:00Z");
    const list: Array<{ date: string; adherence: number }> = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const iso = cursor.toISOString().slice(0, 10);
      list.push({ date: iso, adherence: map.get(iso) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return list;
  }, [rows, range]);

  if (days.length === 0) return null;
  const width = Math.max(280, days.length * 24);
  const barWidth = (width - days.length * 4) / days.length;
  const height = 120;

  return (
    <div className="rounded-3xl bg-spark-surface border border-spark-hairline p-4 mb-5 overflow-hidden">
      <div className="mb-3">
        <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-wider">
          Sua evolução
        </div>
        <div className="text-[14px] font-extrabold text-spark-ink mt-0.5">
          % Rotina Yara por dia
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <svg width={width} height={height + 24} className="block">
          {days.map((day, i) => {
            const barHeight = (day.adherence / 100) * height;
            const x = i * (barWidth + 4);
            const y = height - barHeight;
            const tone =
              day.adherence >= 80
                ? "var(--color-good, #16a34a)"
                : day.adherence >= 50
                  ? "oklch(0.55 0.24 340)"
                  : "oklch(0.85 0.10 340)";
            return (
              <g key={day.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill={tone}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function CheckinsTable({
  rows,
}: {
  rows: SummaryResponse["rows"];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl bg-spark-surface border border-spark-hairline p-7 text-center">
        <div className="text-[28px] mb-2">🌱</div>
        <div className="text-[14px] font-extrabold text-spark-ink">
          Sem check-ins nesse período
        </div>
        <p className="text-[12.5px] text-spark-ink-50 mt-1.5 leading-snug">
          Bora começar com o de hoje? Leva 3 min e fica registradinho aqui 💕
        </p>
        <Link
          href="/rotina/hoje"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-grad text-white text-[12.5px] font-extrabold active:scale-95 transition-transform"
        >
          <Plus size={13} strokeWidth={2.5} />
          Fazer check-in agora
        </Link>
      </div>
    );
  }
  const moodEmoji = (m: CheckinRow["mood"]) =>
    MOOD_OPTIONS.find((o) => o.value === m)?.emoji ?? "—";
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden">
      <div className="px-4 py-3 border-b border-spark-hairline">
        <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-wider">
          Histórico
        </div>
        <div className="text-[14px] font-extrabold text-spark-ink mt-0.5">
          {rows.length} {rows.length === 1 ? "dia" : "dias"} no período
        </div>
      </div>
      <div className="divide-y divide-spark-hairline">
        {sorted.map((r) => (
          <div
            key={r.date}
            className="px-4 py-3 flex items-center gap-3 hover:bg-spark-surface-sunken/40 transition-colors"
          >
            <div className="text-[20px] shrink-0">{moodEmoji(r.mood)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-spark-ink">
                {smartDateLabel(r.date)}
              </div>
              <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
                {r.videos_posted} vídeos
                {r.sales_brl && r.sales_brl > 0
                  ? ` · R$ ${r.sales_brl.toFixed(0)}`
                  : ""}
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "text-[13px] font-extrabold",
                  r.adherence >= 80
                    ? "text-good"
                    : r.adherence >= 50
                      ? "text-spark-brand"
                      : "text-spark-ink-70",
                )}
              >
                {r.adherence}%
              </div>
              <div className="text-[10px] text-spark-ink-50 font-semibold">aderência</div>
            </div>
            <ChevronRight
              size={14}
              strokeWidth={1.8}
              className="text-spark-ink-35 shrink-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// Body
// =================================================================

function EvolucaoBody({ desktop = false }: { desktop?: boolean }) {
  const [period, setPeriod] = React.useState<Period>("7d");
  const { data, loading } = useSummary(period);
  const streak = useStreak();

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[920px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              📈 Sua Evolução
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Você tá indo longe ✨
            </h1>
            <p className="text-[13.5px] text-spark-ink-50 max-w-[520px] mt-1.5 mb-7">
              Sequência, aderência à rotina Yara e os números que importam.
            </p>
          </>
        )}

        <StreakHero streak={streak} />

        <PeriodChips period={period} onChange={setPeriod} />

        {loading || !data ? (
          <LoadingSplash message="Carregando sua evolução" />
        ) : (
          <>
            {/* KPIs */}
            <div className={`grid gap-2.5 mb-5 ${desktop ? "grid-cols-4" : "grid-cols-2"}`}>
              <KpiCard
                emoji="🎯"
                label="Aderência média"
                value={data.current.avg_adherence}
                prev={data.previous.avg_adherence}
                tone="brand"
              />
              <KpiCard
                emoji="📱"
                label="Vídeos postados"
                value={data.current.videos_posted}
                prev={data.previous.videos_posted}
                format="int"
              />
              <KpiCard
                emoji="💰"
                label="Vendas total"
                value={data.current.sales_brl}
                prev={data.previous.sales_brl}
                format="money"
              />
              <KpiCard
                emoji="💵"
                label="Comissão total"
                value={data.current.commission_brl}
                prev={data.previous.commission_brl}
                format="money"
              />
            </div>

            <AdherenceBarChart rows={data.rows} range={data.range} />
            <ConsistencyHeatmap rows={data.rows} range={data.range} />

            <CheckinsTable rows={data.rows} />
          </>
        )}
      </div>
    </div>
  );
}

function EvolucaoMobile() {
  return (
    <>
      <MobileHeader title="Evolução 📈" back={{ href: "/rotina/hoje" }} />
      <EvolucaoBody />
      <BottomNav active="rotina" />
    </>
  );
}

function EvolucaoDesktop() {
  return <EvolucaoBody desktop />;
}

export default function EvolucaoPage() {
  return (
    <ResponsiveShell mobile={<EvolucaoMobile />} desktop={<EvolucaoDesktop />} active="rotina" />
  );
}
