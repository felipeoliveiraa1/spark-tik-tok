"use client";

import * as React from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  Phone,
  PhoneOff,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Trial = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  plan_expires_at: string | null;
  created_at: string;
  last_seen_at: string | null;
  hours_left: number | null;
  days_left: number | null;
  expired: boolean;
  urgency: "expired" | "today" | "soon" | "week" | "later";
};

type Kpis = {
  total: number;
  today: number;
  soon: number;
  week: number;
  later: number;
  expired: number;
  com_whatsapp: number;
};

type Resp = { trials: Trial[]; kpis: Kpis };

const URGENCY_META: Record<
  Trial["urgency"],
  { label: string; color: string; bg: string; border: string }
> = {
  expired: {
    label: "Expirou",
    color: "text-bad",
    bg: "bg-bad/10",
    border: "border-bad/20",
  },
  today: {
    label: "Expira hoje",
    color: "text-bad",
    bg: "bg-bad/10",
    border: "border-bad/20",
  },
  soon: {
    label: "1-3 dias",
    color: "text-warn",
    bg: "bg-warn/10",
    border: "border-warn/20",
  },
  week: {
    label: "4-7 dias",
    color: "text-spark-brand-deep",
    bg: "bg-spark-brand-soft",
    border: "border-spark-brand/20",
  },
  later: {
    label: "+7 dias",
    color: "text-good",
    bg: "bg-good/10",
    border: "border-good/20",
  },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function fmtRelativeFuture(daysLeft: number | null): string {
  if (daysLeft === null) return "—";
  if (daysLeft <= 0) return "hoje";
  if (daysLeft === 1) return "amanhã";
  return `em ${daysLeft} dias`;
}

function fmtRelativePast(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86400_000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export default function AdminTrialsPage() {
  const [data, setData] = React.useState<Resp | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/trials");
      if (cancelled) return;
      if (res.ok) {
        const d = (await res.json()) as Resp;
        setData(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-[1280px] mx-auto py-12 flex items-center gap-3 text-spark-ink-50">
        <Loader2 size={16} className="animate-spin" /> Carregando…
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="max-w-[1280px] mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-spark-ink-35">
          Trials ativos
        </span>
        <h1 className="font-display lowercase tracking-tight text-spark-ink leading-[0.95] text-[36px] lg:text-[48px]">
          trials
        </h1>
        <p className="text-[14px] text-spark-ink-50 max-w-[60ch] font-semibold">
          Quem está em trial agora, quando expira e quem precisa de atenção pra converter.
        </p>
      </header>

      {/* KPIs urgência */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Total em trial" value={k.total} icon={Gift} tone="brand" />
        <Kpi label="Expira hoje" value={k.today} icon={AlertCircle} tone={k.today > 0 ? "bad" : undefined} />
        <Kpi label="1-3 dias" value={k.soon} icon={Clock} tone={k.soon > 0 ? "warn" : undefined} />
        <Kpi label="4-7 dias" value={k.week} icon={Calendar} />
        <Kpi label="+7 dias" value={k.later} icon={CheckCircle2} tone="good" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Com WhatsApp" value={k.com_whatsapp} icon={Phone} />
        <Kpi
          label="Sem WhatsApp"
          value={k.total - k.com_whatsapp}
          icon={PhoneOff}
          tone={k.total - k.com_whatsapp > 0 ? "warn" : undefined}
        />
      </div>

      {/* Lista */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-[16px] font-extrabold tracking-tight text-spark-ink">
              Lista por urgência
            </h2>
            <p className="text-[12px] text-spark-ink-50 mt-0.5 font-semibold">
              Mais perto de expirar primeiro. Quem expirou também aparece (reativar manualmente).
            </p>
          </div>
        </div>

        <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
          {data.trials.length === 0 ? (
            <div className="px-5 py-12 text-center text-spark-ink-50">
              Nenhuma aluna em trial agora.
            </div>
          ) : (
            <ul className="divide-y divide-spark-hairline">
              {data.trials.map((t) => {
                const u = URGENCY_META[t.urgency];
                return (
                  <li
                    key={t.id}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-spark-surface-sunken/40 transition-colors"
                  >
                    {/* Avatar inicial */}
                    <div className="shrink-0 w-9 h-9 rounded-full bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center font-extrabold text-[13px]">
                      {(t.name?.[0] ?? t.email[0]).toUpperCase()}
                    </div>

                    {/* Nome + email */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate">
                        {t.name ?? t.email.split("@")[0]}
                      </div>
                      <div className="text-[11px] text-spark-ink-50 truncate mt-0.5 font-mono">
                        {t.email}
                        {t.whatsapp && (
                          <span className="ml-2 inline-flex items-center gap-1 text-spark-brand-deep">
                            <Phone size={9} strokeWidth={2.5} />
                            {t.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Entrou em */}
                    <div className="hidden sm:flex flex-col items-end shrink-0 mr-4">
                      <div className="text-[10px] uppercase tracking-wider text-spark-ink-35 font-extrabold">
                        entrou
                      </div>
                      <div className="text-[11.5px] font-mono text-spark-ink-70">
                        {fmtRelativePast(t.created_at)}
                      </div>
                    </div>

                    {/* Última atividade */}
                    <div className="hidden sm:flex flex-col items-end shrink-0 mr-4">
                      <div className="text-[10px] uppercase tracking-wider text-spark-ink-35 font-extrabold">
                        ativa
                      </div>
                      <div className="text-[11.5px] font-mono text-spark-ink-70">
                        {fmtRelativePast(t.last_seen_at)}
                      </div>
                    </div>

                    {/* Expira em */}
                    <div className="flex flex-col items-end shrink-0 mr-3">
                      <div className="text-[10px] uppercase tracking-wider text-spark-ink-35 font-extrabold">
                        expira
                      </div>
                      <div className="text-[12px] font-mono text-spark-ink">
                        {fmtDate(t.plan_expires_at)}
                      </div>
                    </div>

                    {/* Badge urgência */}
                    <div
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border",
                        u.bg,
                        u.color,
                        u.border,
                      )}
                    >
                      {u.label}
                      {t.days_left !== null && t.days_left > 0 && !t.expired && (
                        <span className="ml-1.5 opacity-70 font-mono normal-case tracking-normal">
                          ({fmtRelativeFuture(t.days_left)})
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-[12px] text-spark-ink-50 font-semibold">
          💡 <strong>Próximo passo:</strong> alunas com trial expirando em 1-3 dias merecem
          uma mensagem WhatsApp pra lembrar de assinar antes do prazo acabar.
          Posso adicionar um trigger automático <code>trial_expirando_3d</code> se quiser.
        </p>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone?: "brand" | "good" | "warn" | "bad";
}) {
  const iconBg =
    tone === "brand"
      ? "bg-spark-brand-soft text-spark-brand-deep"
      : tone === "good"
        ? "bg-good/10 text-good"
        : tone === "warn"
          ? "bg-warn/10 text-warn"
          : tone === "bad"
            ? "bg-bad/10 text-bad"
            : "bg-spark-surface-sunken text-spark-ink-70";
  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 shadow-rest">
      <div className={`w-8 h-8 rounded-spark-lg flex items-center justify-center mb-2 ${iconBg}`}>
        <Icon size={14} strokeWidth={2.2} />
      </div>
      <div className="font-mono font-extrabold text-spark-ink text-[22px] leading-none">
        {value}
      </div>
      <div className="text-[10.5px] text-spark-ink-50 mt-1 font-extrabold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
