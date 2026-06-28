"use client";

import Link from "next/link";
import { Lock, Check, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

type Module = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  week_number: number | null;
  order_index: number;
  lesson_count: number;
  lessons_completed: number;
  pct_complete: number;
  all_complete: boolean;
  locked: boolean;
};

/**
 * Card de modulo no hub da jornada — stack vertical aspect-[16/9].
 * Estados:
 * - locked: termina modulo anterior pra abrir, cinza + cadeado
 * - current: em andamento (>=1 aula completa, nao todos) — halo brand
 * - completed: all_complete=true, border emerald + selo verde
 * - available: ainda nao comecou mas modulo anterior pronto — sem halo
 */
export function ModuleCard({
  module,
  journeySlug,
  isCurrent,
  index,
}: {
  module: Module;
  journeySlug: string;
  /** Eh o "atual" pra essa aluna? (primeiro modulo nao-completed e nao-locked) */
  isCurrent: boolean;
  /** Display index (1, 2, 3, 4) */
  index: number;
}) {
  const completed = module.all_complete;
  const inProgress = !completed && module.lessons_completed > 0;
  const disabled = module.locked;

  const status = completed
    ? "Concluído"
    : inProgress
      ? "Em andamento"
      : disabled
        ? "Bloqueado"
        : "Disponível";

  const inner = (
    <div
      className={cn(
        "relative aspect-[16/9] w-full rounded-spark-xl overflow-hidden border-2 shadow-lift transition-transform",
        completed && "border-emerald-400",
        isCurrent && !completed && "border-spark-brand",
        !isCurrent && !completed && !disabled && "border-spark-hairline",
        disabled && "border-spark-ink/15",
        !disabled && "active:scale-[0.985] hover:shadow-lift-brand",
      )}
      style={{
        background: completed
          ? "linear-gradient(135deg, oklch(0.96 0.04 145) 0%, oklch(0.92 0.06 150) 100%)"
          : isCurrent
            ? "linear-gradient(135deg, oklch(0.96 0.04 350) 0%, oklch(0.92 0.06 30) 100%)"
            : disabled
              ? "linear-gradient(135deg, oklch(0.94 0.01 280) 0%, oklch(0.88 0.02 280) 100%)"
              : "linear-gradient(135deg, oklch(0.98 0.01 240) 0%, oklch(0.94 0.02 240) 100%)",
      }}
    >
      {/* Halo current via opacity */}
      {isCurrent && !completed && (
        <div
          className="absolute inset-0 pointer-events-none rounded-spark-xl ring-inset ring-4 ring-spark-brand/40"
          style={{ animation: "halo-pulse 2.4s ease-in-out infinite" }}
          aria-hidden
        />
      )}

      {/* Tint disabled */}
      {disabled && (
        <div className="absolute inset-0 bg-spark-ink/15 backdrop-grayscale-[0.4]" aria-hidden />
      )}

      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between">
        {/* Top row: badge numerica + status pill */}
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "w-11 h-11 rounded-full border-2 flex items-center justify-center font-display text-[17px] shadow-lift shrink-0",
              completed && "bg-emerald-500 border-white text-white",
              isCurrent && !completed && "bg-white border-spark-brand text-spark-brand-deep",
              !isCurrent && !completed && !disabled && "bg-white border-spark-hairline text-spark-ink",
              disabled && "bg-spark-ink/70 border-white/80 text-white",
            )}
          >
            {completed ? <Check size={18} strokeWidth={3} /> : index}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide backdrop-blur bg-white/90 text-spark-ink">
              {status}
            </span>
            {module.week_number !== null && (
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-spark-ink-50">
                Semana {module.week_number}
              </span>
            )}
          </div>
        </div>

        {/* Title + description */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-spark-ink-50">
            Módulo {index}
          </div>
          <h2
            className={cn(
              "font-display text-[19px] md:text-[22px] leading-tight mt-0.5",
              disabled ? "text-spark-ink-70" : "text-spark-ink",
            )}
          >
            {module.title}
          </h2>
          {module.description && !disabled && (
            <p
              className="text-[12.5px] text-spark-ink-70 mt-1 leading-snug"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {module.description}
            </p>
          )}
        </div>

        {/* Footer: progress + CTA */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {inProgress && (
              <>
                <div className="h-1.5 bg-spark-ink/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-grad transition-all"
                    style={{ width: `${Math.min(100, module.pct_complete)}%` }}
                  />
                </div>
                <div className="text-[11px] mt-1 font-extrabold text-spark-ink-70">
                  {module.lessons_completed}/{module.lesson_count} aulas · {Math.round(module.pct_complete)}%
                </div>
              </>
            )}
            {!inProgress && !disabled && (
              <div className="text-[11.5px] font-extrabold text-spark-ink-70 inline-flex items-center gap-1.5">
                <BookOpen size={12} strokeWidth={2.5} />
                {module.lesson_count} {module.lesson_count === 1 ? "aula" : "aulas"}
              </div>
            )}
            {disabled && (
              <div className="text-[11.5px] font-extrabold text-spark-ink-70 inline-flex items-center gap-1.5">
                <Lock size={12} strokeWidth={2.5} />
                Termine o módulo {index - 1} pra abrir
              </div>
            )}
            {completed && (
              <div className="text-[11.5px] font-extrabold text-emerald-700 inline-flex items-center gap-1.5">
                <Check size={12} strokeWidth={3} />
                Todas as aulas concluídas
              </div>
            )}
          </div>

          {!disabled && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12.5px] font-extrabold shadow-lift shrink-0",
                isCurrent && !completed && "bg-spark-brand text-white",
                completed && "bg-emerald-500 text-white",
                !isCurrent && !completed && "bg-spark-ink text-white",
              )}
            >
              {completed ? "Rever" : inProgress ? "Continuar" : "Começar"}
              <ChevronRight size={13} strokeWidth={2.8} />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const a11yLabel = `Módulo ${index}: ${module.title} — ${status}`;

  if (disabled) {
    return (
      <div
        role="button"
        aria-disabled="true"
        aria-label={a11yLabel}
        className="cursor-not-allowed select-none"
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/jornadas/${journeySlug}/modulo/${module.slug}`}
      aria-label={a11yLabel}
      className="block"
    >
      {inner}
    </Link>
  );
}
