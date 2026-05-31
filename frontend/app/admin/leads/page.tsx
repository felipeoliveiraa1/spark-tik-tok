"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  AtSign,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Loader2,
  Search,
  Copy,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type LeadStatus = "new" | "contacted" | "converted" | "dismissed";
type RevenueRange = "ate_5k" | "de_5k_a_20k" | "de_20k_a_50k" | "acima_50k";

type LeadRow = {
  id: string;
  nome: string;
  telefone: string;
  tiktok_handle: string;
  already_selling: boolean;
  revenue_range: RevenueRange | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  status: LeadStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<
  LeadStatus,
  { label: string; tone: "warn" | "neutral" | "good"; emoji: string }
> = {
  new: { label: "Novo", tone: "warn", emoji: "🟠" },
  contacted: { label: "Contactado", tone: "neutral", emoji: "🔵" },
  converted: { label: "Convertido", tone: "good", emoji: "🟢" },
  dismissed: { label: "Dispensado", tone: "neutral", emoji: "⚪" },
};

const STATUS_ORDER: LeadStatus[] = ["new", "contacted", "converted", "dismissed"];

const REVENUE_LABEL: Record<RevenueRange, string> = {
  ate_5k: "Até R$ 5 mil",
  de_5k_a_20k: "R$ 5 a 20 mil",
  de_20k_a_50k: "R$ 20 a 50 mil",
  acima_50k: "Acima de R$ 50 mil",
};

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

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function waLink(phone: string, nome: string): string {
  const digits = digitsOnly(phone);
  // Garante prefixo BR
  const fullNum = digits.length === 11 || digits.length === 10 ? `55${digits}` : digits;
  const msg = encodeURIComponent(
    `Oi ${nome.split(" ")[0]}! Aqui é da TTS — vi seu cadastro pelo formulário 💕`,
  );
  return `https://wa.me/${fullNum}?text=${msg}`;
}

export default function AdminLeadsPage() {
  const [items, setItems] = React.useState<LeadRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<LeadStatus | "all">("new");
  const [sellingFilter, setSellingFilter] = React.useState<"all" | "yes" | "no">("all");
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
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sellingFilter !== "all") params.set("selling", sellingFilter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/leads?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { leads: LeadRow[] };
      setItems(data.leads);
    } else {
      toastRef.current.error("Não consegui carregar agora");
    }
    setLoading(false);
  }, [statusFilter, sellingFilter, q]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    setUpdating(id);
    const res = await fetch(`/api/admin/leads/${id}`, {
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

  const remove = async (id: string, nome: string) => {
    const ok = await confirm({
      title: "Apagar esse lead?",
      description: `"${nome}" será removido permanentemente. Não dá pra desfazer.`,
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removido");
      setItems((arr) => arr.filter((it) => it.id !== id));
    } else {
      toast.error("Não consegui remover");
    }
  };

  const stats = React.useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      converted: 0,
      dismissed: 0,
    };
    let selling = 0;
    let notSelling = 0;
    for (const it of items) {
      counts[it.status]++;
      if (it.already_selling) selling++;
      else notSelling++;
    }
    return { counts, selling, notSelling };
  }, [items]);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial rounded-spark-3xl mb-8 px-6 lg:px-10 py-10 lg:py-12">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-20 w-[360px] h-[360px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[360px] h-[360px]" />
        <SparkleField count={10} seed={1717} className="opacity-50" />

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
            <div className="mt-5 text-eyebrow text-spark-brand-deep">✦ leads captados</div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              quem chegou <span className="text-grad-brand">pelo formulário.</span>
            </h1>
            <p className="mt-3 text-fluid-body text-spark-ink-70 leading-snug max-w-[52ch] font-semibold">
              Tudo que vem pelo /formulario (link na bio do TikTok). Triagem rápida — abre o
              lead, manda whats, marca status.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Filtros */}
      <div className="space-y-4 mb-6">
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
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-eyebrow text-spark-ink-50 mr-2">vende?</span>
          <FilterPill
            active={sellingFilter === "all"}
            onClick={() => setSellingFilter("all")}
            label="Todos"
            emoji="✨"
          />
          <FilterPill
            active={sellingFilter === "yes"}
            onClick={() => setSellingFilter("yes")}
            label="Já vende"
            emoji="✅"
          />
          <FilterPill
            active={sellingFilter === "no"}
            onClick={() => setSellingFilter("no")}
            label="Ainda não"
            emoji="🌱"
          />
        </div>

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
            placeholder="Buscar nome, telefone ou @ tiktok..."
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
              {stats.counts[s]}
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
          <div className="font-display lowercase text-spark-ink text-[24px]">vazio.</div>
          <p className="mt-2 text-[13px] text-spark-ink-50 max-w-[36ch] mx-auto">
            Nenhum lead nessa combinação de filtros. Quando chegar um novo cadastro, aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <LeadCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              onToggle={() => setExpanded((cur) => (cur === item.id ? null : item.id))}
              onUpdateStatus={(s) => updateStatus(item.id, s)}
              onRemove={() => remove(item.id, item.nome)}
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
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
    </button>
  );
}

// =================================================================
// LEAD CARD
// =================================================================

function LeadCard({
  item,
  expanded,
  onToggle,
  onUpdateStatus,
  onRemove,
  updating,
}: {
  item: LeadRow;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (s: LeadStatus) => void;
  onRemove: () => void;
  updating: boolean;
}) {
  const statusMeta = STATUS_META[item.status];
  const sellingMeta = item.already_selling
    ? { label: "Já vende", emoji: "✅", tone: "good" as const }
    : { label: "Ainda não", emoji: "🌱", tone: "neutral" as const };
  const initial = item.nome.charAt(0).toUpperCase();
  const toast = useToast();

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não consegui copiar");
    }
  };

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
          <div className="shrink-0 w-12 h-12 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[18px] shadow-lift-brand">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SBadge tone={statusMeta.tone}>{statusMeta.label}</SBadge>
              <SBadge tone={sellingMeta.tone}>
                {sellingMeta.emoji} {sellingMeta.label}
              </SBadge>
              {item.already_selling && item.revenue_range && (
                <SBadge>{REVENUE_LABEL[item.revenue_range]}</SBadge>
              )}
              <span className="text-[11px] text-spark-ink-50 font-mono ml-auto">
                {fmtDate(item.created_at)}
              </span>
            </div>
            <h3 className="text-[16px] font-extrabold text-spark-ink tracking-tight">
              {item.nome}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-spark-ink-70 font-semibold flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={11} strokeWidth={2.5} />
                <span className="font-mono">{item.telefone}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AtSign size={11} strokeWidth={2.5} />
                <span className="font-mono">{item.tiktok_handle}</span>
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-spark-hairline px-5 py-5 space-y-5 bg-spark-surface-sunken/30">
          {/* Ações rápidas */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={waLink(item.telefone, item.nome)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-good text-white text-[12px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
            >
              <Phone size={12} strokeWidth={2.5} />
              Abrir WhatsApp
              <ExternalLink size={11} strokeWidth={2.5} />
            </a>
            <a
              href={`https://www.tiktok.com/@${item.tiktok_handle}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-spark-ink text-white text-[12px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
            >
              <AtSign size={12} strokeWidth={2.5} />
              Ver perfil TikTok
              <ExternalLink size={11} strokeWidth={2.5} />
            </a>
            <button
              type="button"
              onClick={() => copy(item.telefone, "Telefone")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-ink text-[11.5px] font-extrabold transition-colors"
            >
              <Copy size={11} strokeWidth={2.5} />
              Copiar telefone
            </button>
          </div>

          {/* UTMs */}
          {(item.utm_source || item.utm_medium || item.utm_campaign || item.utm_content) && (
            <div className="rounded-spark-xl bg-spark-surface border border-spark-hairline px-4 py-3 space-y-1.5">
              <div className="text-eyebrow text-spark-ink-50">✦ origem</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] font-mono">
                {item.utm_source && (
                  <div>
                    <span className="text-spark-ink-50">source:</span>{" "}
                    <span className="text-spark-ink">{item.utm_source}</span>
                  </div>
                )}
                {item.utm_medium && (
                  <div>
                    <span className="text-spark-ink-50">medium:</span>{" "}
                    <span className="text-spark-ink">{item.utm_medium}</span>
                  </div>
                )}
                {item.utm_campaign && (
                  <div>
                    <span className="text-spark-ink-50">campaign:</span>{" "}
                    <span className="text-spark-ink">{item.utm_campaign}</span>
                  </div>
                )}
                {item.utm_content && (
                  <div>
                    <span className="text-spark-ink-50">content:</span>{" "}
                    <span className="text-spark-ink">{item.utm_content}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status quick actions */}
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
