"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import type { CharacterStage } from "@/lib/journey/character-stage";

type Journey = {
  slug: string;
  title: string;
  subtitle: string | null;
  character_stage: CharacterStage;
};

/**
 * Header da pagina hub da jornada — back arrow, sprite pequeno do
 * personagem, titulo + subtitle, e pill de progresso (modulos / aulas).
 */
export function JourneyHeroBar({
  journey,
  modulesCompleted,
  totalModules,
  lessonsCompleted,
  totalLessons,
  xpTotal,
}: {
  journey: Journey;
  modulesCompleted: number;
  totalModules: number;
  lessonsCompleted: number;
  totalLessons: number;
  xpTotal: number;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-white/40">
      <div className="max-w-[520px] mx-auto px-4 py-3 flex items-center gap-3">
        <Link
          href="/jornadas"
          aria-label="Voltar pra Jornadas"
          className="shrink-0 w-11 h-11 -ml-2 flex items-center justify-center text-spark-ink-70 hover:text-spark-ink active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>

        <div className="shrink-0">
          <CharacterSprite
            stage={journey.character_stage}
            anim="idle"
            scale={0.9}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[15px] text-spark-ink truncate">
            {journey.title}
          </h1>
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-spark-ink-50 mt-0.5">
            {modulesCompleted}/{totalModules} módulos · {lessonsCompleted}/{totalLessons} aulas
          </div>
        </div>

        <div
          className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-spark-surface border border-spark-hairline text-[12px] font-extrabold text-spark-ink tabular-nums"
          aria-label={`${xpTotal} XP total`}
        >
          <Sparkles size={11} strokeWidth={2.5} className="text-spark-brand-deep" />
          {xpTotal}
        </div>
      </div>
    </header>
  );
}
