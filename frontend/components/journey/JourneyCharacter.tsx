"use client";

import { STAGE_EMOJI, STAGE_LABELS, type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

/**
 * Personagem do joguinho — MVP usa emoji.
 * Quando virar pixel art (Semana 2), troca pra <Image src="/sprites/.../idle.png" />
 * mantendo a mesma API (props: stage, size, className).
 */
export function JourneyCharacter({
  stage,
  size = 96,
  showLabel = false,
  className,
}: {
  stage: CharacterStage;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span
        role="img"
        aria-label={`personagem ${STAGE_LABELS[stage]}`}
        style={{ fontSize: size, lineHeight: 1 }}
        className="select-none transition-transform duration-500 ease-out hover:scale-110"
      >
        {STAGE_EMOJI[stage]}
      </span>
      {showLabel && (
        <span className="text-eyebrow text-spark-brand">
          ✦ {STAGE_LABELS[stage]}
        </span>
      )}
    </div>
  );
}
