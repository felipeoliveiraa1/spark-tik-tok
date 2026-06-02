import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Users,
  CheckCircle2,
  Gift,
  PauseCircle,
  Package,
  PenLine,
  AlertCircle,
  Eye,
  CheckCheck,
  CircleSlash,
  Bug,
  Lightbulb,
  Sparkles,
  PhoneCall,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Radio,
  Newspaper,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type FeedbackPreview = {
  id: string;
  type: "bug" | "suggestion";
  title: string;
  status: "open" | "in_review" | "resolved" | "dismissed";
  created_at: string;
  user_name: string | null;
  user_email: string | null;
};

type LeadPreview = {
  id: string;
  nome: string;
  tiktok_handle: string;
  already_selling: boolean;
  status: "new" | "contacted" | "converted" | "dismissed";
  created_at: string;
};

async function getStats() {
  const supabase = getServiceClient();

  const [
    news,
    videos,
    lives,
    modules,
    alunas,
    alunasAtivas,
    alunasTrial,
    products,
    scripts,
    feedbackOpen,
    feedbackInReview,
    feedbackResolved,
    feedbackDismissed,
    feedbackBugsOpen,
    feedbackSuggestionsOpen,
    feedbackRecent,
    leadsNew,
    leadsContacted,
    leadsConverted,
    leadsTotal,
    leadsRecent,
  ] = await Promise.all([
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("education_videos").select("id", { count: "exact", head: true }),
    supabase.from("live_events").select("id", { count: "exact", head: true }),
    supabase.from("education_modules").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("role.is.null,role.neq.admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan_active", true)
      .or("role.is.null,role.neq.admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan_status", "trial")
      .or("role.is.null,role.neq.admin"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("generated_scripts").select("id", { count: "exact", head: true }),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_review"),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "dismissed"),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("type", "bug")
      .eq("status", "open"),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("type", "suggestion")
      .eq("status", "open"),
    supabase
      .from("user_feedback")
      .select(
        "id, type, title, status, created_at, profiles!user_feedback_user_id_fkey(name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "contacted"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "converted"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id, nome, tiktok_handle, already_selling, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type RawRecent = {
    id: string;
    type: "bug" | "suggestion";
    title: string;
    status: "open" | "in_review" | "resolved" | "dismissed";
    created_at: string;
    profiles:
      | { name: string | null; email: string }
      | { name: string | null; email: string }[]
      | null;
  };

  const recent: FeedbackPreview[] = ((feedbackRecent.data as RawRecent[] | null) ?? []).map(
    (r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id,
        type: r.type,
        title: r.title,
        status: r.status,
        created_at: r.created_at,
        user_name: p?.name ?? null,
        user_email: p?.email ?? null,
      };
    },
  );

  const leadsRecentRows: LeadPreview[] = (leadsRecent.data as LeadPreview[] | null) ?? [];

  return {
    news: news.count ?? 0,
    videos: videos.count ?? 0,
    lives: lives.count ?? 0,
    modules: modules.count ?? 0,
    alunas: alunas.count ?? 0,
    alunasAtivas: alunasAtivas.count ?? 0,
    alunasTrial: alunasTrial.count ?? 0,
    alunasInativas: (alunas.count ?? 0) - (alunasAtivas.count ?? 0),
    products: products.count ?? 0,
    scripts: scripts.count ?? 0,
    feedbackOpen: feedbackOpen.count ?? 0,
    feedbackInReview: feedbackInReview.count ?? 0,
    feedbackResolved: feedbackResolved.count ?? 0,
    feedbackDismissed: feedbackDismissed.count ?? 0,
    feedbackBugsOpen: feedbackBugsOpen.count ?? 0,
    feedbackSuggestionsOpen: feedbackSuggestionsOpen.count ?? 0,
    feedbackRecent: recent,
    leadsNew: leadsNew.count ?? 0,
    leadsContacted: leadsContacted.count ?? 0,
    leadsConverted: leadsConverted.count ?? 0,
    leadsTotal: leadsTotal.count ?? 0,
    leadsRecent: leadsRecentRows,
  };
}

function fmtRelativeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

const STATUS_DOT: Record<FeedbackPreview["status"], { color: string; label: string }> = {
  open: { color: "bg-warn", label: "Aberto" },
  in_review: { color: "bg-spark-brand-deep", label: "Em análise" },
  resolved: { color: "bg-good", label: "Resolvido" },
  dismissed: { color: "bg-spark-ink-35", label: "Dispensado" },
};

const LEAD_STATUS: Record<LeadPreview["status"], { color: string; label: string }> = {
  new: { color: "bg-warn", label: "Novo" },
  contacted: { color: "bg-spark-brand-deep", label: "Contactado" },
  converted: { color: "bg-good", label: "Convertido" },
  dismissed: { color: "bg-spark-ink-35", label: "Dispensado" },
};

export default async function AdminHome() {
  const s = await getStats();
  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="max-w-[1280px] mx-auto space-y-10">
      {/* Page header */}
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-spark-ink-35">
          {dateStr}
        </span>
        <h1 className="font-display lowercase tracking-tight text-spark-ink leading-[0.95] text-[36px] lg:text-[48px]">
          dashboard
        </h1>
        <p className="text-[14px] text-spark-ink-50 max-w-[60ch] font-semibold">
          Visão geral do Método TTS em tempo real.
        </p>
      </header>

      {/* KPIs principais — Alunas */}
      <Section title="Alunas" subtitle="quem está com a gente">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi
            label="Total cadastradas"
            value={s.alunas}
            icon={Users}
            tone="brand"
          />
          <Kpi
            label="Plano ativo"
            value={s.alunasAtivas}
            icon={CheckCircle2}
            tone="good"
            badge={s.alunas > 0 ? `${Math.round((s.alunasAtivas / s.alunas) * 100)}%` : undefined}
          />
          <Kpi label="Em trial" value={s.alunasTrial} icon={Gift} tone="warn" />
          <Kpi label="Inativas" value={s.alunasInativas} icon={PauseCircle} />
        </div>
      </Section>

      {/* KPIs Produção + Catálogo lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Section title="Produção" subtitle="o que as alunas geraram">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Produtos salvos" value={s.products} icon={Package} />
            <Kpi label="Roteiros gerados" value={s.scripts} icon={PenLine} />
          </div>
        </Section>

        <Section title="Catálogo" subtitle="conteúdo do método">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CatalogTile label="Módulos" value={s.modules} icon={BookOpen} href="/admin/educacao" />
            <CatalogTile label="Aulas" value={s.videos} icon={GraduationCap} href="/admin/educacao" />
            <CatalogTile label="Lives" value={s.lives} icon={Radio} href="/admin/ao-vivo" />
            <CatalogTile label="Notícias" value={s.news} icon={Newspaper} href="/admin/news" />
          </div>
        </Section>
      </div>

      {/* Leads */}
      <Section title="Leads" subtitle="quem chegou pelo formulário público">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi
            label="Novos"
            value={s.leadsNew}
            icon={AlertCircle}
            tone={s.leadsNew > 0 ? "warn" : undefined}
          />
          <Kpi label="Contactados" value={s.leadsContacted} icon={PhoneCall} />
          <Kpi label="Convertidos" value={s.leadsConverted} icon={TrendingUp} tone="good" />
          <Kpi label="Total" value={s.leadsTotal} icon={Sparkles} />
        </div>

        <ListPanel
          title="Últimos cadastros"
          href="/admin/leads"
          empty={{
            label: "Nenhum lead ainda.",
            sub: "Quando o link do formulário pegar tráfego, os cadastros aparecem aqui.",
          }}
          items={s.leadsRecent.map((r) => ({
            key: r.id,
            href: "/admin/leads",
            avatar: r.nome.charAt(0).toUpperCase(),
            title: r.nome,
            subtitle: (
              <span className="font-mono">
                @{r.tiktok_handle}
                <span className="mx-1.5 opacity-50">·</span>
                {r.already_selling ? "vende" : "ainda não"}
              </span>
            ),
            badgeColor: LEAD_STATUS[r.status].color,
            badgeLabel: LEAD_STATUS[r.status].label,
            timeLabel: fmtRelativeShort(r.created_at),
          }))}
        />
      </Section>

      {/* Feedback */}
      <Section title="Feedback" subtitle="o que as alunas estão reportando">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Kpi
            label="Abertos"
            value={s.feedbackOpen}
            icon={AlertCircle}
            tone={s.feedbackOpen > 0 ? "warn" : undefined}
          />
          <Kpi label="Em análise" value={s.feedbackInReview} icon={Eye} />
          <Kpi label="Resolvidos" value={s.feedbackResolved} icon={CheckCheck} tone="good" />
          <Kpi label="Dispensados" value={s.feedbackDismissed} icon={CircleSlash} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <Kpi label="Bugs abertos" value={s.feedbackBugsOpen} icon={Bug} />
          <Kpi label="Sugestões abertas" value={s.feedbackSuggestionsOpen} icon={Lightbulb} />
        </div>

        <ListPanel
          title="Últimos reports"
          href="/admin/feedback"
          empty={{
            label: "Nenhum report ainda.",
            sub: "Quando alguém reportar bug ou sugestão, vai aparecer aqui.",
          }}
          items={s.feedbackRecent.map((r) => ({
            key: r.id,
            href: "/admin/feedback",
            icon: r.type === "bug" ? Bug : Lightbulb,
            title: r.title,
            subtitle: (
              <>
                {r.user_name ?? r.user_email?.split("@")[0] ?? "Aluna"}
                {r.user_email && (
                  <>
                    <span className="mx-1.5 opacity-50">·</span>
                    <span className="font-mono">{r.user_email}</span>
                  </>
                )}
              </>
            ),
            badgeColor: STATUS_DOT[r.status].color,
            badgeLabel: STATUS_DOT[r.status].label,
            timeLabel: fmtRelativeShort(r.created_at),
          }))}
        />
      </Section>

      {/* Atalhos */}
      <Section title="Atalhos" subtitle="acesso rápido às ferramentas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ShortcutCard
            href="/admin/financeiro"
            icon={BarChart3}
            title="Financeiro"
            desc="MRR, ARR, churn, ticket médio e projeção 30 dias."
          />
          <ShortcutCard
            href="/admin/grant"
            icon={Gift}
            title="Liberar acesso"
            desc="Criar contas em lote com N dias gratuitos. Email automático."
          />
          <ShortcutCard
            href="/admin/educacao"
            icon={GraduationCap}
            title="Gerenciar trilha"
            desc="Módulos e aulas (vídeo, conteúdo rich, checklist)."
          />
          <ShortcutCard
            href="/admin/news"
            icon={Newspaper}
            title="Gerenciar news"
            desc="Criar, editar e despublicar artigos do jornal."
          />
          <ShortcutCard
            href="/admin/ao-vivo"
            icon={Radio}
            title="Agendar lives"
            desc="Encontros ao vivo via YouTube. Replay automático."
          />
          <ShortcutCard
            href="/admin/feedback"
            icon={Bug}
            title="Triagem de feedback"
            desc="Bugs e sugestões reportadas pelas alunas."
          />
        </div>
      </Section>
    </div>
  );
}

// =================================================================
// Building blocks
// =================================================================

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[18px] lg:text-[20px] font-extrabold tracking-tight text-spark-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12px] text-spark-ink-50 mt-0.5 font-semibold">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

type Tone = "brand" | "good" | "warn" | "bad";

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone?: Tone;
  badge?: string;
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
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 ease-premium">
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-spark-lg flex items-center justify-center ${iconBg}`}
        >
          <Icon size={16} strokeWidth={2.2} />
        </div>
        {badge && (
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-spark-ink-50 px-2 py-1 rounded-full bg-spark-surface-sunken">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 font-mono tracking-tight leading-none font-extrabold text-spark-ink text-[28px]">
        {value}
      </div>
      <div className="text-[11px] text-spark-ink-50 mt-2 font-extrabold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function CatalogTile({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  href: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 hover:border-spark-brand/30 hover:bg-spark-brand-soft/20 transition-all duration-300 ease-premium hover:-translate-y-0.5 shadow-rest hover:shadow-lift"
    >
      <Icon
        size={16}
        strokeWidth={2.2}
        className="text-spark-ink-50 group-hover:text-spark-brand-deep transition-colors"
      />
      <div className="mt-3 font-mono font-extrabold text-[22px] leading-none text-spark-ink">
        {value}
      </div>
      <div className="text-[10.5px] text-spark-ink-50 mt-1.5 font-extrabold uppercase tracking-wider">
        {label}
      </div>
    </Link>
  );
}

type ListItemData = {
  key: string;
  href: string;
  avatar?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  subtitle: React.ReactNode;
  badgeColor: string;
  badgeLabel: string;
  timeLabel: string;
};

function ListPanel({
  title,
  href,
  items,
  empty,
}: {
  title: string;
  href: string;
  items: ListItemData[];
  empty: { label: string; sub: string };
}) {
  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
      <div className="px-5 py-3.5 border-b border-spark-hairline flex items-center justify-between">
        <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-spark-ink">
          {title}
        </h3>
        <Link
          href={href}
          prefetch
          className="text-[11px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors uppercase tracking-wider inline-flex items-center gap-1"
        >
          Ver todos
          <ArrowRight size={11} strokeWidth={2.5} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="text-[13px] font-extrabold text-spark-ink mb-1">{empty.label}</div>
          <div className="text-[12px] text-spark-ink-50 font-semibold max-w-[40ch] mx-auto">
            {empty.sub}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-spark-hairline">
          {items.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.key}>
                <Link
                  href={r.href}
                  prefetch
                  className="group flex items-center gap-3 px-5 py-3.5 hover:bg-spark-surface-sunken/40 transition-colors"
                >
                  {r.avatar ? (
                    <span className="shrink-0 w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px]">
                      {r.avatar}
                    </span>
                  ) : Icon ? (
                    <span className="shrink-0 w-9 h-9 rounded-full bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center">
                      <Icon size={15} strokeWidth={2.2} />
                    </span>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate group-hover:text-spark-brand-deep transition-colors">
                      {r.title}
                    </div>
                    <div className="text-[11.5px] text-spark-ink-50 truncate mt-0.5">
                      {r.subtitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-spark-ink-70">
                      <span className={`w-1.5 h-1.5 rounded-full ${r.badgeColor}`} />
                      {r.badgeLabel}
                    </span>
                    <span className="text-[10.5px] text-spark-ink-50 font-mono w-9 text-right">
                      {r.timeLabel}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 hover:border-spark-brand/40 hover:bg-spark-brand-soft/20 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift shadow-rest block"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-spark-lg bg-spark-surface-sunken text-spark-ink-70 group-hover:bg-brand-grad group-hover:text-white flex items-center justify-center transition-all duration-300">
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <ArrowRight
          size={14}
          strokeWidth={2.4}
          className="text-spark-ink-35 group-hover:text-spark-brand-deep group-hover:translate-x-0.5 transition-all duration-300"
        />
      </div>
      <div className="mt-4 text-[14.5px] font-extrabold tracking-tight text-spark-ink">
        {title}
      </div>
      <p className="text-[12px] text-spark-ink-50 mt-1 leading-snug">{desc}</p>
    </Link>
  );
}
