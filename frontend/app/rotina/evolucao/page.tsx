"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Flame,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import {
  type CheckinRow,
  smartDateLabel,
  MOOD_OPTIONS,
} from "@/lib/checkin-config";

/**
 * /rotina/evolucao — dashboard editorial premium da Rotina TTS.
 *
 * Estrutura:
 *   • Hero radial: back + sticker + Tanker "você tá / indo longe."
 *   • Streak hero card (gradient orange→pink) com CountUp gigante +
 *     dots no bottom + recorde/total em pills glass
 *   • Period chips (7d / 30d / mês) glass pill
 *   • 4 KPI cards com CountUp + delta vs anterior
 *   • AdherenceBarChart SVG com cards rounded
 *   • Heatmap GitHub-style premium
 *   • Tabela histórico com hover
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
// HERO
// =================================================================

function HeroSection({ desktop }: { desktop: boolean }) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "72px" : "48px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <SparkleField count={12} seed={618} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/rotina/hoje"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro check-in
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ sua evolução
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              Sequência, aderência à rotina TTS e os números que importam.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="EVOLUÇÃO · 2026 · " emoji="📈" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <span className="block text-spark-ink">você tá</span>
            <span className="block text-grad-brand">indo longe.</span>
          </h1>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// STREAK HERO
// =================================================================

function StreakHero({ streak }: { streak: StreakResponse | null }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const total = streak?.total_checkins ?? 0;
  const dotCount = Math.min(current, 14); // visual: até 14 dots no bottom

  return (
    <SectionReveal direction="up">
      <div className="relative rounded-spark-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 text-white p-6 sm:p-8 overflow-hidden shadow-hero">
        <SparkleField count={10} seed={888} color="rgba(255,255,255,0.6)" className="opacity-70" />
        <div
          aria-hidden
          className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/15 blur-3xl animate-blob-1"
        />

        <div className="relative flex items-center gap-5">
          {/* Ícone flame com animação float */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lift">
            <Flame size={44} strokeWidth={2.2} className="text-white animate-float" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-eyebrow text-white/80">
              ✦ sua sequência
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-extrabold tracking-tight leading-none text-[56px] sm:text-[72px]">
                <CountUp value={current} durationMs={1100} />
              </span>
              <span className="text-[16px] sm:text-[20px] font-extrabold opacity-90">
                {current === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>
        </div>

        {/* Dots visuais */}
        {dotCount > 0 && (
          <div className="relative mt-5 flex items-center gap-1.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-500 ease-premium",
                  i < dotCount ? "bg-white" : "bg-white/20",
                )}
              />
            ))}
          </div>
        )}

        {/* Recorde + total */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 text-white/95">
          <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4">
            <div className="text-eyebrow text-white/70 mb-1">recorde</div>
            <div className="text-[22px] font-extrabold tracking-tight leading-none">
              <CountUp value={longest} durationMs={1000} />
              <span className="text-[14px] font-bold opacity-80 ml-1.5">
                {longest === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4">
            <div className="text-eyebrow text-white/70 mb-1">check-ins</div>
            <div className="text-[22px] font-extrabold tracking-tight leading-none">
              <CountUp value={total} durationMs={1000} />
            </div>
          </div>
        </div>

        {/* CTA se hoje não foi feito */}
        {!streak?.today_done && (
          <Link
            href="/rotina/hoje"
            className="group relative mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full bg-white text-spark-brand-deep text-[13.5px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <Plus
              size={15}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            Fazer check-in de hoje
            <ArrowUpRight
              size={14}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        )}
      </div>
    </SectionReveal>
  );
}

// =================================================================
// PERIOD CHIPS
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
    <SectionReveal>
      <div className="inline-flex items-center gap-1 p-1.5 rounded-full glass shadow-rest">
        {options.map((opt) => {
          const active = period === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "px-5 py-2.5 rounded-full text-[12.5px] font-extrabold whitespace-nowrap transition-all duration-300 ease-premium active:scale-95",
                active
                  ? "bg-spark-ink text-white shadow-lift"
                  : "text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </SectionReveal>
  );
}

// =================================================================
// KPI CARD
// =================================================================

function KpiCard({
  emoji,
  label,
  value,
  prev,
  format,
  tone,
  delay,
}: {
  emoji: string;
  label: string;
  value: number;
  prev: number;
  format?: "money" | "int";
  tone?: "brand";
  delay: number;
}) {
  const delta = value - prev;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;
  const up = delta > 0;
  const down = delta < 0;
  const isMoney = format === "money";
  return (
    <SectionReveal direction="up" delay={delay}>
      <div
        className={cn(
          "rounded-spark-2xl border p-5 hover-lift shadow-rest transition-colors duration-300 ease-premium",
          tone === "brand"
            ? "bg-spark-brand-soft/40 border-spark-brand/20"
            : "bg-spark-surface border-spark-hairline",
        )}
      >
        <div className="text-eyebrow text-spark-ink-50 flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-3 text-[28px] font-extrabold text-spark-ink leading-none tracking-tight">
          <CountUp
            value={Math.round(value)}
            prefix={isMoney ? "R$ " : ""}
            durationMs={1000}
          />
        </div>
        {pct !== null && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1.5 text-[11px] font-extrabold",
              up && "text-good",
              down && "text-bad",
              !up && !down && "text-spark-ink-50",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full",
                up && "bg-good/15",
                down && "bg-bad/15",
                !up && !down && "bg-spark-surface-sunken",
              )}
            >
              {up && <TrendingUp size={10} strokeWidth={2.5} />}
              {down && <TrendingDown size={10} strokeWidth={2.5} />}
              {up ? "+" : ""}
              {pct}%
            </span>
            <span className="text-spark-ink-50 font-semibold normal-case">
              vs período anterior
            </span>
          </div>
        )}
      </div>
    </SectionReveal>
  );
}

// =================================================================
// HEATMAP GITHUB-STYLE
// =================================================================

function ConsistencyHeatmap({
  rows,
  range,
}: {
  rows: SummaryResponse["rows"];
  range: { from: string; to: string };
}) {
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
    <SectionReveal direction="up">
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-eyebrow text-spark-brand mb-1">✦ consistência</div>
            <div className="text-fluid-title font-extrabold text-spark-ink tracking-tight">
              Aderência por dia
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
            <span>pouco</span>
            <span className="inline-block w-3 h-3 rounded bg-spark-surface-sunken" />
            <span className="inline-block w-3 h-3 rounded bg-spark-brand/25" />
            <span className="inline-block w-3 h-3 rounded bg-spark-brand/50" />
            <span className="inline-block w-3 h-3 rounded bg-spark-brand/70" />
            <span className="inline-block w-3 h-3 rounded bg-spark-brand" />
            <span>tudo</span>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5 shrink-0">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${
                    day.adherence === null ? "sem check-in" : `${day.adherence}%`
                  }`}
                  className={cn(
                    "w-4 h-4 rounded-[5px] transition-all duration-300 ease-premium hover:scale-125 hover:ring-2 hover:ring-spark-brand/30",
                    colorFor(day.adherence),
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// BAR CHART
// =================================================================

function AdherenceBarChart({
  rows,
  range,
}: {
  rows: SummaryResponse["rows"];
  range: { from: string; to: string };
}) {
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
  const width = Math.max(280, days.length * 28);
  const barWidth = (width - days.length * 4) / days.length;
  const height = 140;

  return (
    <SectionReveal direction="up">
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest overflow-hidden">
        <div className="mb-4">
          <div className="text-eyebrow text-spark-brand mb-1">✦ por dia</div>
          <div className="text-fluid-title font-extrabold text-spark-ink tracking-tight">
            % Rotina TTS
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <svg width={width} height={height + 12} className="block">
            <defs>
              <linearGradient id="barGradGood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.16 150)" />
                <stop offset="100%" stopColor="oklch(0.55 0.16 150)" />
              </linearGradient>
              <linearGradient id="barGradMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.22 350)" />
                <stop offset="100%" stopColor="oklch(0.50 0.22 345)" />
              </linearGradient>
              <linearGradient id="barGradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.88 0.10 340)" />
                <stop offset="100%" stopColor="oklch(0.80 0.10 340)" />
              </linearGradient>
            </defs>
            {days.map((day, i) => {
              const barHeight = Math.max(2, (day.adherence / 100) * height);
              const x = i * (barWidth + 4);
              const y = height - barHeight;
              const fill =
                day.adherence >= 80
                  ? "url(#barGradGood)"
                  : day.adherence >= 50
                    ? "url(#barGradMid)"
                    : "url(#barGradLow)";
              return (
                <g key={day.date}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill={fill}
                    className="transition-all duration-700 ease-premium"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// CHECKINS TABLE
// =================================================================

function CheckinsTable({ rows }: { rows: SummaryResponse["rows"] }) {
  if (rows.length === 0) {
    return (
      <SectionReveal>
        <div className="relative overflow-hidden rounded-spark-2xl bg-spark-surface border border-spark-hairline p-8 text-center shadow-rest">
          <SparkleField count={6} seed={777} className="opacity-40" />
          <div className="relative">
            <div className="text-[40px] mb-3">🌱</div>
            <h3 className="font-display lowercase text-fluid-title text-spark-ink leading-tight">
              sem check-ins<br />
              <span className="text-grad-brand">nesse período.</span>
            </h3>
            <p className="text-[13px] text-spark-ink-50 mt-3 leading-snug max-w-[36ch] mx-auto">
              Bora começar com o de hoje? Leva 3 min e fica registradinho aqui 💕
            </p>
            <Link
              href="/rotina/hoje"
              className="group mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep"
            >
              <Plus
                size={14}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Fazer check-in agora
            </Link>
          </div>
        </div>
      </SectionReveal>
    );
  }

  const moodEmoji = (m: CheckinRow["mood"]) =>
    MOOD_OPTIONS.find((o) => o.value === m)?.emoji ?? "—";
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SectionReveal direction="up">
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
        <div className="px-5 py-4 border-b border-spark-hairline">
          <div className="text-eyebrow text-spark-brand mb-1">✦ histórico</div>
          <div className="text-fluid-title font-extrabold text-spark-ink tracking-tight">
            {rows.length} {rows.length === 1 ? "dia registrado" : "dias registrados"}
          </div>
        </div>
        <div className="divide-y divide-spark-hairline">
          {sorted.map((r) => (
            <Link
              key={r.date}
              href="/rotina/hoje"
              className="group px-5 py-4 flex items-center gap-4 hover:bg-spark-surface-sunken/40 transition-colors duration-300"
            >
              <div className="w-11 h-11 rounded-2xl bg-spark-brand-soft flex items-center justify-center text-[22px] shrink-0">
                {moodEmoji(r.mood)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-extrabold text-spark-ink tracking-tight">
                  {smartDateLabel(r.date)}
                </div>
                <div className="text-[11.5px] text-spark-ink-50 mt-0.5 font-mono">
                  {r.videos_posted} vídeos
                  {r.sales_brl && r.sales_brl > 0
                    ? ` · R$ ${r.sales_brl.toFixed(0)}`
                    : ""}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-[18px] font-extrabold tracking-tight leading-none",
                    r.adherence >= 80
                      ? "text-good"
                      : r.adherence >= 50
                        ? "text-spark-brand-deep"
                        : "text-spark-ink-70",
                  )}
                >
                  {r.adherence}%
                </div>
                <div className="text-[9.5px] text-spark-ink-50 font-extrabold uppercase tracking-wider mt-0.5">
                  aderência
                </div>
              </div>
              <ChevronRight
                size={14}
                strokeWidth={2}
                className="text-spark-ink-35 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-spark-brand"
              />
            </Link>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// BODY
// =================================================================

function EvolucaoBody({ desktop = false }: { desktop?: boolean }) {
  const [period, setPeriod] = React.useState<Period>("7d");
  const { data, loading } = useSummary(period);
  const streak = useStreak();

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection desktop={desktop} />

      <section className={`relative ${desktop ? "px-12 pb-12" : "px-5 pb-8"}`}>
        <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
          <StreakHero streak={streak} />

          <div className="mt-7">
            <PeriodChips period={period} onChange={setPeriod} />
          </div>

          <div className="mt-6">
            {loading || !data ? (
              <div className="py-16 flex justify-center">
                <LoadingSplash message="Carregando sua evolução" />
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className={`grid gap-3 mb-6 ${desktop ? "grid-cols-4" : "grid-cols-2"}`}>
                  <KpiCard
                    emoji="🎯"
                    label="aderência média"
                    value={data.current.avg_adherence}
                    prev={data.previous.avg_adherence}
                    tone="brand"
                    delay={0}
                  />
                  <KpiCard
                    emoji="📱"
                    label="vídeos postados"
                    value={data.current.videos_posted}
                    prev={data.previous.videos_posted}
                    format="int"
                    delay={80}
                  />
                  <KpiCard
                    emoji="💰"
                    label="vendas total"
                    value={data.current.sales_brl}
                    prev={data.previous.sales_brl}
                    format="money"
                    delay={160}
                  />
                  <KpiCard
                    emoji="💵"
                    label="comissão total"
                    value={data.current.commission_brl}
                    prev={data.previous.commission_brl}
                    format="money"
                    delay={240}
                  />
                </div>

                <div className="space-y-4">
                  <AdherenceBarChart rows={data.rows} range={data.range} />
                  <ConsistencyHeatmap rows={data.rows} range={data.range} />
                  <CheckinsTable rows={data.rows} />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function EvolucaoMobile() {
  return <EvolucaoBody />;
}

function EvolucaoDesktop() {
  return <EvolucaoBody desktop />;
}

export default function EvolucaoPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<EvolucaoMobile />}
        desktop={<EvolucaoDesktop />}
        active="rotina"
        customSidebar
      />
      <FloatingMainNav active="rotina" />
    </>
  );
}
