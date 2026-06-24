"use client";

import * as React from "react";
import {
  Plus,
  Loader2,
  ExternalLink,
  Copy,
  RotateCcw,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Link = {
  id: string;
  label: string;
  url: string;
  click_count: number;
  cap_count: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Stats = {
  clicks_total: number;
  clicks_last_24h: number;
  clicks_last_7d: number;
  top_utm_sources_7d: Array<{ utm_source: string; total: number }>;
};

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface px-4 py-3">
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-spark-ink-50">
        {label}
      </div>
      <div className="mt-1 font-display text-[28px] leading-none text-spark-ink">{value}</div>
      {hint && <div className="mt-1 text-[11.5px] text-spark-ink-50">{hint}</div>}
    </div>
  );
}

function LinkFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Link | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [cap, setCap] = React.useState(initial?.cap_count?.toString() ?? "");
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();
  const isEdit = !!initial;

  const handleSave = async () => {
    if (!label.trim() || !url.trim()) {
      toast.error("Preenche label e url");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        label: label.trim(),
        url: url.trim(),
        cap_count: cap.trim() ? Number(cap) : null,
      };
      const res = isEdit
        ? await fetch(`/api/admin/group-redirect/${initial!.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/group-redirect`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        toast.success(isEdit ? "Atualizado" : "Criado");
        onSaved();
        onClose();
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Não consegui salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-spark-ink/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-spark-surface rounded-spark-xl border border-spark-hairline shadow-lift max-w-[500px] w-full">
        <div className="px-5 py-4 border-b border-spark-hairline">
          <div className="text-eyebrow text-spark-ink-50">{isEdit ? "Editar" : "Novo"} grupo</div>
          <div className="font-extrabold text-spark-ink mt-0.5">
            {isEdit ? initial!.label : "Adicionar link de grupo"}
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wide text-spark-ink-50 block mb-1">
              Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Comunidade 3"
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
              maxLength={80}
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wide text-spark-ink-50 block mb-1">
              URL do convite WhatsApp
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40 font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wide text-spark-ink-50 block mb-1">
              Cap (opcional)
            </label>
            <input
              type="number"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="ex: 1000 (vazio = sem limite)"
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
            />
            <p className="text-[11px] text-spark-ink-50 mt-1">
              Quando atingir esse número de clicks, link sai do round-robin. Útil pra parar perto de 1000 (limite WhatsApp).
            </p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-spark-hairline flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-spark-lg text-[13px] font-extrabold text-spark-ink-70 hover:bg-spark-surface-sunken"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const READY_PRESETS: Array<{ rede: string; medium: string; campaign: string; emoji: string }> = [
  { rede: "instagram", medium: "bio", campaign: "lancamento", emoji: "📷" },
  { rede: "instagram", medium: "stories", campaign: "lancamento", emoji: "📸" },
  { rede: "instagram", medium: "post", campaign: "lancamento", emoji: "🖼️" },
  { rede: "tiktok", medium: "bio", campaign: "lancamento", emoji: "🎵" },
  { rede: "tiktok", medium: "video", campaign: "lancamento", emoji: "🎬" },
];

function ReadyLinks() {
  const [origin, setOrigin] = React.useState("https://www.metodotts.app");
  const toast = useToast();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const copy = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-4">
      <div className="text-eyebrow text-spark-ink-50">Links prontos pra copiar</div>
      <p className="text-[12px] text-spark-ink-50 mt-1 mb-3 max-w-[60ch]">
        Cada link já vem com UTM. No dashboard "Top utm_source 7d" você vê de qual rede social
        veio mais gente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {READY_PRESETS.map((p) => {
          const url = `${origin}/grupo?utm_source=${p.rede}&utm_medium=${p.medium}&utm_campaign=${p.campaign}`;
          return (
            <div
              key={`${p.rede}-${p.medium}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-spark-lg bg-spark-surface-sunken"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold text-spark-ink capitalize">
                  {p.emoji} {p.rede} · {p.medium}
                </div>
                <div className="text-[10.5px] font-mono text-spark-ink-50 truncate">{url}</div>
              </div>
              <button
                onClick={() => copy(url)}
                className="shrink-0 px-2 py-1.5 rounded-spark-lg text-[11px] font-extrabold text-spark-brand-deep hover:bg-spark-brand-soft/40 inline-flex items-center gap-1"
              >
                <Copy size={11} /> Copiar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminGrupoPage() {
  const [links, setLinks] = React.useState<Link[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<Link | null>(null);
  const [creating, setCreating] = React.useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/group-redirect", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as { links: Link[]; stats: Stats };
        setLinks(j.links);
        setStats(j.stats);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const handleToggle = async (link: Link) => {
    const res = await fetch(`/api/admin/group-redirect/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: !link.is_active }),
    });
    if (res.ok) {
      toast.success(link.is_active ? "Desativado" : "Ativado");
      void refresh();
    } else {
      toast.error("Não consegui atualizar");
    }
  };

  const handleResetCount = async (link: Link) => {
    const ok = await confirm({
      title: `Zerar contagem de "${link.label}"?`,
      description: `Volta o click_count pra 0. Útil quando você renova o link do grupo (depois de encher). NÃO apaga o histórico de clicks.`,
      confirmLabel: "Zerar",
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/group-redirect/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reset_count: true }),
    });
    if (res.ok) {
      toast.success("Contagem zerada");
      void refresh();
    } else {
      toast.error("Não consegui zerar");
    }
  };

  const handleDelete = async (link: Link) => {
    const ok = await confirm({
      title: `Desativar "${link.label}"?`,
      description: "Soft delete: link sai do pool de redirect mas o histórico fica. Pra reativar, edita is_active.",
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/group-redirect/${link.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Desativado");
      void refresh();
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/grupo`;
    void navigator.clipboard.writeText(shareUrl);
    toast.success(`Copiado: ${shareUrl}`);
  };

  const totalActive = links.filter((l) => l.is_active).length;
  const totalCapped = links.filter(
    (l) => l.cap_count !== null && l.click_count >= l.cap_count,
  ).length;

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-eyebrow text-spark-brand-deep">Admin</div>
          <h1 className="font-display text-[34px] leading-none text-spark-ink mt-1">
            Redirecionador de grupo
          </h1>
          <p className="text-spark-ink-70 mt-2 max-w-[60ch]">
            <code className="px-1.5 py-0.5 bg-spark-surface-sunken rounded text-[12.5px]">/grupo</code> faz
            round-robin entre os grupos abaixo. Adicione um cap (ex: 1000) pra cada um parar perto do limite do WhatsApp.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyShareLink}
            className="px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface text-[12.5px] font-extrabold inline-flex items-center gap-2 hover:bg-spark-surface-sunken"
          >
            <Copy size={13} /> Copiar /grupo
          </button>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[12.5px] font-extrabold inline-flex items-center gap-2 shadow-lift-brand hover:-translate-y-0.5 transition-all"
          >
            <Plus size={13} /> Novo grupo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats?.clicks_total ?? 0} />
        <StatCard label="Últimas 24h" value={stats?.clicks_last_24h ?? 0} />
        <StatCard label="Últimos 7d" value={stats?.clicks_last_7d ?? 0} />
        <StatCard label="Ativos" value={totalActive} hint={`de ${links.length}`} />
        <StatCard label="Cap atingido" value={totalCapped} hint="sairam do pool" />
      </div>

      {/* Tabela links */}
      <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-spark-ink-50">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="py-16 text-center text-spark-ink-50 text-[13px]">
            Nenhum grupo cadastrado. Clica em "Novo grupo".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-spark-surface-sunken text-[11px] uppercase tracking-[0.12em] text-spark-ink-50">
                <tr>
                  <th className="px-4 py-3 text-left font-extrabold">Grupo</th>
                  <th className="px-3 py-3 text-left font-extrabold">URL</th>
                  <th className="px-3 py-3 text-left font-extrabold">Clicks</th>
                  <th className="px-3 py-3 text-left font-extrabold">Cap</th>
                  <th className="px-3 py-3 text-left font-extrabold">Status</th>
                  <th className="px-3 py-3 text-right font-extrabold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const capReached = link.cap_count !== null && link.click_count >= link.cap_count;
                  const inPool = link.is_active && !capReached;
                  return (
                    <tr
                      key={link.id}
                      className="border-t border-spark-hairline hover:bg-spark-surface-sunken/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-spark-ink">{link.label}</div>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11.5px] text-spark-brand-deep hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          {link.url.replace("https://chat.whatsapp.com/", "…/")}
                          <ExternalLink size={11} />
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-extrabold text-spark-ink">{link.click_count}</div>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-spark-ink-70">
                        {link.cap_count ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border",
                            inPool
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : capReached
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-spark-ink-10 text-spark-ink-70 border-transparent",
                          )}
                        >
                          {inPool ? "Ativo" : capReached ? "Cap atingido" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleToggle(link)}
                            title={link.is_active ? "Desativar" : "Ativar"}
                            className="w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
                          >
                            {link.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                          </button>
                          <button
                            onClick={() => handleResetCount(link)}
                            title="Zerar contagem"
                            className="w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => setEditing(link)}
                            title="Editar"
                            className="w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(link)}
                            title="Desativar"
                            className="w-8 h-8 rounded-full hover:bg-bad/10 flex items-center justify-center text-bad"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top UTM sources */}
      {stats && stats.top_utm_sources_7d.length > 0 && (
        <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-4">
          <div className="text-eyebrow text-spark-ink-50">Top utm_source (últimos 7d)</div>
          <div className="mt-3 space-y-2">
            {stats.top_utm_sources_7d.map((row) => (
              <div
                key={row.utm_source}
                className="flex items-center justify-between px-3 py-2 rounded-spark-lg bg-spark-surface-sunken"
              >
                <span className="font-mono text-[12.5px] text-spark-ink">{row.utm_source}</span>
                <span className="font-extrabold text-spark-ink-70">{row.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReadyLinks />

      <div className="text-[12px] text-spark-ink-50 max-w-[60ch]">
        <p>
          <strong>Como usar:</strong> divulga{" "}
          <code className="px-1 py-0.5 bg-spark-surface-sunken rounded">www.metodotts.app/grupo</code> nos seus posts.
          Adiciona <code className="px-1 py-0.5 bg-spark-surface-sunken rounded">?utm_source=instagram</code> pra trackear de onde vem.
          O sistema escolhe o grupo com menos clicks atomicamente e redireciona — distribuição perfeita.
        </p>
      </div>

      {(editing || creating) && (
        <LinkFormModal
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
