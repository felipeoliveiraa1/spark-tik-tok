"use client";

import { CharacterSprite } from "@/components/journey/CharacterSprite";
import { STAGE_LABELS, type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

/**
 * Wrapper "alto-nivel" do CharacterSprite. Mantem a API antiga (size em
 * pixels + showLabel) pros callers existentes. CharacterSprite detecta
 * automaticamente sprite-sheet > single PNG > emoji fallback.
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
  // CharacterSprite trabalha com `scale` (multiplicador de 64px base).
  // Converter `size` em scale aproximado: size 96 → scale 1.5; size 120 → scale ~1.9
  const scale = Math.max(0.5, size / 64);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <CharacterSprite stage={stage} anim="idle" scale={scale} />
      {showLabel && (
        <span className="text-eyebrow text-spark-brand">
          ✦ {STAGE_LABELS[stage]}
        </span>
      )}
    </div>
  );
}
