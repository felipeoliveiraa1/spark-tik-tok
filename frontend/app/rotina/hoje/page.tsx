"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Check,
  CheckCircle2,
  Activity,
  Clock,
  Lock,
  RotateCcw,
  Flame,
  ArrowRight,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { HelpMenu } from "@/components/molecules/help-menu";
import { type TutorialStep } from "@/lib/tutorial";
// Fuso do Brasil — toISOString().slice(0,10) usa UTC e fazia rotina
// completada apos 21h BRT virar "amanha" no servidor, daí o dia
// seguinte aparecia ja-trancado quando a aluna abria o app.
import { todayBrazil as todayISO } from "@/lib/checkin-config";

// =================================================================
// TYPES
// =================================================================

type HabitCategory = "trabalho" | "pessoal" | "resultado" | "custom";

type Habit = {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: HabitCategory;
  order_index: number;
  is_active: boolean;
  scheduled_time: string | null;
};

type Completion = {
  date: string;
  completed_at: string;
  habits_done: number;
  habits_total: number;
} | null;

const CATEGORY_LABELS: Record<HabitCategory, { label: string; emoji: string }> = {
  trabalho: { label: "Trabalho", emoji: "💼" },
  pessoal: { label: "Pessoal", emoji: "🌸" },
  resultado: { label: "Resultado", emoji: "📈" },
  custom: { label: "Meus", emoji: "✨" },
};

function fmtDateBR(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// =================================================================
// HOOK
// =================================================================

function useRoutine() {
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [completion, setCompletion] = React.useState<Completion>(null);
  const [streak, setStreak] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const [chRes, strRes] = await Promise.all([
      fetch(`/api/rotina/checkin?date=${todayISO()}`, { cache: "no-store" }),
      fetch("/api/checkins/streak", { cache: "no-store" }),
    ]);
    if (chRes.ok) {
      const data = (await chRes.json()) as {
        habits: Habit[];
        checked: string[];
        completion: Completion;
      };
      setHabits(data.habits);
      setChecked(new Set(data.checked));
      setCompletion(data.completion);
    }
    if (strRes.ok) {
      const data = (await strRes.json()) as { streak?: number; current?: number };
      setStreak(data.streak ?? data.current ?? 0);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { habits, checked, completion, streak, loading, refresh, setChecked };
}

// =================================================================
// CELEBRATION VIEW (após concluir o dia)
// =================================================================

function CelebrationView({
  completion,
  streak,
  desktop,
  onReopen,
}: {
  completion: Completion;
  streak: number;
  desktop: boolean;
  onReopen: () => void;
}) {
  const pct =
    completion && completion.habits_total > 0
      ? Math.round((completion.habits_done / completion.habits_total) * 100)
      : 0;

  return (
    <div
      className="flex-1 overflow-auto relative hero-radial"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[500px] h-[500px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/4 w-[460px] h-[460px]" />
      <SparkleField count={20} seed={2026} className="opacity-65" />

      <section
        className={`relative ${desktop ? "px-12 max-w-[760px] mx-auto" : "px-5"}`}
        style={{
          paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
          paddingBottom: desktop ? "64px" : "48px",
        }}
      >
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra home
          </Link>
        </SectionReveal>

        <div className="mt-16 text-center">
          <SectionReveal direction="scale" durationMs={700}>
            <div className="text-[64px] mb-2 animate-float">🎉</div>
          </SectionReveal>

          <SectionReveal direction="up" delay={150} durationMs={900}>
            <h1
              className="font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
            >
              você <span className="text-grad-brand">bateu hoje.</span>
            </h1>
          </SectionReveal>

          <SectionReveal direction="up" delay={350}>
            <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[40ch] mx-auto leading-snug font-semibold">
              Próxima rotina libera amanhã. Por enquanto, descansa ou avança em outra parte do
              método.
            </p>
          </SectionReveal>

          {/* Stats card */}
          <SectionReveal direction="up" delay={500}>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-[460px] mx-auto">
              <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest">
                <div className="text-eyebrow text-spark-brand-deep mb-1.5 flex items-center justify-center gap-1.5">
                  <Flame size={11} strokeWidth={2.5} />
                  streak
                </div>
                <div
                  className="font-display lowercase tracking-tight leading-none text-spark-ink"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
                >
                  {streak}
                </div>
                <div className="mt-1.5 text-[11px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
                  {streak === 1 ? "dia" : "dias"}
                </div>
              </div>
              <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-5 shadow-rest">
                <div className="text-eyebrow text-spark-brand-deep mb-1.5">aderência</div>
                <div
                  className="font-display lowercase tracking-tight leading-none text-spark-brand-deep"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
                >
                  {pct}%
                </div>
                <div className="mt-1.5 text-[11px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
                  {completion?.habits_done ?? 0} de {completion?.habits_total ?? 0} hábitos
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* Lock notice */}
          <SectionReveal direction="up" delay={700}>
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass border border-spark-hairline text-[12px] font-extrabold text-spark-ink-70 uppercase tracking-wider">
              <Lock size={12} strokeWidth={2.5} />
              dia trancado · libera amanhã às 00h
            </div>
          </SectionReveal>

          {/* Próximos passos */}
          <SectionReveal direction="up" delay={850}>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[600px] mx-auto">
              <Link
                href="/educacao"
                className="group p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift transition-all duration-300 ease-premium"
              >
                <div className="text-[28px] mb-2">🎓</div>
                <div className="text-[13px] font-extrabold text-spark-ink group-hover:text-spark-brand-deep transition-colors">
                  Ver uma aula
                </div>
                <div className="text-[11px] text-spark-ink-50 mt-1">Avança no método</div>
              </Link>
              <Link
                href="/scripts"
                className="group p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift transition-all duration-300 ease-premium"
              >
                <div className="text-[28px] mb-2">✍️</div>
                <div className="text-[13px] font-extrabold text-spark-ink group-hover:text-spark-brand-deep transition-colors">
                  Criar script
                </div>
                <div className="text-[11px] text-spark-ink-50 mt-1">Gera o próximo</div>
              </Link>
              <Link
                href="/rotina/evolucao"
                className="group p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift transition-all duration-300 ease-premium"
              >
                <div className="text-[28px] mb-2">📊</div>
                <div className="text-[13px] font-extrabold text-spark-ink group-hover:text-spark-brand-deep transition-colors">
                  Ver evolução
                </div>
                <div className="text-[11px] text-spark-ink-50 mt-1">Tua trajetória</div>
              </Link>
            </div>
          </SectionReveal>

          {/* Reabrir (caso erro) */}
          <SectionReveal direction="up" delay={1000}>
            <button
              type="button"
              onClick={onReopen}
              className="mt-10 inline-flex items-center gap-1.5 text-[11.5px] text-spark-ink-50 hover:text-spark-ink underline underline-offset-2 font-extrabold uppercase tracking-wider transition-colors"
            >
              <RotateCcw size={11} strokeWidth={2.5} />
              Marquei errado · destrancar
            </button>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}

// =================================================================
// MAIN VIEW (em aberto)
// =================================================================

function HabitRow({
  habit,
  checked,
  onToggle,
}: {
  habit: Habit;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "group flex w-full items-center gap-4 p-4 rounded-spark-2xl border text-left transition-all duration-300 ease-premium",
        checked
          ? "bg-good/5 border-good/25 shadow-rest"
          : "bg-spark-surface border-spark-hairline hover:border-spark-brand/30 hover:shadow-lift hover:-translate-y-0.5 shadow-rest",
      )}
    >
      {/* Horario (se setado) — pill com hora */}
      {habit.scheduled_time ? (
        <div
          className={cn(
            "shrink-0 inline-flex flex-col items-center justify-center w-[58px] py-1.5 rounded-spark-xl transition-all duration-300",
            checked
              ? "bg-good/10 text-good/70"
              : "bg-spark-brand-soft/60 text-spark-brand-deep",
          )}
        >
          <Clock size={10} strokeWidth={2.5} className="opacity-60" />
          <span className="text-[12.5px] font-extrabold font-mono leading-none mt-0.5">
            {habit.scheduled_time}
          </span>
        </div>
      ) : (
        <div className="shrink-0 w-[58px]" aria-hidden />
      )}

      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-premium",
          checked
            ? "bg-good text-white shadow-lift"
            : "bg-spark-surface border-2 border-spark-hairline group-hover:border-spark-brand/40",
        )}
      >
        {checked && <Check size={18} strokeWidth={3} />}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <span className="text-[22px] leading-none shrink-0" aria-hidden>
          {habit.emoji}
        </span>
        <span
          className={cn(
            "text-[14.5px] leading-snug font-semibold transition-all duration-300 truncate",
            checked ? "text-spark-ink-50 line-through decoration-good/50" : "text-spark-ink",
          )}
        >
          {habit.label}
        </span>
      </div>
    </button>
  );
}

function RoutineView({
  habits,
  checked,
  streak,
  desktop,
  onToggle,
  onComplete,
  onReopenTour,
}: {
  habits: Habit[];
  checked: Set<string>;
  streak: number;
  desktop: boolean;
  onToggle: (id: string) => void;
  onComplete: () => void;
  onReopenTour: () => void;
}) {
  const total = habits.length;
  const done = habits.filter((h) => checked.has(h.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const grouped = React.useMemo(() => {
    const byCat = new Map<HabitCategory, Habit[]>();
    for (const h of habits) {
      const arr = byCat.get(h.category) ?? [];
      arr.push(h);
      byCat.set(h.category, arr);
    }
    // Ordena dentro de cada categoria: com horario primeiro (por hora
    // crescente), depois os sem horario pela ordem original.
    for (const [, arr] of byCat) {
      arr.sort((a, b) => {
        if (a.scheduled_time && b.scheduled_time) {
          return a.scheduled_time.localeCompare(b.scheduled_time);
        }
        if (a.scheduled_time) return -1;
        if (b.scheduled_time) return 1;
        return a.order_index - b.order_index;
      });
    }
    return Array.from(byCat.entries());
  }, [habits]);

  const ctaButton = (
    <button
      type="button"
      onClick={onComplete}
      disabled={done === 0}
      data-tutorial-id="rotina-cta"
      className={cn(
        "group w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-[14px] font-extrabold shadow-hero transition-all duration-300 ease-premium hover:-translate-y-0.5 active:translate-y-0",
        done === 0
          ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
          : "bg-brand-grad text-white",
      )}
    >
      <CheckCircle2
        size={16}
        strokeWidth={2.5}
        className="transition-transform duration-300 group-hover:scale-110"
      />
      {done === 0
        ? "Marque pelo menos 1 hábito"
        : `Concluir dia · ${done} de ${total} feitos`}
      {done > 0 && (
        <ArrowRight
          size={14}
          strokeWidth={2.5}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      )}
    </button>
  );

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{
        // Mobile precisa de room pra: floating nav (~80px) + sticky button (~80px) + folga
        // Desktop o botao virou inline, entao basta um padding pequeno.
        paddingBottom: desktop ? 48 : "calc(env(safe-area-inset-bottom) + 210px)",
      }}
    >
      {/* Hero */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
          paddingBottom: desktop ? "48px" : "32px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
        <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[460px] h-[460px]" />
        <SparkleField count={12} seed={616} className="opacity-55" />

        <div className={`relative ${desktop ? "px-12 max-w-[720px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Voltar
              </Link>
              <div className="flex items-center gap-2">
                <HelpMenu onReopenTour={onReopenTour} />
                <Link
                  data-tutorial-id="rotina-edit"
                  href="/rotina/editar"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink text-[12px] font-extrabold hover:bg-spark-brand-soft hover:text-spark-brand-deep hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-rest"
                >
                  <Pencil size={12} strokeWidth={2.5} />
                  Editar minha rotina
                </Link>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={800}>
            <div data-tutorial-id="rotina-header">
              <div className="text-eyebrow text-spark-brand-deep first-letter:capitalize mt-7">
                ✦ {fmtDateBR(todayISO())}
                {streak > 0 && (
                  <>
                    <span className="mx-2 opacity-50">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Flame size={11} strokeWidth={2.5} />
                      streak {streak} {streak === 1 ? "dia" : "dias"}
                    </span>
                  </>
                )}
              </div>
              <h1
                className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
                style={{ fontSize: "clamp(2.25rem, 7vw, 4.5rem)" }}
              >
                rotina <span className="text-grad-brand">de hoje.</span>
              </h1>
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <div data-tutorial-id="rotina-progress" className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-2.5 rounded-full bg-spark-surface-sunken overflow-hidden border border-spark-hairline">
                <div
                  className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="font-display lowercase leading-none text-spark-ink text-[28px] shrink-0">
                {done}
                <span className="text-spark-ink-50 text-[20px]">/{total}</span>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Lista */}
      <section
        data-tutorial-id="rotina-list"
        className={`relative ${desktop ? "px-12 py-8" : "px-5 py-6"}`}
      >
        <div className={desktop ? "max-w-[720px] mx-auto" : ""}>
          {habits.length === 0 ? (
            <SectionReveal direction="up">
              <div className="text-center py-16 px-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline">
                <Activity size={40} strokeWidth={1.6} className="mx-auto text-spark-ink-50 mb-3" />
                <div className="font-display lowercase text-spark-ink text-[24px]">
                  rotina vazia.
                </div>
                <p className="mt-2 text-[13px] text-spark-ink-50 max-w-[36ch] mx-auto">
                  Adiciona seus primeiros hábitos pra começar a marcar dia a dia.
                </p>
                <div className="mt-6">
                  <Link
                    href="/rotina/editar"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift hover:-translate-y-0.5 transition-all duration-300 ease-premium"
                  >
                    <Pencil size={13} strokeWidth={2.5} />
                    Configurar minha rotina
                  </Link>
                </div>
              </div>
            </SectionReveal>
          ) : (
            <div className="space-y-7">
              {grouped.map(([cat, items], gi) => {
                const meta = CATEGORY_LABELS[cat];
                return (
                  <SectionReveal key={cat} delay={gi * 60}>
                    <section>
                      <div className="mb-3 inline-flex items-center gap-2 text-eyebrow text-spark-brand-deep">
                        <span className="text-[14px]">{meta.emoji}</span>
                        <span>✦ {meta.label.toLowerCase()}</span>
                      </div>
                      <div className="space-y-2.5">
                        {items.map((h) => (
                          <HabitRow
                            key={h.id}
                            habit={h}
                            checked={checked.has(h.id)}
                            onToggle={() => onToggle(h.id)}
                          />
                        ))}
                      </div>
                    </section>
                  </SectionReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA inline no flow — desktop (sob a lista, sem overlap) */}
      {habits.length > 0 && desktop && (
        <section className="relative px-12 pb-12">
          <div className="max-w-[720px] mx-auto">
            <SectionReveal direction="up">{ctaButton}</SectionReveal>
          </div>
        </section>
      )}

      {/* CTA sticky bottom — mobile (acima da floating nav) */}
      {habits.length > 0 && !desktop && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 w-full max-w-[520px] px-5"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
        >
          {/* Fade gradient atrás pra disfarcar conteudo scrollando atras */}
          <div
            aria-hidden
            className="absolute -inset-x-3 -bottom-6 -top-3 -z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, oklch(0.98 0.005 320 / 0.6) 35%, oklch(0.98 0.005 320 / 0.92) 65%)",
              filter: "blur(8px)",
            }}
          />
          {ctaButton}
        </div>
      )}
    </div>
  );
}

// =================================================================
// BODY
// =================================================================

function RotinaHojeBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const { habits, checked, completion, streak, loading, refresh, setChecked } = useRoutine();
  const confirm = useConfirm();
  const toast = useToast();

  const toggle = async (habitId: string) => {
    const wasChecked = checked.has(habitId);
    const next = new Set(checked);
    if (wasChecked) next.delete(habitId);
    else next.add(habitId);
    setChecked(next);

    const res = await fetch("/api/rotina/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ habit_id: habitId, done: !wasChecked }),
    });
    if (!res.ok) {
      setChecked(checked);
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (j?.error === "day_already_completed") {
        toast.error("Dia já tá concluído. Destranca pra editar.");
        void refresh();
      } else {
        toast.error("Não consegui salvar");
      }
    }
  };

  const completeDay = async () => {
    const done = habits.filter((h) => checked.has(h.id)).length;
    const total = habits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const ok = await confirm({
      title: `Concluir o dia? (${pct}%)`,
      description: `Você bateu ${done} de ${total} hábitos. A rotina vai travar até amanhã.`,
      confirmLabel: "Concluir dia",
    });
    if (!ok) return;

    const res = await fetch("/api/rotina/checkin/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Dia concluído! 🎉");
      await refresh();
    } else {
      toast.error("Não consegui concluir");
    }
  };

  const reopen = async () => {
    const ok = await confirm({
      title: "Destrancar o dia?",
      description: "Você vai poder editar as marcações de novo.",
      confirmLabel: "Destrancar",
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/rotina/checkin/complete?date=${todayISO()}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Dia destrancado");
      await refresh();
    } else {
      toast.error("Não consegui destrancar");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] hero-radial">
        <LoadingSplash message="Abrindo sua rotina" />
      </div>
    );
  }

  if (completion) {
    return (
      <CelebrationView
        completion={completion}
        streak={streak}
        desktop={desktop}
        onReopen={reopen}
      />
    );
  }

  return (
    <RoutineView
      habits={habits}
      checked={checked}
      streak={streak}
      desktop={desktop}
      onToggle={toggle}
      onComplete={completeDay}
      onReopenTour={onReopenTour}
    />
  );
}

// =================================================================
// PAGE
// =================================================================

function RotinaMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <RotinaHojeBody onReopenTour={onReopenTour} />;
}

// Steps do tour de Rotina (7 steps com variantes mobile/desktop pro nav)
function buildRotinaSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda à sua rotina!",
      description:
        "Consistência diária é o que separa quem posta 1x por semana de quem fatura no TikTok Shop. Em 30s te mostro como funciona.",
    },
    {
      id: "header",
      target: "rotina-header",
      title: "Dia + streak em destaque",
      description:
        "Mostra a data de hoje e quantos dias seguidos você tá batendo a rotina. Streak é o número que mais importa — quanto maior, mais firme tá o hábito.",
    },
    {
      id: "edit",
      target: "rotina-edit",
      title: "Personaliza tua rotina",
      description:
        "Esse botão abre o editor pra adicionar, tirar ou organizar os hábitos do dia. Trabalho, pessoal, resultado e os seus próprios.",
    },
    {
      id: "progress",
      target: "rotina-progress",
      title: "Seu progresso visual",
      description:
        "Barra mostra quanto você já fez do dia. Do lado, contador X/Y dos hábitos marcados. Vai enchendo enquanto você marca cada um.",
    },
    {
      id: "list",
      target: "rotina-list",
      title: "Marca cada hábito feito",
      description:
        "Toca em qualquer hábito pra marcar como feito. Eles ficam agrupados por categoria. Não precisa fazer todos — o importante é a constância, não a perfeição.",
    },
    {
      id: "cta",
      target: "rotina-cta",
      title: "Conclui o dia quando terminar",
      description:
        "Quando bater o que conseguiu, clica em Concluir dia. A rotina trava até amanhã e seu streak vai +1. Marcou errado? Tem botão pra destrancar.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! bora bater hoje 💕",
      description:
        "Foca em fazer pelo menos 1 hábito todo dia. Streak quebrado não é fracasso, é só recomeço. Pra refazer o tour, clica no ✨ Tour no topo.",
    },
  ];
}

function RotinaHojePageContent() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildRotinaSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <ResponsiveShell
        mobile={<RotinaMobile onReopenTour={reopenTour} />}
        desktop={<RotinaHojeBody desktop onReopenTour={reopenTour} />}
        active="rotina"
        customSidebar
      />
      <FloatingMainNav active="rotina" />
      <TutorialOverlay
        steps={steps}
        storageKey="rotina"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function RotinaHojePage() {
  return <RotinaHojePageContent />;
}
