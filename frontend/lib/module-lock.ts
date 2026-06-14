/**
 * Regra de bloqueio progressivo dos modulos de educacao pra alunas novas.
 *
 * Mesma logica dos agentes (lib/agent-lock.ts): alunas que entram a partir
 * do cutoff comecam apenas com os modulos "porta de entrada" (00 e 01)
 * liberados. Os demais vao liberando ao fim dos 7 dias do cadastro — pra
 * ela primeiro absorver o fundamento antes de pular pra producao avancada.
 *
 * Alunas anteriores ao cutoff (grandfathered), pagantes (trial/active/late)
 * e admins veem tudo liberado sempre.
 */

import {
  AGENT_LOCK_CUTOFF_ISO,
  LOCK_DAYS,
  type ProfileForGate,
} from "./agent-lock";

// Reusa o mesmo cutoff e janela de 7 dias dos agentes.
export const MODULE_LOCK_CUTOFF_ISO = AGENT_LOCK_CUTOFF_ISO;
export const MODULE_LOCK_DAYS = LOCK_DAYS;

// Modulos sempre liberados: porta de entrada (00 Fundamentos) e
// primeiro modulo de execucao (01 Estrutura e Rotina). Identificados
// pelo slug canonico do seed 0014_education_modules_seed.sql.
export const ALWAYS_FREE_MODULE_SLUGS = new Set<string>([
  "fundamentos",
  "estrutura-rotina",
]);

export type ModuleLockStatus =
  | { locked: false }
  | { locked: true; daysRemaining: number };

// plan_status considerado pagante. Mesmo set de agent-lock.
const PAYING_STATUSES = new Set<string>(["trial", "active", "late"]);

/**
 * Retorna se a aluna ainda tem esse modulo bloqueado e quantos dias faltam.
 *
 * - Sem profile/created_at → liberado (defensivo)
 * - Admin → liberado sempre
 * - Slug em ALWAYS_FREE_MODULE_SLUGS → liberado sempre
 * - Pagante (trial/active/late) → liberado
 * - created_at < cutoff → liberado (grandfathered)
 * - created_at >= cutoff E < LOCK_DAYS desde cadastro → bloqueado
 * - >= LOCK_DAYS desde cadastro → liberado
 *
 * options.skipCutoff: usado pelo preview mode admin pra simular a regra
 * antes da data de corte chegar pra alunas reais.
 */
export function getModuleLockStatus(
  profile: ProfileForGate | null | undefined,
  moduleSlug: string,
  now: Date = new Date(),
  options?: { skipCutoff?: boolean },
): ModuleLockStatus {
  if (!profile?.created_at) return { locked: false };
  if (profile.role === "admin") return { locked: false };
  if (ALWAYS_FREE_MODULE_SLUGS.has(moduleSlug)) return { locked: false };

  if (profile.plan_status && PAYING_STATUSES.has(profile.plan_status)) {
    return { locked: false };
  }

  const createdAt = new Date(profile.created_at);
  if (Number.isNaN(createdAt.getTime())) return { locked: false };

  if (!options?.skipCutoff) {
    const cutoff = new Date(MODULE_LOCK_CUTOFF_ISO);
    if (createdAt.getTime() < cutoff.getTime()) return { locked: false };
  }

  const elapsedMs = now.getTime() - createdAt.getTime();
  const elapsedDays = elapsedMs / 86_400_000;
  if (elapsedDays >= MODULE_LOCK_DAYS) return { locked: false };

  const daysRemaining = Math.max(1, Math.ceil(MODULE_LOCK_DAYS - elapsedDays));
  return { locked: true, daysRemaining };
}

/**
 * Formata texto do badge. "1 dia" no singular.
 */
export function formatModuleDaysRemaining(daysRemaining: number): string {
  return daysRemaining === 1
    ? "Disponível em 1 dia"
    : `Disponível em ${daysRemaining} dias`;
}
