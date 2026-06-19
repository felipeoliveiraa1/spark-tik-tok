"use client";

import * as React from "react";
import {
  Search,
  Loader2,
  RotateCcw,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Inbox,
} from "lucide-react";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Status = "all" | "pending_warn" | "warned" | "ready_to_remove" | "removed";

type Row = {
  id: string;
  name: string | null;
  email: string;
  whatsapp_masked: string | null;
  plan_status: string | null;
  plan_canceled_at: string | null;
  plan_expires_at: string | null;
  group_removal_warned_at: string | null;
  group_removed_at: string | null;
  status: Exclude<Status, "all">;
  last_audit: { action: string; reason: string | null; created_at: string } | null;
};

type Stats = {
  pending_warn: number;
  warned_awaiting_24h: number;
  ready_to_remove: number;
  removed_total: number;
  removed_last_7d: number;
  failed_last_24h: number;
};

type HistoryEvent = {
  id: string;
  action: string;
  reason: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

const STATUS_LABELS: Record<Exclude<Status, "all">, string> = {
  pending_warn: "Pendente aviso",
  warned: "Avisada",
  ready_to_remove: "Pronta remover",
  removed: "Removida",
};

const STATUS_COLORS: Record<Exclude<Status, "all">, string> = {
  pending_warn: "bg-spark-ink-10 text-spark-ink-70",
  warned: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ready_to_remove: "bg-orange-50 text-orange-700 border-orange-200",
  removed: "bg-red-50 text-red-700 border-red-200",
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s atrás`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}min atrás`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h atrás`;
  const day = Math.round(hr / 24);
  return `${day}d atrás`;
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses = {
    default: "border-spark-hairline",
    warning: "border-yellow-200 bg-yellow-50/40",
    danger: "border-red-200 bg-red-50/40",
    success: "border-emerald-200 bg-emerald-50/40",
  }[tone];
  return (
    <div className={cn("rounded-spark-xl border bg-spark-surface px-4 py-3", toneClasses)}>
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-spark-ink-50">
        {label}
      </div>
      <div className="mt-1 font-display text-[28px] leading-none text-spark-ink">{value}</div>
      {hint && <div className="mt-1 text-[11.5px] text-spark-ink-50">{hint}</div>}
    </div>
  );
}

function HistoryModal({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<{
    profile: { name: string | null; email: string } | null;
    events: HistoryEvent[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void fetch(`/api/admin/group-removals/${userId}/history`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-spark-ink/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-spark-surface rounded-spark-xl border border-spark-hairline shadow-lift max-w-[640px] w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-spark-hairline flex items-center justify-between">
          <div>
            <div className="text-eyebrow text-spark-ink-50">Histórico</div>
            <div className="font-extrabold text-spark-ink mt-0.5">
              {data?.profile?.name ?? data?.profile?.email ?? "Carregando…"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
          >
            <XCircle size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-spark-ink-50">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : data?.events.length === 0 ? (
            <div className="text-center py-12 text-spark-ink-50 text-[13px]">
              Nenhum evento registrado.
            </div>
          ) : (
            <ol className="space-y-3">
              {(data?.events ?? []).map((ev) => (
                <li
                  key={ev.id}
                  className="border border-spark-hairline rounded-spark-lg px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border",
                          ev.action === "warned" && "bg-yellow-50 text-yellow-700 border-yellow-200",
                          ev.action === "removed" && "bg-red-50 text-red-700 border-red-200",
                          ev.action === "failed" && "bg-orange-50 text-orange-700 border-orange-200",
                          ev.action === "skipped" && "bg-spark-ink-10 text-spark-ink-70 border-transparent",
                        )}
                      >
                        {ev.action}
                      </span>
                      <span className="text-[12.5px] text-spark-ink-70">{ev.reason ?? "—"}</span>
                    </div>
                    <time className="text-[11px] text-spark-ink-50 font-mono">
                      {fmtDateTime(ev.created_at)}
                    </time>
                  </div>
                  {Object.keys(ev.payload).length > 0 && (
                    <details className="mt-1.5">
                      <summary className="text-[11px] text-spark-ink-50 cursor-pointer hover:text-spark-ink-70">
                        payload
                      </summary>
                      <pre className="mt-1 text-[11px] bg-spark-surface-sunken rounded p-2 overflow-x-auto">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminGroupRemovalsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<Status>("all");
  const [search, setSearch] = React.useState("");
  const [historyUserId, setHistoryUserId] = React.useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status: statusFilter, limit: "100" });
      if (search) qs.set("search", search);
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/admin/group-removals?${qs}`, { cache: "no-store" }),
        fetch(`/api/admin/group-removals/stats`, { cache: "no-store" }),
      ]);
      if (listRes.ok) {
        const j = (await listRes.json()) as { items: Row[] };
        setRows(j.items);
      }
      if (statsRes.ok) {
        const j = (await statsRes.json()) as Stats;
        setStats(j);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRestore = async (row: Row) => {
    const ok = await confirm({
      title: `Restaurar ${row.name ?? row.email}?`,
      description:
        "Zera os flags de aviso e remoção do grupo. NÃO re-adiciona automaticamente — você precisa convidar de volta no WhatsApp se ela ainda quiser participar.",
      confirmLabel: "Restaurar",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/group-removals/${row.id}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Aluna restaurada");
        void refresh();
      } else {
        toast.error("Não consegui restaurar");
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div>
        <div className="text-eyebrow text-spark-brand-deep">Admin</div>
        <h1 className="font-display text-[34px] leading-none text-spark-ink mt-1">
          Saídas do grupo
        </h1>
        <p className="text-spark-ink-70 mt-2 max-w-[60ch]">
          Pipeline automático: alunas com plano cancelado recebem aviso WhatsApp e 24h depois são
          removidas dos grupos. Tudo auditado aqui.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Pendente aviso"
          value={stats?.pending_warn ?? 0}
          hint="Cancelou, ainda não foi avisada"
        />
        <StatCard
          label="Aguardando 24h"
          value={stats?.warned_awaiting_24h ?? 0}
          hint="Já recebeu o aviso"
          tone="warning"
        />
        <StatCard
          label="Pronta remover"
          value={stats?.ready_to_remove ?? 0}
          hint="Próximo tick remove"
          tone="warning"
        />
        <StatCard
          label="Removidas (total)"
          value={stats?.removed_total ?? 0}
          tone="danger"
        />
        <StatCard
          label="Removidas 7d"
          value={stats?.removed_last_7d ?? 0}
          tone="danger"
        />
        <StatCard
          label="Erros 24h"
          value={stats?.failed_last_24h ?? 0}
          hint="audits 'failed'"
          tone={stats && stats.failed_last_24h > 0 ? "danger" : "default"}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-[420px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-spark-ink-35"
          />
          <input
            type="search"
            placeholder="Buscar por nome ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending_warn", "warned", "ready_to_remove", "removed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-extrabold border transition-all",
                statusFilter === s
                  ? "bg-brand-grad text-white border-transparent shadow-lift-brand"
                  : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-brand/40",
              )}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-spark-ink-50">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-spark-ink-50 text-[13px]">
            <Inbox size={20} className="mx-auto mb-2 opacity-60" />
            Nenhuma aluna nesse filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-spark-surface-sunken text-[11px] uppercase tracking-[0.12em] text-spark-ink-50">
                <tr>
                  <th className="px-4 py-3 text-left font-extrabold">Aluna</th>
                  <th className="px-3 py-3 text-left font-extrabold">Status plano</th>
                  <th className="px-3 py-3 text-left font-extrabold">Fase</th>
                  <th className="px-3 py-3 text-left font-extrabold">Avisada</th>
                  <th className="px-3 py-3 text-left font-extrabold">Removida</th>
                  <th className="px-3 py-3 text-left font-extrabold">Último evento</th>
                  <th className="px-3 py-3 text-right font-extrabold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-spark-hairline hover:bg-spark-surface-sunken/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-extrabold text-spark-ink">{row.name ?? "—"}</div>
                      <div className="text-[11.5px] text-spark-ink-50">{row.email}</div>
                      {row.whatsapp_masked && (
                        <div className="text-[11px] text-spark-ink-35 font-mono mt-0.5">
                          {row.whatsapp_masked}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11.5px] text-spark-ink-70 capitalize">
                        {row.plan_status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border",
                          STATUS_COLORS[row.status],
                        )}
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-spark-ink-70">
                      {row.group_removal_warned_at ? (
                        <>
                          <div>{fmtDateTime(row.group_removal_warned_at)}</div>
                          <div className="text-spark-ink-35 text-[10.5px]">
                            {fmtRelative(row.group_removal_warned_at)}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-spark-ink-70">
                      {row.group_removed_at ? (
                        <>
                          <div>{fmtDateTime(row.group_removed_at)}</div>
                          <div className="text-spark-ink-35 text-[10.5px]">
                            {fmtRelative(row.group_removed_at)}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-[11.5px]">
                      {row.last_audit ? (
                        <>
                          <div className="font-extrabold text-spark-ink">
                            {row.last_audit.action}
                          </div>
                          <div className="text-spark-ink-50">{row.last_audit.reason ?? "—"}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setHistoryUserId(row.id)}
                          title="Ver histórico"
                          className="w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70 hover:text-spark-ink"
                        >
                          <History size={14} />
                        </button>
                        {(row.group_removal_warned_at || row.group_removed_at) && (
                          <button
                            onClick={() => handleRestore(row)}
                            title="Restaurar (zera os flags)"
                            className="w-8 h-8 rounded-full hover:bg-emerald-50 flex items-center justify-center text-emerald-700"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="text-[12px] text-spark-ink-50 max-w-[60ch]">
        <p>
          O cron roda 1x por hora. <strong>Avisada</strong> → recebeu o WhatsApp e o relógio de 24h
          começou. <strong>Pronta remover</strong> → próximo tick vai sair dos grupos.{" "}
          <strong>Restaurar</strong> zera os flags (não re-adiciona ao grupo — convide manualmente).
        </p>
      </div>

      <HistoryModal userId={historyUserId} onClose={() => setHistoryUserId(null)} />
    </div>
  );
}
