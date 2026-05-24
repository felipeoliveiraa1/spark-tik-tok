"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import {
  getDisplayStatus,
  daysUntilExpiration,
  type PlanAccessProfile,
} from "@/lib/plan-access";

type ProfileMin = PlanAccessProfile & {
  plan_canceled_at?: string | null;
};

/**
 * Banner global que aparece no topo do app quando a assinatura precisa
 * de atenção. Tem 2 estados:
 *   - late: cobrança atrasada (warning amarelo) → CTA pra atualizar pgto
 *   - canceled próximo: faltam X dias pro acesso encerrar (warning rose)
 *
 * Quando active sem problemas, retorna null (não renderiza).
 *
 * Fetcha /api/me uma vez ao montar. Não é crítico — é só pro warning.
 */
export function PlanAlert() {
  const [profile, setProfile] = React.useState<ProfileMin | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: ProfileMin } | null) => {
        if (!cancelled && data?.profile) setProfile(data.profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!profile || dismissed) return null;

  const status = getDisplayStatus(profile);

  // Atraso: warning amarelo + CTA
  if (status === "late") {
    return (
      <Banner
        tone="warn"
        message="Cobrança atrasada — atualize seu cartão pra não perder acesso."
        ctaLabel="Atualizar"
        ctaHref="/conta"
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  // Cancelado: aviso de quantos dias faltam (se <= 7)
  if (status === "canceled") {
    const days = daysUntilExpiration(profile);
    if (days !== null && days <= 7) {
      return (
        <Banner
          tone="brand"
          message={
            days === 1
              ? "Último dia de acesso. Reativa pelo Kiwify pra continuar 💕"
              : `${days} dias até o acesso encerrar. Reativa pra não perder 💕`
          }
          ctaLabel="Reativar"
          ctaHref="/plano-inativo"
          onDismiss={() => setDismissed(true)}
        />
      );
    }
  }

  return null;
}

function Banner({
  tone,
  message,
  ctaLabel,
  ctaHref,
  onDismiss,
}: {
  tone: "warn" | "brand";
  message: string;
  ctaLabel: string;
  ctaHref: string;
  onDismiss: () => void;
}) {
  const bgClass =
    tone === "warn"
      ? "bg-warn/15 text-warn border-warn/30"
      : "bg-spark-brand-soft text-spark-brand-deep border-spark-brand/25";

  return (
    <div
      className={`px-3 py-2.5 flex items-center gap-2 text-[12.5px] font-semibold leading-snug border-b ${bgClass}`}
      role="alert"
    >
      <AlertTriangle size={14} strokeWidth={2.2} className="shrink-0" />
      <span className="flex-1 min-w-0">{message}</span>
      <Link
        href={ctaHref}
        className="shrink-0 px-2.5 py-1 rounded-full bg-white/90 text-[11.5px] font-extrabold hover:bg-white transition-colors"
      >
        {ctaLabel}
      </Link>
      <button
        type="button"
        aria-label="Dispensar aviso"
        onClick={onDismiss}
        className="shrink-0 w-6 h-6 rounded-full hover:bg-white/30 flex items-center justify-center transition-colors"
      >
        <X size={12} strokeWidth={2.2} />
      </button>
    </div>
  );
}
