"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Minus,
  Plus,
  Check,
  ChevronDown,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";
import {
  type CheckinRow,
  type Mood,
  MOOD_OPTIONS,
  TTS_GOALS,
  calcAdherence,
  emptyCheckin,
  todayBrazil,
} from "@/lib/checkin-config";

/**
 * /rotina/hoje — check-in diário editorial premium.
 *
 * Estrutura:
 *   • Hero radial com Tanker "como foi / seu dia?"
 *   • Hero card grande com ring SVG de aderência + CountUp + dots indicators
 *   • Atalhos pra evolução e referência
 *   • 4 seções accordion com cards premium
 *   • Save bar flutuante glass
 *   • FloatingMainNav lateral
 */

function useTodayCheckin(): {
  checkin: CheckinRow | null;
  loading: boolean;
  setCheckin: React.Dispatch<React.SetStateAction<CheckinRow | null>>;
} {
  const [checkin, setCheckin] = React.useState<CheckinRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const today = todayBrazil();
    fetch(`/api/checkins?date=${today}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { checkin: CheckinRow | null } | null) => {
        setCheckin(data?.checkin ?? emptyCheckin(today));
      })
      .catch(() => setCheckin(emptyCheckin(today)))
      .finally(() => setLoading(false));
  }, []);
  return { checkin, loading, setCheckin };
}

// =================================================================
// HERO COMPACT
// =================================================================

function HeroSection({ desktop }: { desktop: boolean }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: desktop ? "56px" : "32px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
      <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
      <SparkleField count={12} seed={911} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[860px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra home
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ check-in de hoje
            </div>
            <div className="mt-3 text-[12.5px] text-spark-ink-50 font-mono first-letter:capitalize">
              {dateLabel}
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="ROTINA TTS · 2026 · " emoji="🌷" size={108} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={200} durationMs={800}>
          <h1
            className="mt-5 font-display lowercase leading-[0.92] tracking-tight"
            style={{
              fontSize: desktop ? "clamp(2.5rem, 5vw, 4.5rem)" : "clamp(2rem, 8vw, 3.25rem)",
            }}
          >
            <span className="text-spark-ink">como foi </span>
            <span className="text-grad-brand">seu dia?</span>
          </h1>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// ADERÊNCIA HERO (ring SVG + CountUp + dots)
// =================================================================

function AdherenceHero({
  adherence,
  completed,
  total,
}: {
  adherence: number;
  completed: number;
  total: number;
}) {
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (adherence / 100) * circumference;
  const message =
    adherence >= 80
      ? "tá voando 🚀"
      : adherence >= 50
        ? "tá rolando bem"
        : adherence > 0
          ? "bora dar gás"
          : "marca o que já fez";

  return (
    <SectionReveal direction="up">
      <div className="relative rounded-spark-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white p-6 sm:p-8 overflow-hidden shadow-hero">
        <SparkleField count={8} seed={203} color="rgba(255,255,255,0.65)" className="opacity-70" />
        <div
          aria-hidden
          className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/15 blur-3xl animate-blob-1"
        />

        <div className="relative flex items-center gap-5 sm:gap-6">
          {/* Ring SVG GIGANTE */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-premium drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-extrabold tracking-tight leading-none text-[28px] sm:text-[34px]">
                <CountUp value={adherence} suffix="%" durationMs={900} />
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-eyebrow text-white/80">
              ✦ aderência de hoje
            </div>
            <div
              className="mt-2 font-display lowercase leading-tight tracking-tight"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}
            >
              {message}
            </div>
            <div className="mt-3 text-[13px] opacity-90 font-semibold">
              <CountUp value={completed} durationMs={700} /> de {total} itens completos
            </div>
          </div>
        </div>

        {/* 11 dots indicators no bottom */}
        <div className="relative mt-6 flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500 ease-premium",
                i < completed ? "bg-white" : "bg-white/25",
              )}
            />
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// SHORTCUTS
// =================================================================

function Shortcuts() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SectionReveal direction="left" delay={150}>
        <Link
          href="/rotina/evolucao"
          className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 hover-lift shadow-rest"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
              <TrendingUp size={18} strokeWidth={2.2} />
            </div>
            <ArrowUpRight
              size={14}
              strokeWidth={2.2}
              className="text-spark-ink-35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-spark-brand"
            />
          </div>
          <div className="text-[13.5px] font-extrabold tracking-tight text-spark-ink">
            Evolução
          </div>
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
            Gráficos e KPIs
          </div>
        </Link>
      </SectionReveal>

      <SectionReveal direction="right" delay={200}>
        <Link
          href="/rotina/referencia"
          className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 hover-lift shadow-rest"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
              <BookOpen size={18} strokeWidth={2.2} />
            </div>
            <ArrowUpRight
              size={14}
              strokeWidth={2.2}
              className="text-spark-ink-35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-spark-brand"
            />
          </div>
          <div className="text-[13.5px] font-extrabold tracking-tight text-spark-ink">
            Rotina ideal
          </div>
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
            Dia completo Yara
          </div>
        </Link>
      </SectionReveal>
    </div>
  );
}

// =================================================================
// SECTION ACCORDION (formato magazine premium)
// =================================================================

function SectionAccordion({
  emoji,
  title,
  hint,
  badge,
  open,
  onToggle,
  children,
}: {
  emoji: string;
  title: string;
  hint?: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <SectionReveal direction="up">
      <section className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-spark-surface-sunken/40 transition-colors duration-300"
        >
          <div className="w-12 h-12 rounded-full bg-brand-grad-soft flex items-center justify-center text-[22px] shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-extrabold text-spark-ink tracking-tight">
              {title}
            </div>
            {hint && (
              <div className="text-[11.5px] text-spark-ink-50 mt-0.5 leading-snug">{hint}</div>
            )}
          </div>
          {badge && (
            <span className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-full bg-spark-brand-soft text-spark-brand-deep">
              {badge}
            </span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={cn(
              "text-spark-ink-50 transition-transform duration-300 shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
        {open && <div className="px-5 pb-5 pt-1 space-y-3">{children}</div>}
      </section>
    </SectionReveal>
  );
}

// =================================================================
// STEPPER PREMIUM
// =================================================================

function Stepper({
  label,
  emoji,
  value,
  goal,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number;
  goal: number;
  onChange: (v: number) => void;
}) {
  const reached = value >= goal;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300 ease-premium",
        reached
          ? "bg-good/10 border-good/40 shadow-[0_4px_14px_-6px_oklch(0.62_0.16_150/0.3)]"
          : "bg-spark-surface-sunken/40 border-spark-hairline",
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[20px]" aria-hidden>
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight">
            {label}
          </div>
          <div className="text-[11px] text-spark-ink-50 mt-0.5">
            Meta: <strong>{goal}</strong>
          </div>
        </div>
        {reached && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-good uppercase tracking-wider">
            <Check size={11} strokeWidth={3} />
            bateu
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="Diminuir"
          className="w-12 h-12 rounded-full bg-white border border-spark-hairline flex items-center justify-center text-spark-ink active:scale-95 hover:border-spark-brand/40 transition-all duration-300 ease-premium disabled:opacity-40 disabled:hover:border-spark-hairline"
          disabled={value <= 0}
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center">
          <span
            className={cn(
              "font-extrabold tracking-tight leading-none",
              reached ? "text-good" : "text-spark-ink",
            )}
            style={{ fontSize: "clamp(1.75rem, 5vw, 2.25rem)" }}
          >
            {value}
          </span>
          <span className="text-spark-ink-50 text-[16px] font-bold">/{goal}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          aria-label="Aumentar"
          className="w-12 h-12 rounded-full bg-spark-ink text-white flex items-center justify-center active:scale-95 hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-lift"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// =================================================================
// TOGGLE CARD PREMIUM
// =================================================================

function ToggleCard({
  emoji,
  label,
  hint,
  checked,
  onToggle,
}: {
  emoji: string;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "w-full text-left rounded-2xl border p-4 flex items-center gap-3 transition-all duration-300 ease-premium active:scale-[0.98]",
        checked
          ? "bg-good/10 border-good/40 shadow-[0_4px_14px_-6px_oklch(0.62_0.16_150/0.3)]"
          : "bg-spark-surface-sunken/40 border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-surface",
      )}
    >
      <span className="text-[22px] shrink-0" aria-hidden>
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight tracking-tight">
          {label}
        </div>
        {hint && (
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5 leading-snug">{hint}</div>
        )}
      </div>
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ease-premium",
          checked
            ? "bg-good text-white scale-110 shadow-[0_4px_12px_-4px_oklch(0.62_0.16_150/0.6)]"
            : "bg-white border border-spark-hairline",
        )}
      >
        {checked && <Check size={16} strokeWidth={3} />}
      </div>
    </button>
  );
}

// =================================================================
// NUMBER INPUT PREMIUM
// =================================================================

function NumberInput({
  label,
  emoji,
  placeholder,
  prefix,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  placeholder: string;
  prefix?: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [local, setLocal] = React.useState(value != null ? String(value) : "");
  React.useEffect(() => {
    setLocal(value != null ? String(value) : "");
  }, [value]);
  return (
    <div>
      <label className="flex items-center gap-1.5 text-eyebrow text-spark-ink mb-2">
        <span className="text-[14px] leading-none">{emoji}</span>
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-4 text-[14px] text-spark-ink-50 font-bold pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={local}
          onChange={(e) => {
            const v = e.target.value.replace(",", ".");
            setLocal(e.target.value);
            if (v === "") {
              onChange(null);
            } else {
              const n = parseFloat(v);
              if (Number.isFinite(n) && n >= 0) onChange(n);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full py-3 rounded-2xl border border-spark-hairline bg-white text-[15px] font-bold text-spark-ink placeholder:text-spark-ink-35 placeholder:font-normal focus:outline-none focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 transition-all duration-200",
            prefix ? "pl-11" : "pl-4",
            "pr-4",
          )}
        />
      </div>
    </div>
  );
}

// =================================================================
// MOOD PICKER PREMIUM
// =================================================================

function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (v: Mood | null) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOOD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? null : opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all duration-300 ease-premium active:scale-95",
              active
                ? "bg-spark-brand-soft border-spark-brand shadow-lift-brand"
                : "bg-spark-surface-sunken/40 border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-surface",
            )}
          >
            <span
              className={cn(
                "text-[28px] transition-transform duration-300",
                active && "scale-110",
              )}
              aria-hidden
            >
              {opt.emoji}
            </span>
            <span
              className={cn(
                "text-[10.5px] font-extrabold tracking-tight",
                active ? "text-spark-brand-deep" : "text-spark-ink-70",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =================================================================
// ENERGY SLIDER PREMIUM
// =================================================================

function EnergySlider({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-eyebrow text-spark-ink mb-2">
        ⚡ energia do dia
      </label>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? null : n)}
              aria-pressed={active}
              className={cn(
                "py-3 rounded-2xl border text-[15px] font-extrabold transition-all duration-300 ease-premium active:scale-95",
                active
                  ? "bg-spark-ink text-white border-spark-ink shadow-lift"
                  : "bg-spark-surface-sunken/40 border-spark-hairline text-spark-ink-50 hover:text-spark-ink hover:border-spark-brand/40 hover:bg-spark-surface",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// SAVE BAR
// =================================================================

function SaveBar({
  desktop,
  onSave,
  saving,
  adherence,
}: {
  desktop: boolean;
  onSave: () => void;
  saving: boolean;
  adherence: number;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 px-4 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
    >
      <div
        className={cn(
          "mx-auto pointer-events-auto glass rounded-full shadow-lift flex items-center gap-2 p-2",
          desktop ? "max-w-[680px]" : "max-w-full",
        )}
      >
        <div className="flex-1 pl-4 text-[12px] text-spark-ink-50 hidden sm:block">
          {adherence}% da rotina hoje · não precisa fechar tudo 💕
        </div>
        <div className="flex-1 sm:hidden pl-3 text-[11px] text-spark-ink-50">
          {adherence}% da rotina
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <Save size={14} strokeWidth={2.5} />
          {saving ? "Salvando..." : "Salvar check-in"}
          <ArrowUpRight
            size={14}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </button>
      </div>
    </div>
  );
}

// =================================================================
// BODY PRINCIPAL
// =================================================================

type SectionState = {
  trabalho: boolean;
  pessoal: boolean;
  resultados: boolean;
  reflexao: boolean;
};

function RotinaHojeBody({ desktop = false }: { desktop?: boolean }) {
  const toast = useToast();
  const { checkin, loading, setCheckin } = useTodayCheckin();
  const [saving, setSaving] = React.useState(false);
  const [sections, setSections] = React.useState<SectionState>({
    trabalho: true,
    pessoal: true,
    resultados: false,
    reflexao: true,
  });

  const update = React.useCallback(
    <K extends keyof CheckinRow>(key: K, value: CheckinRow[K]) => {
      setCheckin((c) => (c ? { ...c, [key]: value } : c));
    },
    [setCheckin],
  );

  const adherence = React.useMemo(
    () => (checkin ? calcAdherence(checkin) : 0),
    [checkin],
  );

  const completedCount = React.useMemo(() => {
    if (!checkin) return 0;
    let n = 0;
    if (checkin.videos_posted >= TTS_GOALS.videos_posted) n += 1;
    if (checkin.videos_recorded >= TTS_GOALS.videos_recorded) n += 1;
    if (checkin.live_chat_done) n += 1;
    if (checkin.live_shop_done) n += 1;
    if (checkin.analytics_done) n += 1;
    if (checkin.comms_done) n += 1;
    if (checkin.skincare_morning) n += 1;
    if (checkin.skincare_night) n += 1;
    if (checkin.supplementation) n += 1;
    if (checkin.gym) n += 1;
    if (checkin.sleep_hygiene) n += 1;
    return n;
  }, [checkin]);

  // Contadores por seção pra badge
  const trabalhoCount = React.useMemo(() => {
    if (!checkin) return { done: 0, total: 6 };
    let done = 0;
    if (checkin.videos_posted >= TTS_GOALS.videos_posted) done += 1;
    if (checkin.videos_recorded >= TTS_GOALS.videos_recorded) done += 1;
    if (checkin.live_chat_done) done += 1;
    if (checkin.live_shop_done) done += 1;
    if (checkin.analytics_done) done += 1;
    if (checkin.comms_done) done += 1;
    return { done, total: 6 };
  }, [checkin]);

  const pessoalCount = React.useMemo(() => {
    if (!checkin) return { done: 0, total: 5 };
    let done = 0;
    if (checkin.skincare_morning) done += 1;
    if (checkin.skincare_night) done += 1;
    if (checkin.supplementation) done += 1;
    if (checkin.gym) done += 1;
    if (checkin.sleep_hygiene) done += 1;
    return { done, total: 5 };
  }, [checkin]);

  const handleSave = async () => {
    if (!checkin) return;
    setSaving(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(checkin),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        checkin?: CheckinRow;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Não consegui salvar agora.");
        return;
      }
      if (data.checkin) setCheckin(data.checkin);
      const adh = data.checkin ? calcAdherence(data.checkin) : 0;
      toast.success(`Check-in salvo! ${adh}% da rotina TTS hoje 💕`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !checkin) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Carregando seu dia" />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 96 : 160 }}
    >
      <HeroSection desktop={desktop} />

      {/* Aderência hero + shortcuts + sections */}
      <section className={`relative ${desktop ? "px-12" : "px-5"} pb-12`}>
        <div className={desktop ? "max-w-[680px] mx-auto" : ""}>
          <AdherenceHero
            adherence={adherence}
            completed={completedCount}
            total={11}
          />

          <div className="mt-5">
            <Shortcuts />
          </div>

          <div className="mt-7 space-y-3">
            <SectionAccordion
              emoji="☀️"
              title="Trabalho"
              hint="Vídeos, lives, análise, comms"
              badge={`${trabalhoCount.done}/${trabalhoCount.total}`}
              open={sections.trabalho}
              onToggle={() => setSections((s) => ({ ...s, trabalho: !s.trabalho }))}
            >
              <Stepper
                label="Vídeos postados"
                emoji="📱"
                value={checkin.videos_posted}
                goal={TTS_GOALS.videos_posted}
                onChange={(v) => update("videos_posted", v)}
              />
              <Stepper
                label="Vídeos gravados (lote)"
                emoji="🎬"
                value={checkin.videos_recorded}
                goal={TTS_GOALS.videos_recorded}
                onChange={(v) => update("videos_recorded", v)}
              />
              <ToggleCard
                emoji="🔴"
                label="Live Bate-papo"
                hint="Conexão da manhã"
                checked={checkin.live_chat_done}
                onToggle={() => update("live_chat_done", !checkin.live_chat_done)}
              />
              <ToggleCard
                emoji="🛍️"
                label="Live Shop"
                hint="Vendas em tempo real"
                checked={checkin.live_shop_done}
                onToggle={() => update("live_shop_done", !checkin.live_shop_done)}
              />
              <ToggleCard
                emoji="📊"
                label="Análise de métricas"
                hint="Retenção, ganchos, faturamento"
                checked={checkin.analytics_done}
                onToggle={() => update("analytics_done", !checkin.analytics_done)}
              />
              <ToggleCard
                emoji="💬"
                label="Lote de comunicação"
                hint="Comentários, WhatsApp, e-mail"
                checked={checkin.comms_done}
                onToggle={() => update("comms_done", !checkin.comms_done)}
              />
            </SectionAccordion>

            <SectionAccordion
              emoji="💕"
              title="Autocuidado"
              hint="Skincare, suplementos, treino, sono"
              badge={`${pessoalCount.done}/${pessoalCount.total}`}
              open={sections.pessoal}
              onToggle={() => setSections((s) => ({ ...s, pessoal: !s.pessoal }))}
            >
              <ToggleCard
                emoji="☀️"
                label="Skincare manhã"
                checked={checkin.skincare_morning}
                onToggle={() => update("skincare_morning", !checkin.skincare_morning)}
              />
              <ToggleCard
                emoji="🌙"
                label="Skincare noite"
                checked={checkin.skincare_night}
                onToggle={() => update("skincare_night", !checkin.skincare_night)}
              />
              <ToggleCard
                emoji="💊"
                label="Suplementação"
                checked={checkin.supplementation}
                onToggle={() => update("supplementation", !checkin.supplementation)}
              />
              <ToggleCard
                emoji="🏋️"
                label="Academia"
                checked={checkin.gym}
                onToggle={() => update("gym", !checkin.gym)}
              />
              <ToggleCard
                emoji="🛌"
                label="Higiene do sono"
                hint="Sem tela depois das 22h"
                checked={checkin.sleep_hygiene}
                onToggle={() => update("sleep_hygiene", !checkin.sleep_hygiene)}
              />
            </SectionAccordion>

            <SectionAccordion
              emoji="📊"
              title="Resultados do dia"
              hint="3 números (opcional)"
              open={sections.resultados}
              onToggle={() => setSections((s) => ({ ...s, resultados: !s.resultados }))}
            >
              <NumberInput
                label="vendas (live shop + dia)"
                emoji="💰"
                placeholder="0,00"
                prefix="R$"
                value={checkin.sales_brl}
                onChange={(v) => update("sales_brl", v)}
              />
              <NumberInput
                label="comissão estimada"
                emoji="💵"
                placeholder="0,00"
                prefix="R$"
                value={checkin.commission_brl}
                onChange={(v) => update("commission_brl", v)}
              />
              <NumberInput
                label="views totais"
                emoji="👀"
                placeholder="0"
                value={checkin.total_views}
                onChange={(v) => update("total_views", v == null ? null : Math.round(v))}
              />
            </SectionAccordion>

            <SectionAccordion
              emoji="🌷"
              title="Como você se sentiu?"
              hint="Mood + energia + nota"
              open={sections.reflexao}
              onToggle={() => setSections((s) => ({ ...s, reflexao: !s.reflexao }))}
            >
              <div>
                <label className="block text-eyebrow text-spark-ink mb-2">
                  😊 humor
                </label>
                <MoodPicker
                  value={checkin.mood}
                  onChange={(v) => update("mood", v)}
                />
              </div>
              <EnergySlider
                value={checkin.energy_level}
                onChange={(v) => update("energy_level", v)}
              />
              <div>
                <label className="block text-eyebrow text-spark-ink mb-2">
                  📝 nota livre (opcional)
                </label>
                <textarea
                  value={checkin.notes ?? ""}
                  onChange={(e) => update("notes", e.target.value.slice(0, 500))}
                  placeholder="O que você quer lembrar desse dia?"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-2xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 transition-all duration-200 resize-none"
                />
              </div>
            </SectionAccordion>
          </div>
        </div>
      </section>

      <SaveBar
        desktop={desktop}
        onSave={handleSave}
        saving={saving}
        adherence={adherence}
      />
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function RotinaHojeMobile() {
  return <RotinaHojeBody />;
}

function RotinaHojeDesktop() {
  return <RotinaHojeBody desktop />;
}

export default function RotinaHojePage() {
  return (
    <>
      <ResponsiveShell
        mobile={<RotinaHojeMobile />}
        desktop={<RotinaHojeDesktop />}
        active="rotina"
        customSidebar
      />
      <FloatingMainNav active="rotina" />
    </>
  );
}
