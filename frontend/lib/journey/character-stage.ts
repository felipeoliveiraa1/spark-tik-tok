/**
 * Stage do personagem deriva do COUNT de jornadas completadas:
 *   0 completed  -> bebe       (na Jornada 1)
 *   1 completed  -> adolescente (terminou Jornada 1, na 2)
 *   2+ completed -> adulta     (terminou 2+, no fim da trilogia)
 *
 * Source of truth eh sempre journey_progress.status='completed'.
 * journey_progress.character_stage eh cache pra UI nao precisar recalcular.
 */
export type CharacterStage = "bebe" | "adolescente" | "adulta";

export const CHARACTER_STAGES: readonly CharacterStage[] = [
  "bebe",
  "adolescente",
  "adulta",
] as const;

export function stageFromCompletedCount(completed: number): CharacterStage {
  if (completed >= 2) return "adulta";
  if (completed >= 1) return "adolescente";
  return "bebe";
}

export const STAGE_LABELS: Record<CharacterStage, string> = {
  bebe: "começando",
  adolescente: "evoluindo",
  adulta: "vendendo",
};

export const STAGE_EMOJI: Record<CharacterStage, string> = {
  bebe: "👶",
  adolescente: "👧",
  adulta: "🙋‍♀️",
};

/**
 * Path do sprite (pixel art futuro). MVP usa emoji se sprite nao existir.
 */
export function spritePath(
  stage: CharacterStage,
  anim: "idle" | "walk" | "celebrating" | "locked" | "studying" = "idle",
): string {
  return `/sprites/characters/${stage}/${anim}.png`;
}
