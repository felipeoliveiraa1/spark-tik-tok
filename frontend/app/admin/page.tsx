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
  ArrowRight,
  ShoppingBag,
  LogIn,
  Compass,
  CalendarCheck,
  Flame,
  DollarSign,
  Zap,
  Activity,
  UserX,
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

// =================================================================
// FUNIL DE ATIVACAO
// =================================================================
//
// 6 stages do ciclo de vida da aluna, de cima pra baixo. Cada stage
// conta usuarias UNICAS (nao acoes). Numeros sempre decrescem — onde
// o numero cai mais, e onde elas "vazam" e a gente precisa olhar.
//
// 1. Comprou       — profile criado (Kiwify webhook + admin grant)
// 2. Acessou       — logou pelo menos 1 vez (auth.users.last_sign_in_at)
// 3. Completou tour — viu 'home' no tutorials_seen
// 4. Bateu rotina   — pelo menos 1 daily_completion na historia
// 5. Mantem rotina  — bateu rotina nos ultimos 7 dias
// 6. Faturou        — pelo menos 1 monthly_revenue cadastrado

type FunnelStage = {
  key: string;
  label: string;
  description: string;
  count: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

async function getFunnel(): Promise<{
  stages: FunnelStage[];
  totalNonAdmin: number;
}> {
  const supabase = getServiceClient();

  // 1. Total de profiles (excluindo admins)
  const { data: nonAdminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .or("role.is.null,role.neq.admin");
  const nonAdminIds = new Set((nonAdminProfiles ?? []).map((p) => p.id as string));
  const totalCadastros = nonAdminIds.size;

  // 2. Acessaram pelo menos 1x — via auth.admin.listUsers paginado
  // Funciona bem ate ~10k usuarias. Acima disso, melhor mover pra uma
  // SQL function via RPC pra agregar do lado do banco.
  let loggedInCount = 0;
  try {
    const PAGE_SIZE = 1000;
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });
      if (error || !data?.users) break;
      for (const u of data.users) {
        if (u.last_sign_in_at && nonAdminIds.has(u.id)) {
          loggedInCount++;
        }
      }
      if (data.users.length < PAGE_SIZE) break;
      page++;
      if (page > 50) break; // safety: 50k usuarias ja eh demais pra esse loop
    }
  } catch {
    loggedInCount = 0;
  }

  // 3. Completou tour da home — tutorials_seen contem 'home'
  const { data: tourData } = await supabase
    .from("profiles")
    .select("id, tutorials_seen")
    .or("role.is.null,role.neq.admin");
  const completouTour = (tourData ?? []).filter(
    (p) =>
      Array.isArray(p.tutorials_seen) &&
      (p.tutorials_seen as unknown[]).includes("home"),
  ).length;

  // 4. Bateu rotina ao menos 1x
  const { data: anyCompletion } = await supabase
    .from("daily_completions")
    .select("user_id");
  const bateuRotinaIds = new Set(
    (anyCompletion ?? [])
      .map((c) => c.user_id as string)
      .filter((id) => nonAdminIds.has(id)),
  );
  const bateuRotina = bateuRotinaIds.size;

  // 5. Mantem rotina nos ultimos 7 dias
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const dateFrom = weekAgo.toISOString().slice(0, 10);
  const { data: recentCompletions } = await supabase
    .from("daily_completions")
    .select("user_id")
    .gte("date", dateFrom);
  const mantemRotinaIds = new Set(
    (recentCompletions ?? [])
      .map((c) => c.user_id as string)
      .filter((id) => nonAdminIds.has(id)),
  );
  const mantemRotina = mantemRotinaIds.size;

  // 6. Cadastrou faturamento (qualquer mes)
  const { data: revenueRows } = await supabase
    .from("monthly_revenue")
    .select("user_id");
  const faturouIds = new Set(
    (revenueRows ?? [])
      .map((r) => r.user_id as string)
      .filter((id) => nonAdminIds.has(id)),
  );
  const faturou = faturouIds.size;

  const stages: FunnelStage[] = [
    {
      key: "comprou",
      label: "Comprou",
      description: "Conta criada via Kiwify ou grant manual",
      count: totalCadastros,
      icon: ShoppingBag,
    },
    {
      key: "acessou",
      label: "Acessou o app",
      description: "Fez login pelo menos uma vez",
      count: loggedInCount,
      icon: LogIn,
    },
    {
      key: "tour",
      label: "Completou o tour",
      description: "Terminou o tour guiado da home",
      count: completouTour,
      icon: Compass,
    },
    {
      key: "rotina_1x",
      label: "Bateu primeira rotina",
      description: "Marcou os 3 itens da rotina pelo menos 1 vez",
      count: bateuRotina,
      icon: CalendarCheck,
    },
    {
      key: "rotina_7d",
      label: "Mantém rotina (7d)",
      description: "Bateu rotina pelo menos 1 vez na última semana",
      count: mantemRotina,
      icon: Flame,
    },
    {
      key: "faturou",
      label: "Cadastrou faturamento",
      description: "Lançou faturamento em algum mês",
      count: faturou,
      icon: DollarSign,
    },
  ];

  return { stages, totalNonAdmin: totalCadastros };
}

// =================================================================
// ENGAJAMENTO — DAU, WAU, sumidas, eventos
// =================================================================

type Engagement = {
  dau: number; // ativas hoje (last_seen_at >= hoje 00:00 BRT)
  wau: number; // ativas nos ultimos 7 dias
  mau: number; // ativas nos ultimos 30 dias
  sumidas7d: number; // last_seen_at < 7 dias atras (e ja logou alguma vez)
  sumidas30d: number; // last_seen_at < 30 dias atras
  eventsToday: number;
  eventsWeek: number;
  topEvents: { event: string; count: number }[];
};

async function getEngagement(): Promise<Engagement> {
  const supabase = getServiceClient();

  const now = new Date();
  // Hoje 00:00 em BRT (offset -3) — converte pra UTC pra comparar
  const todayBRT = new Date(now);
  todayBRT.setUTCHours(3, 0, 0, 0); // 00h BRT = 03h UTC
  if (todayBRT.getTime() > now.getTime()) {
    todayBRT.setUTCDate(todayBRT.getUTCDate() - 1);
  }
  const today = todayBRT.toISOString();
  const week = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const month = new Date(now.getTime() - 30 * 86400_000).toISOString();

  const [dau, wau, mau, sumidas7d, sumidas30d, eventsToday, eventsWeek, eventsByType] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", today)
        .or("role.is.null,role.neq.admin"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", week)
        .or("role.is.null,role.neq.admin"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen_at", month)
        .or("role.is.null,role.neq.admin"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .lt("last_seen_at", week)
        .not("last_seen_at", "is", null)
        .or("role.is.null,role.neq.admin"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .lt("last_seen_at", month)
        .not("last_seen_at", "is", null)
        .or("role.is.null,role.neq.admin"),
      supabase
        .from("user_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today),
      supabase
        .from("user_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", week),
      supabase
        .from("user_events")
        .select("event")
        .gte("created_at", week)
        .limit(2000),
    ]);

  // Agrega top eventos da semana
  const eventCounts = new Map<string, number>();
  for (const row of (eventsByType.data ?? []) as { event: string }[]) {
    eventCounts.set(row.event, (eventCounts.get(row.event) ?? 0) + 1);
  }
  const topEvents = Array.from(eventCounts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    dau: dau.count ?? 0,
    wau: wau.count ?? 0,
    mau: mau.count ?? 0,
    sumidas7d: sumidas7d.count ?? 0,
    sumidas30d: sumidas30d.count ?? 0,
    eventsToday: eventsToday.count ?? 0,
    eventsWeek: eventsWeek.count ?? 0,
    topEvents,
  };
}

// Mapa pra label legivel + icone por evento conhecido. Eventos novos
// que nao estao no mapa caem num default (Zap + nome cru).
const EVENT_LABELS: Record<string, string> = {
  login: "Login",
  routine_check: "Bateu rotina",
  product_create: "Criou produto",
  product_save_from_text: "Salvou produto (cola)",
  script_generate: "Gerou roteiro",
  script_save_from_text: "Salvou roteiro (cola)",
  lesson_view: "Viu aula",
  lesson_complete: "Concluiu aula",
  live_join: "Entrou em live",
  cola_rapida_use: "Usou cola rápida",
  revenue_save: "Salvou faturamento",
  install_pwa: "Instalou PWA",
  tour_complete: "Completou tour",
  whatsapp_send: "Recebeu WhatsApp",
  feedback_submit: "Enviou feedback",
};

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
  const [s, funnel, eng] = await Promise.all([getStats(), getFunnel(), getEngagement()]);
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

      {/* Engajamento — DAU/WAU/MAU + sumidas */}
      <Section title="Engajamento" subtitle="quem está usando agora">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Kpi label="Ativas hoje" value={eng.dau} icon={Zap} tone="brand" />
          <Kpi label="Ativas 7d" value={eng.wau} icon={Flame} tone="good" />
          <Kpi label="Ativas 30d" value={eng.mau} icon={Activity} />
          <Kpi
            label="Sumidas > 7d"
            value={eng.sumidas7d}
            icon={UserX}
            tone={eng.sumidas7d > 0 ? "warn" : undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Eventos hoje" value={eng.eventsToday} icon={Activity} />
          <Kpi label="Eventos 7d" value={eng.eventsWeek} icon={Activity} />
        </div>
      </Section>

      {/* Funil de ativacao */}
      <Section
        title="Funil de ativação"
        subtitle="do cadastro ao primeiro faturamento"
      >
        <Funnel stages={funnel.stages} />
      </Section>

      {/* Eventos mais comuns na semana */}
      {eng.topEvents.length > 0 && (
        <Section title="Top ações da semana" subtitle="o que as alunas fizeram nos últimos 7 dias">
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
            <ul className="divide-y divide-spark-hairline">
              {eng.topEvents.map((e) => {
                const max = eng.topEvents[0]?.count ?? 1;
                const pct = Math.max(4, Math.round((e.count / max) * 100));
                return (
                  <li key={e.event} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-extrabold text-spark-ink tracking-tight">
                        {EVENT_LABELS[e.event] ?? e.event}
                      </span>
                      <span className="text-[12px] font-mono font-extrabold text-spark-ink-70">
                        {e.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-spark-surface-sunken overflow-hidden">
                      <div
                        className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
      )}

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

    </div>
  );
}

// =================================================================
// Funnel — desenho SVG (trapezios afunilando) + lista lateral
// =================================================================

function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.count ?? 0;

  // Dimensoes do viewBox. SVG escala fluido via className.
  const VB_W = 800;
  const STAGE_H = 78;
  const GAP = 4;
  const VB_H = stages.length * STAGE_H;
  const CENTER = VB_W / 2;
  const MAX_HALF = (VB_W - 16) / 2; // 8px de margem lateral
  // Largura minima pra trapezio nao virar ponta e o numero caber dentro
  const MIN_RATIO = 0.08;

  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest p-5 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-8 items-start">
        {/* === SVG do funil === */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-auto block"
            role="img"
            aria-label="Funil de ativacao das alunas"
          >
            <defs>
              <linearGradient id="funnel-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.20 350)" />
                <stop offset="50%" stopColor="oklch(0.58 0.22 348)" />
                <stop offset="100%" stopColor="oklch(0.46 0.22 345)" />
              </linearGradient>
              <filter id="funnel-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor="oklch(0.50 0.22 345)"
                  floodOpacity="0.18"
                />
              </filter>
            </defs>

            {stages.map((stage, i) => {
              const yTop = i * STAGE_H + GAP / 2;
              const yBottom = (i + 1) * STAGE_H - GAP / 2;

              // Razao do topo do trapezio = count do stage anterior (ou 100% no primeiro)
              const topCount = i === 0 ? max : stages[i - 1].count;
              const topRatio = max > 0 ? topCount / max : 0;
              const bottomRatio = max > 0 ? stage.count / max : 0;

              const topHalf = Math.max(MIN_RATIO, topRatio) * MAX_HALF;
              const bottomHalf = Math.max(MIN_RATIO, bottomRatio) * MAX_HALF;

              const points = [
                `${CENTER - topHalf},${yTop}`,
                `${CENTER + topHalf},${yTop}`,
                `${CENTER + bottomHalf},${yBottom}`,
                `${CENTER - bottomHalf},${yBottom}`,
              ].join(" ");

              const midY = (yTop + yBottom) / 2;
              // Opacidade ascendente — topo mais claro, base mais densa
              const opacity = 0.55 + i * 0.075;

              return (
                <g key={stage.key}>
                  <polygon
                    points={points}
                    fill="url(#funnel-grad)"
                    opacity={opacity}
                    filter="url(#funnel-shadow)"
                  />
                  {/* Numero grande no centro */}
                  <text
                    x={CENTER}
                    y={midY - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="26"
                    fontWeight="800"
                    fill="white"
                    className="font-mono"
                  >
                    {stage.count}
                  </text>
                  {/* Label do stage abaixo do numero */}
                  <text
                    x={CENTER}
                    y={midY + 18}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10.5"
                    fontWeight="800"
                    fill="rgba(255,255,255,0.92)"
                    letterSpacing="0.12em"
                  >
                    {stage.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* === Lista lateral com detalhes === */}
        <ol className="space-y-2">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const pct = max > 0 ? Math.round((stage.count / max) * 100) : 0;
            const prev = i > 0 ? stages[i - 1] : null;
            const stepConversion =
              prev && prev.count > 0 ? Math.round((stage.count / prev.count) * 100) : null;
            const isFirst = i === 0;
            const drop = stepConversion !== null && stepConversion < 60;

            return (
              <li
                key={stage.key}
                className="flex items-start gap-3 p-3 rounded-spark-lg hover:bg-spark-surface-sunken/40 transition-colors"
              >
                <div className="shrink-0 w-7 h-7 rounded-full bg-spark-surface-sunken flex items-center justify-center">
                  <span className="text-[10px] font-mono font-extrabold text-spark-ink-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon
                        size={13}
                        strokeWidth={2.2}
                        className="text-spark-ink-50 shrink-0"
                      />
                      <span className="text-[13px] font-extrabold text-spark-ink tracking-tight truncate">
                        {stage.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[14px] font-mono font-extrabold text-spark-ink">
                        {stage.count}
                      </span>
                      {!isFirst && (
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            drop
                              ? "bg-warn/10 text-warn"
                              : "bg-spark-surface-sunken text-spark-ink-50"
                          }`}
                        >
                          {stepConversion}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-spark-ink-50 font-semibold truncate">
                      {stage.description}
                    </p>
                    <span className="text-[10px] font-mono text-spark-ink-35 shrink-0">
                      {pct}%
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 pt-4 border-t border-spark-hairline text-[11px] text-spark-ink-50 font-semibold">
        Cada faixa do funil estreita conforme as alunas avançam. % ao lado do número = taxa
        de conversão entre stages.{" "}
        <span className="text-warn font-extrabold">Vermelho</span> = caiu mais que 40% nesse
        stage — ponto de atrito.
      </div>
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

