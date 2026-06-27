"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Play, CheckCircle2, RotateCcw } from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import { type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  xp_reward: number;
  completed: boolean;
  locked: boolean;
};

/**
 * Card individual de uma aula em formato story (fullscreen vertical).
 * BG pixel art da jornada NAO eh propriedade desse card — ele eh
 * pintado por baixo (fixed layer no JourneyStoryDeck). Aqui o card
 * desenha apenas: numero decorativo + sparkles + personagem + footer
 * com titulo/CTA, sobre um vignette gradient.
 *
 * Variants:
 * - completed: faixa verde "FEITA" no canto, CTA "Rever"
 * - current: halo rosa atras do personagem + CTA "Fazer aula"
 * - locked: overlay escuro + cadeado centralizado + texto "Termine aula X"
 */
export function StoryCard({
  lesson,
  journey,
  index,
  totalLessons,
  isActive,
  characterStage,
  blockingLessonIndex,
}: {
  lesson: Lesson;
  journey: { slug: string; title: string };
  index: number;
  totalLessons: number;
  isActive: boolean;
  characterStage: CharacterStage;
  blockingLessonIndex: number | null;
}) {
  const variant: "completed" | "current" | "locked" = lesson.completed
    ? "completed"
    : lesson.locked
      ? "locked"
      : "current";

  const isLocked = variant === "locked";
  const ctaLabel = variant === "completed"
    ? "Rever aula"
    : variant === "current"
      ? "Fazer aula"
      : "Bloqueada";
  const CtaIcon = variant === "completed" ? RotateCcw : variant === "current" ? Play : Lock;

  return (
    <article
      className={cn(
        "snap-center shrink-0 relative overflow-hidden",
        "w-screen md:w-[440px]",
        "h-[100dvh] md:h-[88dvh] md:rounded-spark-xl md:shadow-2xl",
      )}
      style={{ scrollSnapStop: "normal" }}
      aria-label={`Aula ${index} de ${totalLessons}: ${lesson.title}${variant === "completed" ? " concluída" : variant === "locked" ? " bloqueada" : ""}`}
    >
      {/* Overlay escurecedor pra locked */}
      {isLocked && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.55)" }}
          aria-hidden
        />
      )}

      {/* Numero decorativo gigante no fundo */}
      <div
        className="absolute right-3 top-16 pointer-events-none select-none font-display text-white/15 leading-none z-[5]"
        style={{ fontSize: "180px" }}
        aria-hidden
      >
        {String(index).padStart(2, "0")}
      </div>

      {/* Sparkles flutuando (so no current ativo) */}
      {isActive && variant === "current" && (
        <div className="absolute inset-0 pointer-events-none z-[6]" aria-hidden>
          {[
            { l: "15%", t: "30%", d: "0s" },
            { l: "75%", t: "25%", d: "0.4s" },
            { l: "20%", t: "55%", d: "0.8s" },
            { l: "80%", t: "60%", d: "1.2s" },
            { l: "50%", t: "20%", d: "1.6s" },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute text-amber-200 text-base"
              style={{
                left: s.l,
                top: s.t,
                animation: `story-twinkle 2.5s ease-in-out ${s.d} infinite`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      {/* Slot central — varia por variant:
          - current: personagem + halo (foco visual da jornada)
          - completed: checkmark verde gigante
          - locked: cadeado branco gigante
          Mantem MESMA posicao (top 32%) pra cards parecerem cortados pela
          mesma "grade" no swipe horizontal. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[7] pointer-events-none"
        style={{ top: "32%" }}
      >
        {variant === "current" && (
          <>
            {/* Glow radial difuso — "perdoa" character off-center no PNG */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: "300px",
                height: "300px",
                background:
                  "radial-gradient(circle at 50% 55%, rgba(236,72,153,0.55) 0%, rgba(236,72,153,0.30) 35%, rgba(236,72,153,0.10) 65%, rgba(236,72,153,0) 80%)",
                filter: "blur(2px)",
                animation: "story-halo-pulse 2.4s ease-in-out infinite",
              }}
              aria-hidden
            />
            <div className="relative">
              <CharacterSprite stage={characterStage} anim="idle" scale={3.5} />
            </div>
          </>
        )}
        {variant === "completed" && (
          <div
            className="flex items-center justify-center w-[180px] h-[180px] rounded-full bg-emerald-500/20 border-4 border-emerald-400/50 backdrop-blur-sm shadow-2xl"
            aria-hidden
          >
            <CheckCircle2
              size={96}
              strokeWidth={2.2}
              className="text-emerald-300 drop-shadow-lg"
            />
          </div>
        )}
        {variant === "locked" && (
          <div
            className="flex items-center justify-center w-[180px] h-[180px] rounded-full bg-spark-ink/70 border-4 border-white/20 backdrop-blur-sm shadow-2xl"
            aria-hidden
          >
            <Lock size={88} strokeWidth={2.4} className="text-white/75" />
          </div>
        )}
      </div>

      {/* Footer: gradient escuro + conteudo textual + CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[20] px-5 pt-12 pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{
          background:
            "linear-gradient(to top, rgba(20,10,20,0.92) 0%, rgba(20,10,20,0.75) 40%, rgba(20,10,20,0.35) 75%, transparent 100%)",
        }}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90 mb-1.5">
          Aula {index}/{totalLessons}  ·  +{lesson.xp_reward} XP
        </div>
        <h2
          className="font-display text-white text-[26px] md:text-[30px] leading-tight"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {lesson.title}
        </h2>
        {lesson.description && !isLocked && (
          <p
            className="text-white/85 text-[14px] mt-2 leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lesson.description}
          </p>
        )}

        {isLocked && blockingLessonIndex !== null && (
          <p className="text-white/75 text-[13.5px] mt-2">
            Termine a aula {blockingLessonIndex} pra desbloquear.
          </p>
        )}

        {/* CTA */}
        <div className="mt-5">
          {isLocked ? (
            <button
              disabled
              className="w-full py-3.5 rounded-full bg-white/15 border-2 border-white/20 text-white/60 text-[14px] font-extrabold cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Bloqueada
            </button>
          ) : (
            <Link
              href={`/jornadas/${journey.slug}/aula/${lesson.slug}`}
              className={cn(
                "w-full py-3.5 rounded-full text-white text-[15px] font-extrabold shadow-lift-brand active:scale-95 transition-transform inline-flex items-center justify-center gap-2",
                variant === "completed"
                  ? "bg-emerald-500"
                  : "bg-brand-grad",
              )}
            >
              <CtaIcon size={16} strokeWidth={2.6} />
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
