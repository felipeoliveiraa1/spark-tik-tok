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
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
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
  scheduled_time: string | null;
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
  const [newTime, setNewTime] = React.useState("");
  const confirm = useConfirm();
  const toast = useToast();

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/rotina/habits", {
        cache: "no-store",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });
      if (res.ok) {
        const data = (await res.json()) as { habits: Habit[] };
        setHabits(data.habits);
      }
    } catch {
      // Sem net: mantem estado atual, nao quebra a UI
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // PATCH com snapshot-revert local em erro (NUNCA refetch — refetch
  // racing com PATCHes em flight era o bug Android: GET trazia estado
  // do banco SEM as edicoes pendentes e sobrescrevia tudo).
  // Quando OK, reconcilia SO o habit retornado pelo server (sem mexer
  // nos outros que podem ter PATCH em flight tambem).
  const updateHabit = React.useCallback(
    async (id: string, patch: Partial<Habit>): Promise<boolean> => {
      let snapshot: Habit[] = [];
      setHabits((arr) => {
        snapshot = arr;
        return arr.map((h) => (h.id === id ? { ...h, ...patch } : h));
      });
      try {
        const res = await fetch(`/api/rotina/habits/${id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
          cache: "no-store",
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          toast.error("Não consegui salvar. Tenta de novo.");
          setHabits(snapshot);
          return false;
        }
        const j = (await res.json().catch(() => null)) as { habit?: Habit } | null;
        if (j?.habit) {
          // Reconcilia SO esse habit — preserva PATCHes em flight nos outros
          setHabits((arr) => arr.map((h) => (h.id === id ? { ...h, ...j.habit! } : h)));
        }
        return true;
      } catch {
        toast.error("Sem conexão. Tenta de novo.");
        setHabits(snapshot);
        return false;
      }
    },
    [toast],
  );

  const toggleActive = (h: Habit) => void updateHabit(h.id, { is_active: !h.is_active });

  const removeHabit = async (h: Habit) => {
    const ok = await confirm({
      title: `Remover "${h.label}"?`,
      description: "Histórico de checkins desse hábito também é removido.",
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    let snapshot: Habit[] = [];
    setHabits((arr) => {
      snapshot = arr;
      return arr.filter((x) => x.id !== h.id);
    });
    try {
      const res = await fetch(`/api/rotina/habits/${h.id}`, {
        method: "DELETE",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error("Não consegui remover");
        setHabits(snapshot);
      } else {
        toast.success("Hábito removido");
      }
    } catch {
      toast.error("Sem conexão");
      setHabits(snapshot);
    }
  };

  const moveHabit = async (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= habits.length) return;
    const cur = habits[idx];
    const oth = habits[target];

    let snapshot: Habit[] = [];
    setHabits((arr) => {
      snapshot = arr;
      const newArr = [...arr];
      newArr[idx] = { ...oth, order_index: cur.order_index };
      newArr[target] = { ...cur, order_index: oth.order_index };
      newArr.sort((a, b) => a.order_index - b.order_index);
      return newArr;
    });

    try {
      // Sequencial pra evitar race (Android lento pode comutar ordem das
      // requisicoes em paralelo). Se 1a falha, 2a nem dispara.
      const res1 = await fetch(`/api/rotina/habits/${cur.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({ order_index: oth.order_index }),
      });
      if (!res1.ok) throw new Error("move_fail_1");
      const res2 = await fetch(`/api/rotina/habits/${oth.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({ order_index: cur.order_index }),
      });
      if (!res2.ok) throw new Error("move_fail_2");
    } catch {
      toast.error("Não consegui reordenar");
      setHabits(snapshot);
    }
  };

  const addHabit = async () => {
    const label = newLabel.trim();
    if (!label || savingNew) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/rotina/habits", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify({
          label,
          emoji: newEmoji,
          category: newCat,
          scheduled_time: newTime || null,
        }),
      });
      if (res.ok) {
        const j = (await res.json().catch(() => null)) as { habit?: Habit } | null;
        if (j?.habit) {
          // Push direto em vez de refresh — mantem outras edicoes em flight intactas
          setHabits((arr) => [...arr, j.habit!]);
        }
        setNewLabel("");
        setNewEmoji("✨");
        setNewCat("custom");
        setNewTime("");
        toast.success("Hábito adicionado 💕");
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(
          j.error === "duplicate" ? "Já existe esse hábito" : "Não consegui adicionar",
        );
      }
    } catch {
      toast.error("Sem conexão");
    } finally {
      setSavingNew(false);
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

                {/* Horario sugerido (opcional) */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline">
                  <Clock size={15} strokeWidth={2.2} className="text-spark-ink-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="new-habit-time"
                      className="block text-[11px] font-extrabold uppercase tracking-widest text-spark-ink-50"
                    >
                      horário (opcional)
                    </label>
                    <input
                      id="new-habit-time"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-transparent text-[14.5px] font-extrabold text-spark-ink outline-none mt-0.5"
                    />
                  </div>
                  {newTime && (
                    <button
                      type="button"
                      onClick={() => setNewTime("")}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-spark-ink-50 hover:text-bad hover:bg-bad/10 transition-colors shrink-0"
                      aria-label="Limpar horário"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
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
                        onPatch={(patch) => updateHabit(h.id, patch)}
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
  onPatch,
}: {
  habit: Habit;
  showBorder: boolean;
  onToggleActive: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPatch: (patch: Partial<Habit>) => Promise<boolean>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editingTime, setEditingTime] = React.useState(false);
  const [tmpLabel, setTmpLabel] = React.useState(habit.label);
  const [tmpEmoji, setTmpEmoji] = React.useState(habit.emoji);
  const [tmpTime, setTmpTime] = React.useState(habit.scheduled_time ?? "");
  const [saving, setSaving] = React.useState(false);
  const [savingTime, setSavingTime] = React.useState(false);

  // Quando o habit chega novo (apos PATCH bem-sucedido), reseta os tmps
  // pra refletir o estado canonical do servidor.
  React.useEffect(() => {
    if (!editing) {
      setTmpLabel(habit.label);
      setTmpEmoji(habit.emoji);
    }
  }, [habit.label, habit.emoji, editing]);

  React.useEffect(() => {
    if (!editingTime) setTmpTime(habit.scheduled_time ?? "");
  }, [habit.scheduled_time, editingTime]);

  // Combina label+emoji em 1 PATCH so. Dois fetches paralelos em
  // Android lento causavam race (segundo PATCH usava state stale).
  const saveEdit = async () => {
    if (saving) return;
    const next = tmpLabel.trim();
    const patch: Partial<Habit> = {};
    if (next && next !== habit.label) patch.label = next;
    if (tmpEmoji !== habit.emoji) patch.emoji = tmpEmoji;
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onPatch(patch);
    setSaving(false);
    if (ok) setEditing(false);
    // Se falhou, mantem em editing pra ela tentar de novo sem perder o texto
  };

  const cancelEdit = () => {
    if (saving) return;
    setTmpLabel(habit.label);
    setTmpEmoji(habit.emoji);
    setEditing(false);
  };

  const saveTime = async () => {
    if (savingTime) return;
    const next = tmpTime || null;
    if (next === habit.scheduled_time) {
      setEditingTime(false);
      return;
    }
    setSavingTime(true);
    const ok = await onPatch({ scheduled_time: next });
    setSavingTime(false);
    if (ok) setEditingTime(false);
  };

  const cancelTime = () => {
    if (savingTime) return;
    setTmpTime(habit.scheduled_time ?? "");
    setEditingTime(false);
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
              if (e.key === "Enter") void saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-brand/40 focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-semibold transition-all disabled:opacity-60"
            autoFocus
            maxLength={80}
          />
          <button
            type="button"
            onClick={() => void saveEdit()}
            disabled={saving}
            className="w-9 h-9 rounded-full bg-good text-white flex items-center justify-center shadow-lift disabled:opacity-70"
            aria-label="Salvar"
          >
            {saving ? (
              <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Check size={15} strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:bg-spark-surface-sunken flex items-center justify-center disabled:opacity-50"
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

          {/* Horario */}
          {editingTime ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="time"
                value={tmpTime}
                onChange={(e) => setTmpTime(e.target.value)}
                autoFocus
                disabled={savingTime}
                className="px-2 py-1.5 rounded-spark-lg bg-spark-bg border border-spark-brand/40 focus:ring-2 focus:ring-spark-brand/15 outline-none text-[12.5px] font-extrabold text-spark-ink font-mono w-[92px] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void saveTime()}
                disabled={savingTime}
                className="w-8 h-8 rounded-full bg-good text-white flex items-center justify-center shadow-lift disabled:opacity-70"
                aria-label="Salvar horário"
              >
                {savingTime ? (
                  <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
              </button>
              <button
                type="button"
                onClick={cancelTime}
                disabled={savingTime}
                className="w-8 h-8 rounded-full text-spark-ink-50 hover:bg-spark-surface-sunken flex items-center justify-center disabled:opacity-50"
                aria-label="Cancelar"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : habit.scheduled_time ? (
            <button
              type="button"
              onClick={() => {
                setTmpTime(habit.scheduled_time ?? "");
                setEditingTime(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-spark-brand-soft/60 text-spark-brand-deep text-[11.5px] font-extrabold font-mono hover:bg-spark-brand-soft transition-colors shrink-0"
              aria-label="Editar horário"
              title="Editar horário"
            >
              <Clock size={11} strokeWidth={2.5} />
              {habit.scheduled_time}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTmpTime("");
                setEditingTime(true);
              }}
              className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-brand-deep hover:bg-spark-brand-soft/40 flex items-center justify-center transition-colors shrink-0"
              aria-label="Definir horário"
              title="Definir horário"
            >
              <Clock size={14} strokeWidth={2.2} />
            </button>
          )}

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
