"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryProgressDots } from "@/components/journey/StoryProgressDots";

type Lesson = {
  id: string;
  completed: boolean;
  locked: boolean;
};

/**
 * Top bar fixed pra Story Deck — fundo escuro semi-transparente (pra
 * contrastar com o pixel art de fundo), back arrow, progress dots
 * tomando o espaco do meio, e numero compacto do XP no canto.
 *
 * NAO usa XPBar component (muito grande pra topbar de stories).
 */
export function StoryTopBar({
  lessons,
  activeIdx,
  onJump,
  xpTotal,
  proofStatus,
  activeLabel,
  backHref = "/jornadas",
  backLabel = "Voltar pra Jornadas",
}: {
  lessons: Lesson[];
  activeIdx: number;
  onJump: (idx: number) => void;
  xpTotal: number;
  proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready";
  activeLabel: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 pb-2"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 70%, transparent 100%)",
      }}
    >
      {/* Linha 1: back + activeLabel + xp */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="shrink-0 w-11 h-11 -ml-2 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/70 truncate"
            aria-live="polite"
          >
            {activeLabel}
          </div>
        </div>
        <div className="shrink-0 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-[11px] font-extrabold text-white inline-flex items-center gap-1 tabular-nums">
          <span className="text-amber-300">✦</span>
          {xpTotal} XP
        </div>
      </div>

      {/* Linha 2: progress dots */}
      <div className="px-1">
        <StoryProgressDots
          lessons={lessons}
          activeIdx={activeIdx}
          onJump={onJump}
          proofStatus={proofStatus}
        />
      </div>
    </header>
  );
}
