"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Check,
  RotateCcw,
  Sparkles,
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

type HabitCategory = "trabalho" | "pessoal" | "resultado" | "custom";

type Habit = {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  category: HabitCategory;
  order_index: number;
  is_active: boolean;
};

const CATEGORIES: { key: HabitCategory; label: string; emoji: string }[] = [
  { key: "trabalho", label: "Trabalho", emoji: "💼" },
  { key: "pessoal", label: "Pessoal", emoji: "🌸" },
  { key: "resultado", label: "Resultado", emoji: "📈" },
  { key: "custom", label: "Meus", emoji: "✨" },
];

const QUICK_EMOJIS = [
  "✨", "🎥", "📱", "📊", "💬", "🔴", "🎓", "🌅", "🌙",
  "💊", "🏋️", "💧", "🛏️", "💸", "📈", "🧠", "📝",
  "🍽️", "☕", "🎯", "🔥",
];

// =================================================================
// EDITAR PAGE
// =================================================================

function EditarBody({ desktop = false }: { desktop?: boolean }) {
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingNew, setSavingNew] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
  const [newEmoji, setNewEmoji] = React.useState("✨");
  const [newCat, setNewCat] = React.useState<HabitCategory>("custom");
  const confirm = useConfirm();
  const toast = useToast();

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/rotina/habits", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { habits: Habit[] };
      setHabits(data.habits);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateHabit = async (id: string, patch: Partial<Habit>) => {
    // Optimistic
    setHabits((arr) => arr.map((h) => (h.id === id ? { ...h, ...patch } : h)));
    const res = await fetch(`/api/rotina/habits/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Não consegui salvar");
      void refresh();
    }
  };

  const toggleActive = (h: Habit) => updateHabit(h.id, { is_active: !h.is_active });

  const removeHabit = async (h: Habit) => {
    const ok = await confirm({
      title: `Remover "${h.label}"?`,
      description: "Histórico de checkins desse hábito também é removido.",
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    setHabits((arr) => arr.filter((x) => x.id !== h.id));
    const res = await fetch(`/api/rotina/habits/${h.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Não consegui remover");
      void refresh();
    } else {
      toast.success("Hábito removido");
    }
  };

  const moveHabit = async (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= habits.length) return;
    const cur = habits[idx];
    const oth = habits[target];

    const newArr = [...habits];
    newArr[idx] = { ...oth, order_index: cur.order_index };
    newArr[target] = { ...cur, order_index: oth.order_index };
    newArr.sort((a, b) => a.order_index - b.order_index);
    setHabits(newArr);

    await Promise.all([
      fetch(`/api/rotina/habits/${cur.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_index: oth.order_index }),
      }),
      fetch(`/api/rotina/habits/${oth.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_index: cur.order_index }),
      }),
    ]);
  };

  const addHabit = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSavingNew(true);
    const res = await fetch("/api/rotina/habits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, emoji: newEmoji, category: newCat }),
    });
    setSavingNew(false);
    if (res.ok) {
      setNewLabel("");
      setNewEmoji("✨");
      setNewCat("custom");
      toast.success("Hábito adicionado 💕");
      await refresh();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error === "duplicate" ? "Já existe esse hábito" : "Não consegui adicionar");
    }
  };

  const resetTemplate = async () => {
    const ok = await confirm({
      title: "Restaurar template Yara?",
      description:
        "Adiciona qualquer hábito do template que você não tenha. Não remove seus hábitos atuais.",
      confirmLabel: "Restaurar",
    });
    if (!ok) return;
    const res = await fetch("/api/rotina/habits/seed", { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { habits: Habit[] };
      setHabits(data.habits);
      toast.success("Template restaurado ✨");
    } else {
      toast.error("Não consegui restaurar");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] hero-radial">
        <LoadingSplash message="Carregando hábitos" />
      </div>
    );
  }

  // Agrupa por categoria
  const grouped = new Map<HabitCategory, Habit[]>();
  for (const h of habits) {
    const arr = grouped.get(h.category) ?? [];
    arr.push(h);
    grouped.set(h.category, arr);
  }
  const activeCount = habits.filter((h) => h.is_active).length;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "80px" : "calc(env(safe-area-inset-top) + 72px)",
          paddingBottom: desktop ? "48px" : "32px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[440px] h-[440px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[440px] h-[440px]" />
        <SparkleField count={10} seed={3030} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[860px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/rotina/hoje"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pra rotina
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={800}>
            <div className="mt-6 text-eyebrow text-spark-brand">
              ✦ minha rotina · {activeCount} ativos
            </div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}
            >
              meus <span className="text-grad-brand">hábitos.</span>
            </h1>
            <p className="mt-4 text-fluid-lead text-spark-ink-70 leading-snug font-semibold max-w-[58ch]">
              Adiciona, edita ou remove. Pode esconder os que não usa sem perder o histórico.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Conteúdo */}
      <section className={`relative ${desktop ? "px-12 py-8" : "px-5 py-6"}`}>
        <div className={desktop ? "max-w-[860px] mx-auto space-y-7" : "space-y-7"}>
          {/* Adicionar novo */}
          <SectionReveal direction="up">
            <div className="p-5 lg:p-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
              <div className="text-eyebrow text-spark-brand mb-3 flex items-center gap-1.5">
                <Plus size={11} strokeWidth={2.5} />
                ✦ novo hábito
              </div>

              <div className="space-y-3">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="O que você quer marcar todo dia?"
                  className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14.5px] transition-all duration-200"
                  maxLength={80}
                />

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewEmoji(e)}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-[18px] transition-all duration-300",
                        newEmoji === e
                          ? "bg-brand-grad shadow-lift-brand scale-110"
                          : "bg-spark-surface-sunken hover:bg-spark-brand-soft/40",
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setNewCat(c.key)}
                      className={cn(
                        "px-3 py-2.5 rounded-spark-xl border text-[12px] font-extrabold transition-all duration-300 inline-flex items-center justify-center gap-1.5",
                        newCat === c.key
                          ? "bg-brand-grad text-white border-transparent shadow-lift-brand"
                          : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-brand/30",
                      )}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addHabit}
                  disabled={savingNew || !newLabel.trim()}
                  className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-spark-ink text-white text-[13.5px] font-extrabold shadow-lift hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Plus
                    size={14}
                    strokeWidth={2.5}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                  {savingNew ? "Adicionando..." : `Adicionar ${newEmoji} ${newLabel || "hábito"}`}
                </button>
              </div>
            </div>
          </SectionReveal>

          {/* Lista de hábitos por categoria */}
          {CATEGORIES.filter((c) => grouped.has(c.key)).map((c) => {
            const items = (grouped.get(c.key) ?? []).sort(
              (a, b) => a.order_index - b.order_index,
            );
            return (
              <SectionReveal key={c.key} direction="up">
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-eyebrow text-spark-brand-deep">
                      <span className="text-[14px]">{c.emoji}</span>
                      <span>✦ {c.label.toLowerCase()}</span>
                    </div>
                    <div className="text-[10.5px] text-spark-ink-50 font-mono font-extrabold uppercase tracking-widest">
                      {items.filter((i) => i.is_active).length}/{items.length} ativos
                    </div>
                  </div>

                  <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
                    {items.map((h, i) => (
                      <HabitEditRow
                        key={h.id}
                        habit={h}
                        showBorder={i > 0}
                        onToggleActive={() => toggleActive(h)}
                        onRemove={() => removeHabit(h)}
                        onMoveUp={
                          habits.indexOf(h) > 0 ? () => moveHabit(habits.indexOf(h), -1) : undefined
                        }
                        onMoveDown={
                          habits.indexOf(h) < habits.length - 1
                            ? () => moveHabit(habits.indexOf(h), 1)
                            : undefined
                        }
                        onLabelChange={(label) => updateHabit(h.id, { label })}
                        onEmojiChange={(emoji) => updateHabit(h.id, { emoji })}
                      />
                    ))}
                  </div>
                </section>
              </SectionReveal>
            );
          })}

          {/* Reset template */}
          <SectionReveal direction="up">
            <div className="p-5 rounded-spark-2xl glass border border-spark-hairline">
              <div className="flex items-center gap-3">
                <Sparkles size={20} strokeWidth={2.2} className="text-spark-brand-deep shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight">
                    Restaurar template Yara
                  </div>
                  <div className="text-[12px] text-spark-ink-50 mt-0.5 leading-snug">
                    Adiciona os hábitos do método que você ainda não tem
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-spark-ink text-white text-[12px] font-extrabold hover:bg-spark-brand-deep hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-lift"
                >
                  <RotateCcw size={11} strokeWidth={2.5} />
                  Restaurar
                </button>
              </div>
            </div>
          </SectionReveal>

          {/* CTA voltar */}
          <SectionReveal direction="up">
            <Link
              href="/rotina/hoje"
              className="group inline-flex items-center justify-center w-full gap-2 px-5 py-4 rounded-full bg-brand-grad text-white text-[14px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all duration-300 ease-premium"
            >
              Pronto · ver minha rotina
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}

// =================================================================
// HABIT EDIT ROW
// =================================================================

function HabitEditRow({
  habit,
  showBorder,
  onToggleActive,
  onRemove,
  onMoveUp,
  onMoveDown,
  onLabelChange,
  onEmojiChange,
}: {
  habit: Habit;
  showBorder: boolean;
  onToggleActive: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onLabelChange: (label: string) => void;
  onEmojiChange: (emoji: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [tmpLabel, setTmpLabel] = React.useState(habit.label);
  const [tmpEmoji, setTmpEmoji] = React.useState(habit.emoji);

  const saveEdit = () => {
    const next = tmpLabel.trim();
    if (next && next !== habit.label) onLabelChange(next);
    if (tmpEmoji !== habit.emoji) onEmojiChange(tmpEmoji);
    setEditing(false);
  };

  const cancelEdit = () => {
    setTmpLabel(habit.label);
    setTmpEmoji(habit.emoji);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 transition-colors duration-200",
        showBorder ? "border-t border-spark-hairline" : "",
        !habit.is_active ? "opacity-50" : "",
      )}
    >
      {/* Grip handles */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className="w-6 h-4 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink disabled:opacity-25 transition-colors"
          aria-label="Subir"
        >
          <GripVertical size={11} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className="w-6 h-4 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink disabled:opacity-25 transition-colors"
          aria-label="Descer"
        >
          <GripVertical size={11} strokeWidth={2.5} />
        </button>
      </div>

      {editing ? (
        <>
          <select
            value={tmpEmoji}
            onChange={(e) => setTmpEmoji(e.target.value)}
            className="text-[22px] w-12 h-12 rounded-full bg-spark-bg border border-spark-hairline text-center appearance-none cursor-pointer"
          >
            {[habit.emoji, ...QUICK_EMOJIS.filter((e) => e !== habit.emoji)].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <input
            value={tmpLabel}
            onChange={(e) => setTmpLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="flex-1 px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-brand/40 focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-semibold transition-all"
            autoFocus
            maxLength={80}
          />
          <button
            type="button"
            onClick={saveEdit}
            className="w-9 h-9 rounded-full bg-good text-white flex items-center justify-center shadow-lift"
            aria-label="Salvar"
          >
            <Check size={15} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:bg-spark-surface-sunken flex items-center justify-center"
            aria-label="Cancelar"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[22px] shrink-0 hover:scale-110 transition-transform duration-200"
            aria-label="Mudar emoji"
          >
            {habit.emoji}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 min-w-0 text-left text-[14.5px] font-semibold text-spark-ink truncate hover:text-spark-brand-deep transition-colors"
          >
            {habit.label}
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300",
              habit.is_active
                ? "text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken"
                : "text-warn hover:text-warn hover:bg-warn/10",
            )}
            aria-label={habit.is_active ? "Desativar" : "Ativar"}
            title={habit.is_active ? "Desativar (ocultar do dia a dia)" : "Ativar de volta"}
          >
            {habit.is_active ? (
              <Eye size={15} strokeWidth={2.2} />
            ) : (
              <EyeOff size={15} strokeWidth={2.2} />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-300"
            aria-label="Remover"
          >
            <Trash2 size={14} strokeWidth={2.2} />
          </button>
        </>
      )}
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function EditarMobile() {
  return <EditarBody />;
}

export default function RotinaEditarPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<EditarMobile />}
        desktop={<EditarBody desktop />}
        active="rotina"
        customSidebar
      />
      <FloatingMainNav active="rotina" />
    </>
  );
}
