"use client";

import { Sparkles } from "lucide-react";
import { LEVEL_THRESHOLDS } from "@/lib/journey/xp-rules";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { STAGE_EMOJI } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

/**
 * Barra de XP com indicador do stage atual + progresso ate o proximo
 * threshold. Quando atinge max do ultimo stage (adulta xpMax=Infinity),
 * mostra "MAX" e barra completa.
 */
export function XPBar({
  xpTotal,
  stage,
  className,
}: {
  xpTotal: number;
  stage: CharacterStage;
  className?: string;
}) {
  const currentThreshold =
    LEVEL_THRESHOLDS.find((t) => t.stage === stage) ?? LEVEL_THRESHOLDS[0];
  const isMax = !Number.isFinite(currentThreshold.xpMax);
  const localXp = xpTotal - currentThreshold.xpMin;
  const range = isMax ? 100 : currentThreshold.xpMax - currentThreshold.xpMin;
  const pct = isMax ? 100 : Math.min(100, Math.max(0, (localXp / range) * 100));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline shadow-rest",
        className,
      )}
    >
      <span className="text-base" style={{ lineHeight: 1 }}>
        {STAGE_EMOJI[stage]}
      </span>
      <div className="flex-1 min-w-[120px] h-2 bg-spark-ink-10 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-grad transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1 text-[11.5px] font-extrabold text-spark-ink tabular-nums">
        <Sparkles size={11} className="text-spark-brand-deep" />
        {xpTotal}
        {!isMax && (
          <span className="text-spark-ink-35 font-mono ml-1">
            /{currentThreshold.xpMax}
          </span>
        )}
        {isMax && <span className="text-spark-brand-deep ml-1">MAX</span>}
      </div>
    </div>
  );
}
