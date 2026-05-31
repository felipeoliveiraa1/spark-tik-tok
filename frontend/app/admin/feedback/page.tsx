"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type FeedbackType = "bug" | "suggestion";
type FeedbackStatus = "open" | "in_review" | "resolved" | "dismissed";

type FeedbackRow = {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { name: string | null; email: string } | null;
};

const TYPE_META: Record<FeedbackType, { label: string; emoji: string; tone: "warn" | "good" }> = {
  bug: { label: "Bug", emoji: "🐛", tone: "warn" },
  suggestion: { label: "Sugestão", emoji: "💡", tone: "good" },
};

const STATUS_META: Record<
  FeedbackStatus,
  { label: string; tone: "warn" | "neutral" | "good"; emoji: string }
> = {
  open: { label: "Aberto", tone: "warn", emoji: "🟠" },
  in_review: { label: "Em análise", tone: "neutral", emoji: "🔵" },
  resolved: { label: "Resolvido", tone: "good", emoji: "🟢" },
  dismissed: { label: "Dispensado", tone: "neutral", emoji: "⚪" },
};

const STATUS_ORDER: FeedbackStatus[] = ["open", "in_review", "resolved", "dismissed"];

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminFeedbackPage() {
  const [items, setItems] = React.useState<FeedbackRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<FeedbackType | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<FeedbackStatus | "all">("open");
  const [q, setQ] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const confirm = useConfirm();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const load = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/feedback?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { feedback: FeedbackRow[] };
      setItems(data.feedback);
    } else {
      toastRef.current.error("Não consegui carregar agora");
    }
    setLoading(false);
  }, [typeFilter, statusFilter, q]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    setUpdating(id);
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(null);
    if (res.ok) {
      toast.success("Status atualizado");
      setItems((arr) => arr.map((it) => (it.id === id ? { ...it, status: newStatus } : it)));
    } else {
      toast.error("Não consegui atualizar");
    }
  };

  const remove = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Apagar esse report?",
      description: `"${title}" será removido permanentemente. Não dá pra desfazer.`,
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removido");
      setItems((arr) => arr.filter((it) => it.id !== id));
    } else {
      toast.error("Não consegui remover");
    }
  };

  // Stats por status do filtro atual (type)
  const stats = React.useMemo(() => {
    const counts: Record<FeedbackStatus, number> = {
      open: 0,
      in_review: 0,
      resolved: 0,
      dismissed: 0,
    };
    for (const it of items) {
      counts[it.status]++;
    }
    return counts;
  }, [items]);

  return (
    <div className="relative">
      {/* Hero compacto */}
      <section className="relative overflow-hidden hero-radial rounded-spark-3xl mb-8 px-6 lg:px-10 py-10 lg:py-12">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-20 w-[360px] h-[360px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[360px] h-[360px]" />
        <SparkleField count={10} seed={9090} className="opacity-50" />

        <div className="relative">
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pro painel
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={700}>
            <div className="mt-5 text-eyebrow text-spark-brand-deep">✦ feedback das alunas</div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              bugs + <span className="text-grad-brand">sugestões.</span>
            </h1>
            <p className="mt-3 text-fluid-body text-spark-ink-70 leading-snug max-w-[52ch] font-semibold">
              Tudo que chega via botão ✦ "?" das telas das alunas. Triagem rápida — abre o
              report, vê o contexto, marca como resolvido ou dispensado.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Filtros */}
      <div className="space-y-4 mb-6">
        {/* Type tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-eyebrow text-spark-ink-50 mr-2">tipo</span>
          <FilterPill
            active={typeFilter === "all"}
            onClick={() => setTypeFilter("all")}
            label="Todos"
            emoji="✨"
          />
          <FilterPill
            active={typeFilter === "bug"}
            onClick={() => setTypeFilter("bug")}
            label="Bugs"
            emoji="🐛"
          />
          <FilterPill
            active={typeFilter === "suggestion"}
            onClick={() => setTypeFilter("suggestion")}
            label="Sugestões"
            emoji="💡"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-eyebrow text-spark-ink-50 mr-2">status</span>
          <FilterPill
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label="Todos"
            emoji="✨"
          />
          {STATUS_ORDER.map((s) => (
            <FilterPill
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={STATUS_META[s].label}
              emoji={STATUS_META[s].emoji}
              count={statusFilter === "all" ? undefined : undefined}
            />
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            strokeWidth={2.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-spark-ink-50 pointer-events-none"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no título ou descrição..."
            className="w-full pl-10 pr-4 py-3 rounded-full border-2 border-spark-hairline bg-spark-surface text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors"
          />
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STATUS_ORDER.map((s) => (
          <div
            key={s}
            className="p-4 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest"
          >
            <div className="text-eyebrow text-spark-ink-50 mb-1.5 inline-flex items-center gap-1.5">
              <span>{STATUS_META[s].emoji}</span>
              {STATUS_META[s].label.toLowerCase()}
            </div>
            <div className="font-extrabold tracking-tight text-spark-ink text-[28px] leading-none">
              {stats[s]}
            </div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-20 flex items-center justify-center text-spark-ink-50">
          <Loader2 size={24} strokeWidth={2} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-grad-soft flex items-center justify-center text-[28px] mb-4">
            ✨
          </div>
          <div className="font-display lowercase text-spark-ink text-[24px]">tudo limpo.</div>
          <p className="mt-2 text-[13px] text-spark-ink-50 max-w-[36ch] mx-auto">
            Nenhum report nessa combinação de filtros. Quando chegar algo novo, aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded((cur) => (cur === item.id ? null : item.id))}
              onUpdateStatus={(s) => updateStatus(item.id, s)}
              onRemove={() => remove(item.id, item.title)}
              updating={updating === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =================================================================
// FILTER PILL
// =================================================================

function FilterPill({
  active,
  onClick,
  label,
  emoji,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-extrabold transition-all duration-200",
        active
          ? "bg-spark-ink text-white shadow-lift"
          : "glass border border-spark-hairline text-spark-ink-70 hover:text-spark-ink hover:-translate-y-0.5",
      )}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {label}
      {count !== undefined && <span className="opacity-70 font-mono">· {count}</span>}
    </button>
  );
}

// =================================================================
// FEEDBACK CARD
// =================================================================

function FeedbackCard({
  item,
  expanded,
  onToggle,
  onUpdateStatus,
  onRemove,
  updating,
}: {
  item: FeedbackRow;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (s: FeedbackStatus) => void;
  onRemove: () => void;
  updating: boolean;
}) {
  const typeMeta = TYPE_META[item.type];
  const statusMeta = STATUS_META[item.status];
  const userName = item.profiles?.name ?? item.profiles?.email?.split("@")[0] ?? "Aluna";
  const userEmail = item.profiles?.email ?? "—";

  return (
    <div
      className={cn(
        "rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden transition-all duration-300",
        expanded && "shadow-lift border-spark-brand/30",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-spark-surface-sunken/40 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[22px]",
              item.type === "bug" ? "bg-warn/10" : "bg-good/10",
            )}
          >
            <span aria-hidden>{typeMeta.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SBadge tone={typeMeta.tone}>{typeMeta.label}</SBadge>
              <SBadge tone={statusMeta.tone}>{statusMeta.label}</SBadge>
              <span className="text-[11px] text-spark-ink-50 font-mono ml-auto">
                {fmtDate(item.created_at)}
              </span>
            </div>
            <h3 className="text-[15px] font-extrabold text-spark-ink tracking-tight leading-snug">
              {item.title}
            </h3>
            <div className="mt-1.5 text-[12.5px] text-spark-ink-70 font-semibold">
              <span className="text-spark-ink">{userName}</span>
              <span className="text-spark-ink-50 mx-1.5">·</span>
              <span className="font-mono text-spark-ink-50">{userEmail}</span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-spark-hairline px-5 py-5 space-y-5 bg-spark-surface-sunken/30">
          {/* Descricao */}
          <div>
            <div className="text-eyebrow text-spark-brand mb-2">✦ descrição</div>
            <p className="text-[13.5px] text-spark-ink leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>

          {/* Contexto técnico */}
          {(item.page_url || item.user_agent) && (
            <div className="rounded-spark-xl bg-spark-surface border border-spark-hairline px-4 py-3 space-y-2">
              <div className="text-eyebrow text-spark-ink-50">✦ contexto técnico</div>
              {item.page_url && (
                <div className="flex items-start gap-2 text-[11.5px] font-mono">
                  <span className="text-spark-ink-50 shrink-0">URL:</span>
                  <a
                    href={item.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-spark-brand-deep hover:underline break-all inline-flex items-center gap-1"
                  >
                    {item.page_url}
                    <ExternalLink size={10} strokeWidth={2.5} />
                  </a>
                </div>
              )}
              {item.user_agent && (
                <div className="flex items-start gap-2 text-[11.5px] font-mono text-spark-ink-50">
                  <span className="shrink-0">UA:</span>
                  <span className="break-all">{item.user_agent}</span>
                </div>
              )}
            </div>
          )}

          {/* Ações de status */}
          <div>
            <div className="text-eyebrow text-spark-brand mb-2.5">✦ status</div>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updating || item.status === s}
                  onClick={() => onUpdateStatus(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11.5px] font-extrabold transition-all duration-200",
                    item.status === s
                      ? "bg-spark-ink text-white"
                      : "glass border border-spark-hairline text-spark-ink-70 hover:text-spark-ink hover:-translate-y-0.5",
                    updating && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <span aria-hidden>{STATUS_META[s].emoji}</span>
                  {STATUS_META[s].label}
                  {item.status === s && <CheckCircle2 size={11} strokeWidth={2.5} />}
                </button>
              ))}

              <button
                type="button"
                onClick={onRemove}
                disabled={updating}
                className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11.5px] font-extrabold text-bad hover:bg-bad/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={11} strokeWidth={2.5} />
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

void Bug;
void Lightbulb;
void XCircle;
