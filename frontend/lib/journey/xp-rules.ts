/**
 * Tabela de XP por evento. Aplicada no servidor (APIs) quando o evento
 * acontece — registra em journey_xp_events e soma em journey_progress.xp_total.
 */
export const XP_RULES = {
  lesson_complete: 10,
  comment_post: 5,
  comment_received_like: 1,
  proof_approved: 50,
  journey_complete: 100,
  badge_earned_base: 0, // bonus vem do badge.xp_bonus
} as const;

export type XpEventKind = keyof typeof XP_RULES;

/**
 * Thresholds pra UI mostrar barra de progresso ate o proximo stage.
 * (Stage real eh derivado de jornadas completadas, nao de XP — vide
 * character-stage.ts. Aqui eh so feedback visual de "quao perto voce
 * esta de adolescente/adulta" se quiser mostrar barra de XP global).
 */
export const LEVEL_THRESHOLDS = [
  { stage: "bebe", xpMin: 0, xpMax: 100 },
  { stage: "adolescente", xpMin: 100, xpMax: 300 },
  { stage: "adulta", xpMin: 300, xpMax: Number.POSITIVE_INFINITY },
] as const;
