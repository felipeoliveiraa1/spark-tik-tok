"use client";

import * as React from "react";
import {
  Search,
  RefreshCw,
  X,
  Phone,
  ExternalLink,
  MessageSquare,
  Loader2,
  UserCheck,
  LogOut,
  BarChart3,
} from "lucide-react";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/lib/auth";
import {
  LEAD_STATUSES,
  STATUS_META,
  REVENUE_LABELS,
  phoneToWhatsAppLink,
  tiktokProfileUrl,
  type Lead,
  type LeadEvent,
  type LeadStatus,
} from "@/lib/crm";

// =================================================================
// TYPES
// =================================================================

type Agent = {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "crm_agent";
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
};

// =================================================================
// MAIN PAGE
// =================================================================

export default function CrmMetodoTtsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterAgent, setFilterAgent] = React.useState<string>("all");
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const toast = useToast();

  const refresh = React.useCallback(async () => {
    try {
      const url = new URL("/api/crm/leads", window.location.origin);
      if (search.trim()) url.searchParams.set("search", search.trim());
      if (filterAgent !== "all") url.searchParams.set("assigned_to", filterAgent);
      const [leadsRes, statsRes] = await Promise.all([
        fetch(url.toString(), { cache: "no-store" }),
        fetch("/api/crm/stats", { cache: "no-store" }),
      ]);
      if (leadsRes.ok) {
        const j = (await leadsRes.json()) as { leads: Lead[] };
        setLeads(j.leads);
      }
      if (statsRes.ok) {
        const j = (await statsRes.json()) as Stats;
        setStats(j);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [search, filterAgent]);

  // Carrega agents 1x
  React.useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/crm/agents", { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as { agents: Agent[] };
          setAgents(j.agents);
        }
      } catch {
        // silencioso
      }
    })();
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // Atualiza lead específico (após PATCH) sem refetch completo
  const updateLeadInline = React.useCallback((updated: Lead) => {
    setLeads((arr) => arr.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead((cur) => (cur && cur.id === updated.id ? updated : cur));
  }, []);

  const handleStatusChange = async (lead: Lead, status: LeadStatus) => {
    if (lead.status === status) return;
    // Optimistic
    const snapshot = lead;
    updateLeadInline({ ...lead, status });
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        updateLeadInline(snapshot);
        toast.error("Não consegui mudar o status");
        return;
      }
      const j = (await res.json()) as { lead: Lead };
      if (j.lead) updateLeadInline(j.lead);
      toast.success(`Movido pra ${STATUS_META[status].label}`);
      void refresh();
    } catch {
      updateLeadInline(snapshot);
      toast.error("Sem conexão");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <StatsBar stats={stats} />
      <ControlsBar
        search={search}
        onSearchChange={setSearch}
        filterAgent={filterAgent}
        onFilterAgentChange={setFilterAgent}
        agents={agents}
        onRefresh={refresh}
        loading={loading}
      />
      <main className="flex-1 overflow-auto">
        {loading && leads.length === 0 ? (
          <div className="flex items-center justify-center h-full text-spark-ink-50">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : (
          <KanbanBoard
            leads={leads}
            onLeadClick={setSelectedLead}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          agents={agents}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLeadInline}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}

// =================================================================
// HEADER
// =================================================================

function Header() {
  return (
    <header className="px-5 py-3.5 border-b border-spark-hairline bg-spark-surface flex items-center justify-between shrink-0">
      <div>
        <div className="text-[10px] uppercase tracking-widest font-extrabold text-spark-brand-deep">
          ✦ CRM
        </div>
        <h1 className="text-[18px] font-display lowercase leading-none mt-0.5 tracking-tight">
          método tts · vendas
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/admin/crm-stats"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-ink text-[11.5px] font-extrabold transition-colors"
          title="Ver métricas"
        >
          <BarChart3 size={12} strokeWidth={2.5} />
          Métricas
        </a>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-spark-ink text-white text-[11.5px] font-extrabold hover:bg-spark-brand-deep transition-colors"
          >
            <LogOut size={12} strokeWidth={2.5} />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}

// =================================================================
// STATS BAR
// =================================================================

function StatsBar({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const conversionPct = (stats.last_30_days.conversion_rate * 100).toFixed(0);
  return (
    <div className="px-5 py-3 border-b border-spark-hairline bg-spark-bg flex items-center gap-2 overflow-x-auto shrink-0">
      <StatChip label="Novos (7d)" value={stats.last_7_days} tone="info" />
      <StatChip
        label="Convertidos (30d)"
        value={stats.last_30_days.converted}
        tone="good"
      />
      <StatChip label="Perdidos (30d)" value={stats.last_30_days.lost} tone="bad" />
      <StatChip label="Conversão (30d)" value={`${conversionPct}%`} tone="info" />
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "info" | "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-extrabold whitespace-nowrap",
        tone === "info" && "bg-spark-brand/10 text-spark-brand-deep",
        tone === "good" && "bg-good/10 text-good",
        tone === "bad" && "bg-bad/10 text-bad",
      )}
    >
      <span>{label}</span>
      <span className="text-spark-ink font-mono">{value}</span>
    </div>
  );
}

// =================================================================
// CONTROLS BAR
// =================================================================

function ControlsBar({
  search,
  onSearchChange,
  filterAgent,
  onFilterAgentChange,
  agents,
  onRefresh,
  loading,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filterAgent: string;
  onFilterAgentChange: (v: string) => void;
  agents: Agent[];
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="px-5 py-2.5 border-b border-spark-hairline bg-spark-surface flex items-center gap-2 shrink-0">
      <div className="relative flex-1 max-w-[400px]">
        <Search
          size={13}
          strokeWidth={2.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-spark-ink-50"
        />
        <input
          type="search"
          placeholder="Buscar nome, telefone ou @tiktok"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-full bg-spark-bg border border-spark-hairline focus:border-spark-brand outline-none text-[12.5px] font-semibold"
        />
      </div>
      <select
        value={filterAgent}
        onChange={(e) => onFilterAgentChange(e.target.value)}
        className="px-3 py-2 rounded-full bg-spark-bg border border-spark-hairline text-[12px] font-extrabold cursor-pointer"
      >
        <option value="all">Todos os agentes</option>
        <option value="unassigned">Sem atribuição</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name ?? a.email}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-spark-bg border border-spark-hairline text-spark-ink-70 hover:text-spark-ink disabled:opacity-50"
        aria-label="Atualizar"
      >
        <RefreshCw size={13} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

// =================================================================
// KANBAN BOARD
// =================================================================

function KanbanBoard({
  leads,
  onLeadClick,
  onStatusChange,
}: {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  const grouped = React.useMemo(() => {
    const m = new Map<LeadStatus, Lead[]>();
    for (const s of LEAD_STATUSES) m.set(s, []);
    for (const l of leads) {
      const arr = m.get(l.status);
      if (arr) arr.push(l);
    }
    return m;
  }, [leads]);

  return (
    <div className="flex gap-3 p-4 h-full overflow-x-auto">
      {LEAD_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          leads={grouped.get(status) ?? []}
          onLeadClick={onLeadClick}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  onLeadClick,
  onStatusChange,
}: {
  status: LeadStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  const meta = STATUS_META[status];
  return (
    <div className="w-[280px] shrink-0 flex flex-col bg-spark-surface rounded-spark-xl border border-spark-hairline">
      <div
        className={cn(
          "px-3 py-2.5 rounded-t-spark-xl flex items-center justify-between gap-2 sticky top-0",
          meta.tone === "good" && "bg-good/10",
          meta.tone === "bad" && "bg-bad/10",
          meta.tone === "warn" && "bg-warn/10",
          meta.tone === "info" && "bg-spark-brand/10",
          meta.tone === "neutral" && "bg-spark-surface-sunken",
        )}
      >
        <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-spark-ink">
          <span>{meta.emoji}</span>
          {meta.label}
        </div>
        <span className="text-[10px] font-mono font-extrabold text-spark-ink-50">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 min-h-0">
        {leads.length === 0 ? (
          <div className="text-[11.5px] text-spark-ink-50 text-center py-4 italic">
            vazio
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
              onStatusChange={(s) => onStatusChange(lead, s)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =================================================================
// LEAD CARD (no Kanban)
// =================================================================

function LeadCard({
  lead,
  onClick,
  onStatusChange,
}: {
  lead: Lead;
  onClick: () => void;
  onStatusChange: (status: LeadStatus) => void;
}) {
  const meta = STATUS_META[lead.status];
  return (
    <div
      onClick={onClick}
      className="rounded-spark-lg bg-spark-bg border border-spark-hairline p-3 cursor-pointer hover:border-spark-brand/40 hover:shadow-rest transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-extrabold text-spark-ink truncate">
            {lead.nome}
          </div>
          <div className="text-[10.5px] text-spark-ink-50 font-mono mt-0.5">
            @{lead.tiktok_handle.replace(/^@/, "")}
          </div>
        </div>
        {lead.already_selling && lead.revenue_range && (
          <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full bg-good/10 text-good whitespace-nowrap">
            {REVENUE_LABELS[lead.revenue_range] ?? lead.revenue_range}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <a
          href={phoneToWhatsAppLink(lead.telefone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-good/10 text-good text-[10px] font-extrabold hover:bg-good/20"
        >
          <Phone size={9} strokeWidth={2.5} />
          WhatsApp
        </a>
        <select
          value={lead.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
          className="px-1.5 py-1 rounded-full bg-spark-surface text-[10px] font-extrabold border border-spark-hairline cursor-pointer ml-auto"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].emoji} {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>
      {lead.admin_note && (
        <div className="mt-2 text-[10.5px] text-spark-ink-70 italic line-clamp-2 border-l-2 border-spark-brand/30 pl-2">
          {lead.admin_note}
        </div>
      )}
      <div className="mt-1.5 text-[9px] text-spark-ink-50 font-mono">
        {new Date(lead.created_at).toLocaleDateString("pt-BR")} ·{" "}
        <span className={cn(
          meta.tone === "good" && "text-good",
          meta.tone === "bad" && "text-bad",
        )}>
          {meta.emoji}
        </span>
      </div>
    </div>
  );
}

// =================================================================
// LEAD DRAWER (modal/drawer com detalhes)
// =================================================================

function LeadDrawer({
  lead,
  agents,
  onClose,
  onUpdate,
  onRefresh,
}: {
  lead: Lead;
  agents: Agent[];
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
  onRefresh: () => void;
}) {
  const [events, setEvents] = React.useState<LeadEvent[]>([]);
  const [note, setNote] = React.useState(lead.admin_note ?? "");
  const [newEvent, setNewEvent] = React.useState("");
  const [eventKind, setEventKind] = React.useState<"note" | "contact_attempt">("contact_attempt");
  const [savingNote, setSavingNote] = React.useState(false);
  const [savingEvent, setSavingEvent] = React.useState(false);
  const [loadingEvents, setLoadingEvents] = React.useState(true);
  const toast = useToast();
  const confirm = useConfirm();

  React.useEffect(() => {
    setNote(lead.admin_note ?? "");
  }, [lead.admin_note]);

  React.useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/crm/leads/${lead.id}/events`, {
          cache: "no-store",
        });
        if (r.ok) {
          const j = (await r.json()) as { events: LeadEvent[] };
          setEvents(j.events);
        }
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [lead.id]);

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_note: note }),
      });
      if (res.ok) {
        const j = (await res.json()) as { lead: Lead };
        if (j.lead) onUpdate(j.lead);
        toast.success("Nota salva");
      } else {
        toast.error("Não consegui salvar");
      }
    } catch {
      toast.error("Sem conexão");
    } finally {
      setSavingNote(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.trim()) return;
    setSavingEvent(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: eventKind, text: newEvent.trim() }),
      });
      if (res.ok) {
        setNewEvent("");
        // Refetch eventos
        const r = await fetch(`/api/crm/leads/${lead.id}/events`, {
          cache: "no-store",
        });
        if (r.ok) {
          const j = (await r.json()) as { events: LeadEvent[] };
          setEvents(j.events);
        }
        toast.success("Registrado");
      } else {
        toast.error("Não consegui registrar");
      }
    } catch {
      toast.error("Sem conexão");
    } finally {
      setSavingEvent(false);
    }
  };

  const changeAssigned = async (agentId: string | null) => {
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assigned_to: agentId }),
      });
      if (res.ok) {
        const j = (await res.json()) as { lead: Lead };
        if (j.lead) onUpdate(j.lead);
        void onRefresh();
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  const changeStatus = async (status: LeadStatus) => {
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const j = (await res.json()) as { lead: Lead };
        if (j.lead) onUpdate(j.lead);
        toast.success(`Movido pra ${STATUS_META[status].label}`);
        void onRefresh();
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  const deleteLead = async () => {
    const ok = await confirm({
      title: "Apagar lead?",
      description: "Essa ação não pode ser desfeita. Só admins podem apagar.",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Lead removido");
        onClose();
        void onRefresh();
      } else if (res.status === 403) {
        toast.error("Só admins podem apagar");
      } else {
        toast.error("Não consegui apagar");
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  const assignedAgent = lead.assigned_to
    ? agents.find((a) => a.id === lead.assigned_to)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div
        className="absolute inset-0 bg-spark-ink/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-[520px] bg-spark-surface flex flex-col shadow-hero overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-spark-hairline flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-spark-brand-deep">
              ✦ lead
            </div>
            <h2 className="text-[20px] font-display lowercase leading-none mt-1 tracking-tight truncate">
              {lead.nome.toLowerCase()}
            </h2>
            <div className="text-[11px] text-spark-ink-50 font-mono mt-1">
              {new Date(lead.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:bg-spark-surface-sunken flex items-center justify-center"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Acoes rapidas */}
          <div className="flex flex-wrap gap-2">
            <a
              href={phoneToWhatsAppLink(lead.telefone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-good text-white text-[12px] font-extrabold hover:bg-good/85"
            >
              <Phone size={12} strokeWidth={2.5} />
              WhatsApp
            </a>
            <a
              href={tiktokProfileUrl(lead.tiktok_handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-spark-ink text-white text-[12px] font-extrabold hover:bg-spark-brand-deep"
            >
              <ExternalLink size={12} strokeWidth={2.5} />
              TikTok
            </a>
          </div>

          {/* Status + Agente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
                Status
              </label>
              <select
                value={lead.status}
                onChange={(e) => void changeStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[12.5px] font-extrabold cursor-pointer"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].emoji} {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
                Atribuído a
              </label>
              <select
                value={lead.assigned_to ?? ""}
                onChange={(e) => void changeAssigned(e.target.value || null)}
                className="w-full px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[12.5px] font-extrabold cursor-pointer"
              >
                <option value="">— ninguém —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {assignedAgent && (
            <div className="text-[11.5px] text-spark-ink-70 inline-flex items-center gap-1.5">
              <UserCheck size={11} strokeWidth={2.5} className="text-spark-brand-deep" />
              {assignedAgent.name ?? assignedAgent.email}
            </div>
          )}

          {/* Dados do lead */}
          <div className="rounded-spark-lg bg-spark-bg border border-spark-hairline divide-y divide-spark-hairline">
            <InfoRow label="Telefone" value={lead.telefone} />
            <InfoRow label="@TikTok" value={`@${lead.tiktok_handle.replace(/^@/, "")}`} />
            <InfoRow
              label="Já vende?"
              value={
                lead.already_selling
                  ? `Sim · ${REVENUE_LABELS[lead.revenue_range ?? ""] ?? "—"}`
                  : "Não"
              }
            />
            {lead.utm_source && (
              <InfoRow
                label="Origem"
                value={`${lead.utm_source}${lead.utm_medium ? ` / ${lead.utm_medium}` : ""}${lead.utm_campaign ? ` / ${lead.utm_campaign}` : ""}`}
              />
            )}
          </div>

          {/* Nota interna */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
              Nota interna
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anota algo sobre a conversa..."
              rows={3}
              className="w-full px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[12.5px] font-semibold outline-none focus:border-spark-brand resize-y"
            />
            <button
              type="button"
              onClick={() => void saveNote()}
              disabled={savingNote || note === (lead.admin_note ?? "")}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-ink text-white text-[11.5px] font-extrabold disabled:opacity-50"
            >
              {savingNote ? <Loader2 size={11} className="animate-spin" /> : null}
              Salvar nota
            </button>
          </div>

          {/* Adicionar evento (nota ou tentativa de contato) */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
              Registrar interação
            </label>
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setEventKind("contact_attempt")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10.5px] font-extrabold",
                  eventKind === "contact_attempt"
                    ? "bg-spark-ink text-white"
                    : "bg-spark-bg border border-spark-hairline text-spark-ink-70",
                )}
              >
                📞 Tentativa de contato
              </button>
              <button
                type="button"
                onClick={() => setEventKind("note")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10.5px] font-extrabold",
                  eventKind === "note"
                    ? "bg-spark-ink text-white"
                    : "bg-spark-bg border border-spark-hairline text-spark-ink-70",
                )}
              >
                📝 Anotação
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void addEvent();
                  }
                }}
                placeholder={
                  eventKind === "contact_attempt"
                    ? "Ex: Liguei, não atendeu"
                    : "O que você quer anotar?"
                }
                className="flex-1 px-3 py-2 rounded-full bg-spark-bg border border-spark-hairline text-[12.5px] font-semibold outline-none focus:border-spark-brand"
              />
              <button
                type="button"
                onClick={() => void addEvent()}
                disabled={savingEvent || !newEvent.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-grad text-white text-[11.5px] font-extrabold disabled:opacity-50"
              >
                {savingEvent ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <MessageSquare size={11} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Historico */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-2">
              Histórico
            </div>
            {loadingEvents ? (
              <div className="text-[11.5px] text-spark-ink-50">carregando...</div>
            ) : events.length === 0 ? (
              <div className="text-[11.5px] text-spark-ink-50 italic">
                sem eventos ainda
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer com delete (so admins) */}
        <div className="border-t border-spark-hairline px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={() => void deleteLead()}
            className="text-[11.5px] text-bad hover:text-bad/80 font-extrabold"
          >
            Apagar lead
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 flex items-center justify-between gap-3">
      <span className="text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50">
        {label}
      </span>
      <span className="text-[12.5px] font-semibold text-spark-ink truncate text-right">
        {value}
      </span>
    </div>
  );
}

function EventCard({ event }: { event: LeadEvent }) {
  const { kind, payload, created_at } = event;
  const actorName = event.actor_name ?? "Sistema";
  const dateStr = new Date(created_at).toLocaleString("pt-BR");

  let icon = "📝";
  let title = "Anotação";
  let body: string | null = null;

  if (kind === "status_change") {
    const from = (payload.from as string) ?? "?";
    const to = (payload.to as string) ?? "?";
    icon = "🔄";
    title = "Status mudou";
    body = `${STATUS_META[from as LeadStatus]?.label ?? from} → ${STATUS_META[to as LeadStatus]?.label ?? to}`;
  } else if (kind === "contact_attempt") {
    icon = "📞";
    title = "Tentativa de contato";
    body = (payload.text as string) ?? null;
  } else if (kind === "note") {
    icon = "📝";
    title = "Anotação";
    body = (payload.text as string) ?? null;
  } else if (kind === "assigned") {
    icon = "👤";
    title = "Atribuição mudou";
    body = null;
  }

  return (
    <div className="rounded-spark-lg bg-spark-bg border border-spark-hairline px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-spark-ink">
          <span>{icon}</span>
          {title}
        </div>
        <div className="text-[9.5px] text-spark-ink-50 font-mono">{dateStr}</div>
      </div>
      {body && (
        <div className="mt-1.5 text-[12px] text-spark-ink-70 leading-snug">
          {body}
        </div>
      )}
      <div className="mt-1 text-[10px] text-spark-ink-50">por {actorName}</div>
    </div>
  );
}
