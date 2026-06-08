"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ExternalLink, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { LEAD_STATUSES, STATUS_META, type LeadStatus } from "@/lib/crm";

type AgentStat = {
  id: string;
  name: string | null;
  email: string | null;
  by_status: Record<LeadStatus, number>;
  total: number;
};

type Stats = {
  by_status: Record<LeadStatus, number>;
  last_7_days: number;
  last_30_days: {
    total: number;
    converted: number;
    lost: number;
    conversion_rate: number;
  };
  by_agent: AgentStat[];
};

export default function CrmStatsPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/crm/stats", { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as Stats;
          setStats(j);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-spark-ink-50">
        <Loader2 size={14} className="animate-spin" />
        carregando…
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-spark-ink-50">
        Não consegui carregar as métricas
      </div>
    );
  }

  const total = Object.values(stats.by_status).reduce((a, b) => a + b, 0);
  const conversionPct = (stats.last_30_days.conversion_rate * 100).toFixed(1);

  return (
    <div className="space-y-8 max-w-[1100px]">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-eyebrow text-spark-brand-deep">✦ crm</div>
          <h1 className="font-display lowercase text-fluid-h2 leading-none tracking-tight mt-1">
            métricas de vendas
          </h1>
          <p className="mt-2 text-[13px] text-spark-ink-70 max-w-[60ch]">
            Acompanha o trabalho da equipe no{" "}
            <Link
              href="/crm-metodotts"
              className="text-spark-brand-deep font-extrabold inline-flex items-center gap-0.5"
            >
              /crm-metodotts
              <ExternalLink size={11} strokeWidth={2.5} />
            </Link>
            .
          </p>
        </div>
      </header>

      {/* Big numbers */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <BigStat
          label="Leads totais"
          value={total}
          icon={<Users size={14} strokeWidth={2.5} />}
          tone="info"
        />
        <BigStat
          label="Novos (7d)"
          value={stats.last_7_days}
          icon={<TrendingUp size={14} strokeWidth={2.5} />}
          tone="info"
        />
        <BigStat
          label="Convertidos (30d)"
          value={stats.last_30_days.converted}
          tone="good"
        />
        <BigStat
          label="Conversão (30d)"
          value={`${conversionPct}%`}
          tone="info"
        />
      </section>

      {/* Pipeline por status */}
      <section>
        <h2 className="text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-3">
          Pipeline atual
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LEAD_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const count = stats.by_status[status] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={status}
                className={cn(
                  "rounded-spark-xl p-4 border border-spark-hairline",
                  meta.tone === "good" && "bg-good/5",
                  meta.tone === "bad" && "bg-bad/5",
                  meta.tone === "warn" && "bg-warn/5",
                  meta.tone === "info" && "bg-spark-brand/5",
                  meta.tone === "neutral" && "bg-spark-surface",
                )}
              >
                <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-spark-ink">
                  <span>{meta.emoji}</span>
                  {meta.label}
                </div>
                <div className="mt-2 text-[28px] font-display lowercase leading-none tracking-tight">
                  {count}
                </div>
                <div className="mt-1.5 text-[10.5px] text-spark-ink-50 font-mono">
                  {pct.toFixed(0)}% do total
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Por agente */}
      <section>
        <h2 className="text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-3">
          Trabalho por agente
        </h2>
        {stats.by_agent.length === 0 ? (
          <div className="text-spark-ink-50 text-[13px]">
            Nenhum lead atribuído ainda. Pra atribuir, abre o lead no{" "}
            <Link
              href="/crm-metodotts"
              className="text-spark-brand-deep font-extrabold"
            >
              CRM
            </Link>{" "}
            e usa o campo &quot;Atribuído a&quot;.
          </div>
        ) : (
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline divide-y divide-spark-hairline overflow-hidden">
            {stats.by_agent
              .sort((a, b) => b.total - a.total)
              .map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BigStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone: "info" | "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-spark-xl p-5 border border-spark-hairline",
        tone === "info" && "bg-spark-brand/5",
        tone === "good" && "bg-good/5",
        tone === "bad" && "bg-bad/5",
      )}
    >
      <div className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-[36px] font-display lowercase leading-none tracking-tight">
        {value}
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentStat }) {
  const convertedPct =
    agent.total > 0 ? ((agent.by_status.convertido / agent.total) * 100).toFixed(0) : "0";
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold text-spark-ink truncate">
            {agent.name ?? agent.email}
          </div>
          <div className="text-[11px] text-spark-ink-50 font-mono truncate">
            {agent.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-display lowercase leading-none">
            {agent.total}
          </div>
          <div className="text-[10px] text-spark-ink-50 font-mono">
            leads totais
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {LEAD_STATUSES.map((status) => {
          const meta = STATUS_META[status];
          return (
            <div
              key={status}
              className={cn(
                "rounded-spark-lg px-2 py-1.5 text-center border border-spark-hairline",
                meta.tone === "good" && "bg-good/5",
                meta.tone === "bad" && "bg-bad/5",
              )}
            >
              <div className="text-[14px] font-extrabold text-spark-ink">
                {agent.by_status[status] ?? 0}
              </div>
              <div className="text-[9px] text-spark-ink-50 truncate">
                {meta.emoji} {meta.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10.5px] text-spark-ink-50">
        Taxa de conversão:{" "}
        <strong className="text-spark-ink font-extrabold">{convertedPct}%</strong>
      </div>
    </div>
  );
}
