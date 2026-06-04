"use client";

import * as React from "react";
import {
  X,
  Calendar,
  Gift,
  CheckCircle2,
  XCircle,
  Pause,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

type HistoryRow = {
  id: string;
  from_status: string | null;
  from_active: boolean | null;
  from_expires_at: string | null;
  to_status: string | null;
  to_active: boolean | null;
  to_expires_at: string | null;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  plan_status: string | null;
  plan_active: boolean | null;
  plan_expires_at: string | null;
  plan_canceled_at: string | null;
  plan_renewed_at: string | null;
  created_at: string | null;
  had_trial: boolean | null;
  role: string | null;
};

type Resp = { profile: Profile; history: HistoryRow[] };

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventLabel(row: HistoryRow): {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone: "good" | "warn" | "bad" | "brand" | "neutral";
} {
  const evt = row.metadata?.event as string | undefined;
  const to = row.to_status;
  if (evt === "subscription_created") return { label: "Conta criada", icon: Calendar, tone: "neutral" };
  if (evt === "kiwify_paid") return { label: "Pagamento aprovado", icon: CreditCard, tone: "good" };
  if (evt === "kiwify_renewed") return { label: "Assinatura renovada", icon: RefreshCw, tone: "good" };
  if (evt === "kiwify_canceled") return { label: "Cancelou assinatura", icon: Pause, tone: "warn" };
  if (evt === "kiwify_refunded") return { label: "Reembolsada", icon: XCircle, tone: "bad" };
  // Por status
  if (to === "trial") return { label: "Entrou em trial", icon: Gift, tone: "brand" };
  if (to === "active") return { label: "Virou pagante", icon: CheckCircle2, tone: "good" };
  if (to === "late") return { label: "Pagamento atrasado", icon: AlertCircle, tone: "warn" };
  if (to === "canceled") return { label: "Cancelado", icon: Pause, tone: "warn" };
  if (to === "refunded") return { label: "Reembolsado", icon: XCircle, tone: "bad" };
  if (to === "chargeback") return { label: "Chargeback", icon: XCircle, tone: "bad" };
  return { label: `→ ${to ?? "?"}`, icon: AlertCircle, tone: "neutral" };
}

const TONE_CLASSES = {
  good: "bg-good/10 text-good",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  brand: "bg-spark-brand-soft text-spark-brand-deep",
  neutral: "bg-spark-surface-sunken text-spark-ink-70",
};

export function ProfileHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<Resp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/profile-history?id=${userId}`);
        const j = (await res.json()) as Resp | { error: string };
        if (cancelled) return;
        if ("error" in j) {
          setError(j.error);
        } else {
          setData(j);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "erro");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-spark-surface w-full max-w-[520px] shadow-hero rounded-t-spark-3xl sm:rounded-spark-3xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-spark-surface px-5 py-4 border-b border-spark-hairline flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-spark-ink-50">
              Histórico de plano
            </div>
            {data?.profile && (
              <div className="text-[14px] font-extrabold text-spark-ink tracking-tight truncate mt-0.5">
                {data.profile.name ?? data.profile.email}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-spark-surface-sunken hover:bg-spark-ink-10 flex items-center justify-center text-spark-ink-70 transition-colors shrink-0 ml-3"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-5">
          {loading && (
            <div className="flex items-center gap-2 text-spark-ink-50 py-8 justify-center">
              <Loader2 size={14} className="animate-spin" />
              Carregando…
            </div>
          )}
          {error && (
            <div className="text-bad text-[13px] font-extrabold flex items-center gap-2">
              <AlertCircle size={13} strokeWidth={2.5} />
              {error}
            </div>
          )}
          {data && data.history.length === 0 && (
            <div className="text-spark-ink-50 text-[13px] py-8 text-center">
              Sem histórico registrado.
            </div>
          )}
          {data && data.history.length > 0 && (
            <ol className="relative pl-5">
              {/* Linha vertical do timeline */}
              <div
                aria-hidden
                className="absolute left-1 top-3 bottom-3 w-px bg-spark-hairline"
              />
              {data.history.map((row) => {
                const { label, icon: Icon, tone } = getEventLabel(row);
                return (
                  <li key={row.id} className="relative mb-4 last:mb-0">
                    {/* Ponto */}
                    <div
                      className={cn(
                        "absolute -left-5 top-0.5 w-3 h-3 rounded-full ring-2 ring-spark-surface",
                        TONE_CLASSES[tone].replace("text-", "bg-").split(" ")[1] ??
                          "bg-spark-ink-35",
                      )}
                    />
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                              TONE_CLASSES[tone],
                            )}
                          >
                            <Icon size={11} strokeWidth={2.5} />
                          </div>
                          <span className="text-[13px] font-extrabold text-spark-ink tracking-tight">
                            {label}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono text-spark-ink-50 shrink-0">
                          {fmtDate(row.created_at)}
                        </span>
                      </div>

                      {/* Detalhes opcionais */}
                      {(row.from_status || row.to_status) && (
                        <div className="ml-8 mt-1 text-[11px] text-spark-ink-50 font-mono">
                          {row.from_status ?? "—"} → {row.to_status ?? "—"}
                          {typeof row.metadata?.amount_cents === "number" && (
                            <span className="ml-2 text-spark-brand-deep font-extrabold">
                              R${" "}
                              {(row.metadata.amount_cents / 100).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                      )}
                      {row.source && row.source !== "unknown" && (
                        <div className="ml-8 mt-0.5 text-[10px] text-spark-ink-35 font-mono">
                          fonte: {row.source}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
