/**
 * Regra de bloqueio progressivo dos agentes pra alunas novas.
 *
 * Contexto: alunas que entram a partir do cutoff comecam com apenas os
 * agentes "porta de entrada" liberados (General + Suporte). Os outros
 * vao liberando dia a dia ate 7 dias depois do cadastro — pra ela
 * aprender o metodo primeiro antes de pular pra agentes especializados.
 *
 * Alunas anteriores ao cutoff (grandfathered) e admins veem tudo
 * liberado sempre.
 */

// Cutoff: 09/06/2026 00:00 BRT (= 03:00 UTC). Alunas com created_at
// >= esta data entram na regra. Anteriores grandfathered.
export const AGENT_LOCK_CUTOFF_ISO = "2026-06-09T03:00:00Z";

// Agentes sempre liberados (mesmo no dia 1): porta de entrada + suporte.
export const ALWAYS_FREE_SLUGS = new Set<string>(["general", "suporte"]);

// Quantos dias ate liberar tudo.
export const LOCK_DAYS = 7;

export type AgentLockStatus =
  | { locked: false }
  | { locked: true; daysRemaining: number };

export type ProfileForGate = {
  created_at: string | null | undefined;
  role?: string | null | undefined;
};

/**
 * Retorna se a aluna ainda tem o agente bloqueado e quantos dias faltam.
 *
 * - Sem profile/created_at → liberado (defensivo; evita bloquear por bug)
 * - Admin → liberado sempre
 * - Slug em ALWAYS_FREE_SLUGS → liberado sempre
 * - created_at < cutoff → liberado (grandfathered)
 * - created_at >= cutoff E < LOCK_DAYS desde cadastro → bloqueado
 * - >= LOCK_DAYS desde cadastro → liberado
 */
export function getAgentLockStatus(
  profile: ProfileForGate | null | undefined,
  agentSlug: string,
  now: Date = new Date(),
  options?: { skipCutoff?: boolean },
): AgentLockStatus {
  if (!profile?.created_at) return { locked: false };
  if (profile.role === "admin") return { locked: false };
  if (ALWAYS_FREE_SLUGS.has(agentSlug)) return { locked: false };

  const createdAt = new Date(profile.created_at);
  if (Number.isNaN(createdAt.getTime())) return { locked: false };

  // skipCutoff: usado pelo preview mode admin pra simular a regra
  // antes da data de corte chegar pra alunas reais.
  if (!options?.skipCutoff) {
    const cutoff = new Date(AGENT_LOCK_CUTOFF_ISO);
    if (createdAt.getTime() < cutoff.getTime()) return { locked: false };
  }

  const elapsedMs = now.getTime() - createdAt.getTime();
  const elapsedDays = elapsedMs / 86_400_000;
  if (elapsedDays >= LOCK_DAYS) return { locked: false };

  // Math.ceil garante "1 dia" no ultimo dia restante (em vez de "0")
  const daysRemaining = Math.max(1, Math.ceil(LOCK_DAYS - elapsedDays));
  return { locked: true, daysRemaining };
}

/**
 * Convenience: a aluna tem algum agente bloqueado? Usado pra decidir
 * se reordena o feed (unlocked primeiro).
 */
export function hasAnyLocked(
  profile: ProfileForGate | null | undefined,
  agentSlugs: string[],
  now: Date = new Date(),
): boolean {
  return agentSlugs.some((slug) => getAgentLockStatus(profile, slug, now).locked);
}

/**
 * Formata texto do badge. "1 dia" no singular.
 */
export function formatDaysRemaining(daysRemaining: number): string {
  return daysRemaining === 1 ? "Disponível em 1 dia" : `Disponível em ${daysRemaining} dias`;
}
