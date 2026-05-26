/**
 * Helpers pra decidir se uma aluna tem acesso ao app baseado no status
 * da assinatura. Usado pelo middleware (server-side) e pelas pages.
 */

export type PlanStatus =
  | "inactive"
  | "active"
  | "trial"
  | "late"
  | "canceled"
  | "refunded"
  | "chargeback";

export type PlanAccessProfile = {
  plan_active: boolean | null;
  plan_status?: string | null;
  plan_expires_at?: string | null;
};

/**
 * Decide se a aluna tem acesso AGORA.
 *
 * Lógica:
 *   - status refunded/chargeback → bloqueado sempre.
 *   - tem plan_expires_at e já passou → bloqueado (cobre trial expirado).
 *   - plan_active=true → liberado (cobre active, trial em curso, late).
 *   - status canceled → libera SE expires_at no futuro.
 *   - inactive → bloqueado.
 */
export function hasActiveAccess(profile: PlanAccessProfile | null | undefined): boolean {
  if (!profile) return false;
  // Refunded/chargeback bloqueia sempre, mesmo se plan_active ainda for true
  if (profile.plan_status === "refunded" || profile.plan_status === "chargeback") {
    return false;
  }
  // Expirado bloqueia (trial vencido cai aqui)
  if (profile.plan_expires_at) {
    const expired = new Date(profile.plan_expires_at).getTime() <= Date.now();
    if (expired) return false;
  }
  if (profile.plan_active === true) return true;
  if (profile.plan_status === "canceled" && profile.plan_expires_at) {
    return new Date(profile.plan_expires_at).getTime() > Date.now();
  }
  return false;
}

/**
 * Retorna o status normalizado pra UI. Quando plan_active=true mas
 * plan_status não foi setado (contas antigas), assume 'active'.
 */
export function getDisplayStatus(profile: PlanAccessProfile | null | undefined): PlanStatus {
  if (!profile) return "inactive";
  const raw = (profile.plan_status ?? "").toLowerCase() as PlanStatus;
  const valid: PlanStatus[] = [
    "inactive",
    "active",
    "trial",
    "late",
    "canceled",
    "refunded",
    "chargeback",
  ];
  if (valid.includes(raw)) return raw;
  return profile.plan_active ? "active" : "inactive";
}

/**
 * Texto humano pro estado do plano (usado em /conta + banner).
 */
export function statusLabel(status: PlanStatus): { label: string; tone: "good" | "warn" | "bad" | "neutral" } {
  switch (status) {
    case "active":
      return { label: "Plano ativo ✨", tone: "good" };
    case "trial":
      return { label: "Período de teste ✨", tone: "good" };
    case "late":
      return { label: "Pagamento atrasado", tone: "warn" };
    case "canceled":
      return { label: "Cancelado (acesso até a data)", tone: "warn" };
    case "refunded":
      return { label: "Reembolsado", tone: "bad" };
    case "chargeback":
      return { label: "Chargeback", tone: "bad" };
    case "inactive":
    default:
      return { label: "Plano inativo", tone: "neutral" };
  }
}

/**
 * Quantos dias faltam pro acesso expirar (em canceled).
 * Retorna null se não tem expires_at ou já passou.
 */
export function daysUntilExpiration(profile: PlanAccessProfile | null | undefined): number | null {
  if (!profile?.plan_expires_at) return null;
  const ms = new Date(profile.plan_expires_at).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}
