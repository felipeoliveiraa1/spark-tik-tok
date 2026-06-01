import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";

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
    profiles: { name: string | null; email: string } | { name: string | null; email: string }[] | null;
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

export default async function AdminHome() {
  const s = await getStats();
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-12 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-24 -left-32 w-[500px] h-[500px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-24 w-[460px] h-[460px]" />
        <SparkleField count={14} seed={111} className="opacity-50" />

        <div className="hidden lg:block absolute top-10 right-12 z-10">
          <Sticker text="ADMIN · MÉTODO TTS · " size={120} />
        </div>

        <div className="relative max-w-[1080px] mx-auto">
          <div className="text-eyebrow text-spark-brand">✦ painel de controle</div>
          <h1
            className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            o método <span className="text-grad-brand">por dentro.</span>
          </h1>
          <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[60ch] leading-snug font-semibold">
            Visão geral em tempo real. Mudanças entram em ar instantaneamente.
          </p>
        </div>
      </section>

      <div className="max-w-[1080px] mx-auto mt-10 space-y-10">
        {/* Alunas */}
        <SectionBlock label="✦ alunas" title="quem tá com a gente">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total cadastradas" value={s.alunas} emoji="💖" tone="brand" />
            <StatCard label="Plano ativo" value={s.alunasAtivas} emoji="✅" tone="good" />
            <StatCard label="Em trial" value={s.alunasTrial} emoji="🎁" tone="warn" />
            <StatCard label="Inativas" value={s.alunasInativas} emoji="⏸️" />
          </div>
        </SectionBlock>

        {/* Leads (formulario publico) */}
        <SectionBlock label="✦ leads" title="quem chegou pelo formulário">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="Novos"
              value={s.leadsNew}
              emoji="🟠"
              tone={s.leadsNew > 0 ? "warn" : undefined}
            />
            <StatCard label="Contactados" value={s.leadsContacted} emoji="🔵" />
            <StatCard label="Convertidos" value={s.leadsConverted} emoji="🟢" tone="good" />
            <StatCard label="Total no banco" value={s.leadsTotal} emoji="✨" />
          </div>

          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
            <div className="px-5 py-4 border-b border-spark-hairline flex items-center justify-between">
              <div className="text-eyebrow text-spark-brand">✦ últimos cadastros</div>
              <Link
                href="/admin/leads"
                className="text-[11.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors uppercase tracking-wider"
              >
                Ver todos →
              </Link>
            </div>
            {s.leadsRecent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-[28px] mb-2">✨</div>
                <div className="text-[13px] text-spark-ink-50 font-semibold">
                  Nenhum lead ainda. Quando o link do form pegar tráfego, aparecem aqui.
                </div>
                <Link
                  href="/formulario"
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-spark-brand-deep hover:text-spark-brand uppercase tracking-wider"
                >
                  abrir o formulário →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-spark-hairline">
                {s.leadsRecent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href="/admin/leads"
                      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-spark-surface-sunken/40 transition-colors"
                    >
                      <span className="shrink-0 w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px]">
                        {r.nome.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate group-hover:text-spark-brand-deep transition-colors">
                          {r.nome}
                        </div>
                        <div className="text-[11px] text-spark-ink-50 truncate mt-0.5 font-mono">
                          @{r.tiktok_handle}
                          <span className="mx-1.5 opacity-50">·</span>
                          {r.already_selling ? "✅ vende" : "🌱 ainda não"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-spark-ink-70`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === "new"
                                ? "bg-warn"
                                : r.status === "contacted"
                                  ? "bg-spark-brand-deep"
                                  : r.status === "converted"
                                    ? "bg-good"
                                    : "bg-spark-ink-35"
                            }`}
                          />
                          {r.status === "new"
                            ? "Novo"
                            : r.status === "contacted"
                              ? "Contactado"
                              : r.status === "converted"
                                ? "Convertido"
                                : "Dispensado"}
                        </span>
                        <span className="text-[10.5px] text-spark-ink-50 font-mono w-9 text-right">
                          {fmtRelativeShort(r.created_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionBlock>

        {/* Feedback */}
        <SectionBlock label="✦ feedback" title="o que as alunas estão reportando">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="Abertos"
              value={s.feedbackOpen}
              emoji="🟠"
              tone={s.feedbackOpen > 0 ? "warn" : undefined}
            />
            <StatCard label="Em análise" value={s.feedbackInReview} emoji="🔵" />
            <StatCard label="Resolvidos" value={s.feedbackResolved} emoji="🟢" tone="good" />
            <StatCard label="Dispensados" value={s.feedbackDismissed} emoji="⚪" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="Bugs abertos" value={s.feedbackBugsOpen} emoji="🐛" />
            <StatCard label="Sugestões abertas" value={s.feedbackSuggestionsOpen} emoji="💡" />
          </div>

          {/* Recentes */}
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
            <div className="px-5 py-4 border-b border-spark-hairline flex items-center justify-between">
              <div className="text-eyebrow text-spark-brand">✦ últimos reports</div>
              <Link
                href="/admin/feedback"
                className="text-[11.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors uppercase tracking-wider"
              >
                Ver todos →
              </Link>
            </div>
            {s.feedbackRecent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-[28px] mb-2">✨</div>
                <div className="text-[13px] text-spark-ink-50 font-semibold">
                  Nenhum report ainda. Quando uma aluna mandar bug ou sugestão, aparece aqui.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-spark-hairline">
                {s.feedbackRecent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href="/admin/feedback"
                      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-spark-surface-sunken/40 transition-colors"
                    >
                      <span className="text-[18px] shrink-0" aria-hidden>
                        {r.type === "bug" ? "🐛" : "💡"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate group-hover:text-spark-brand-deep transition-colors">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-spark-ink-50 truncate mt-0.5">
                          {r.user_name ?? r.user_email?.split("@")[0] ?? "Aluna"}
                          {r.user_email && (
                            <>
                              <span className="mx-1.5 opacity-50">·</span>
                              <span className="font-mono">{r.user_email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-spark-ink-70`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status].color}`}
                          />
                          {STATUS_DOT[r.status].label}
                        </span>
                        <span className="text-[10.5px] text-spark-ink-50 font-mono w-9 text-right">
                          {fmtRelativeShort(r.created_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionBlock>

        {/* Conteúdo gerado */}
        <SectionBlock label="✦ produção" title="o que as alunas geraram">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Produtos salvos" value={s.products} emoji="📦" />
            <StatCard label="Roteiros gerados" value={s.scripts} emoji="✍️" />
          </div>
        </SectionBlock>

        {/* Catálogo */}
        <SectionBlock label="✦ catálogo" title="conteúdo do método">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Módulos" value={s.modules} emoji="📚" tone="brand" />
            <StatCard label="Aulas" value={s.videos} emoji="🎓" />
            <StatCard label="Lives" value={s.lives} emoji="🔴" />
            <StatCard label="Notícias" value={s.news} emoji="📰" />
          </div>
        </SectionBlock>

        {/* Ações */}
        <SectionBlock label="✦ ações rápidas" title="o que rolar agora">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ActionCard
              href="/admin/financeiro"
              emoji="📊"
              title="Financeiro · MRR + Churn"
              desc="MRR, ARR, churn, ticket médio, evolução mensal, projeção 30 dias."
            />
            <ActionCard
              href="/admin/grant"
              emoji="🎁"
              title="Liberar acesso (trial)"
              desc="Criar contas em lote com N dias gratuitos. Email automático com senha."
            />
            <ActionCard
              href="/admin/educacao"
              emoji="🎓"
              title="Gerenciar Trilha"
              desc="Módulos + aulas multi-kind (vídeo, conteúdo rich, checklist)."
            />
            <ActionCard
              href="/admin/news"
              emoji="📰"
              title="Gerenciar News"
              desc="Criar, editar e despublicar artigos do jornal."
            />
            <ActionCard
              href="/admin/ao-vivo"
              emoji="🔴"
              title="Agendar Lives"
              desc="Marcar encontros ao vivo via YouTube. Replay automático."
            />
            <ActionCard
              href="/admin/feedback"
              emoji="🐛"
              title="Feedback das alunas"
              desc="Bugs e sugestões reportados pelas alunas. Triagem e status."
            />
            <ActionCard
              href="/admin/leads"
              emoji="✨"
              title="Leads do formulário"
              desc="Cadastros do /formulario (link na bio). Triagem + WhatsApp 1-click."
            />
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function SectionBlock({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-eyebrow text-spark-brand">{label}</div>
      <h2
        className="mt-1 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Tone = "brand" | "good" | "warn" | "bad" | "neutral";

function StatCard({
  label,
  value,
  emoji,
  tone,
}: {
  label: string;
  value: string | number;
  emoji: string;
  tone?: Tone;
}) {
  const bg =
    tone === "brand"
      ? "bg-brand-grad-soft border-spark-brand/15"
      : tone === "good"
        ? "bg-good/5 border-good/20"
        : tone === "warn"
          ? "bg-warn/5 border-warn/20"
          : tone === "bad"
            ? "bg-bad/5 border-bad/20"
            : "bg-spark-surface border-spark-hairline";
  const color =
    tone === "brand"
      ? "text-spark-brand-deep"
      : tone === "good"
        ? "text-good"
        : tone === "warn"
          ? "text-warn"
          : tone === "bad"
            ? "text-bad"
            : "text-spark-ink";
  return (
    <div
      className={`rounded-spark-2xl border p-5 shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift ${bg}`}
    >
      <div className="text-[22px] leading-none">{emoji}</div>
      <div
        className={`mt-3 font-mono tracking-tight leading-none font-extrabold ${color}`}
        style={{ fontSize: "clamp(1.5rem, 2.4vw, 1.75rem)" }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-spark-ink-50 mt-2 font-extrabold uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 hover:border-spark-brand/40 hover:bg-spark-brand-soft/30 transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift shadow-rest block"
    >
      <div className="text-[28px] transition-transform duration-300 group-hover:scale-110 origin-left">
        {emoji}
      </div>
      <div className="mt-3 text-[15px] font-extrabold tracking-tight text-spark-ink">
        {title}
      </div>
      <p className="text-[12.5px] text-spark-ink-50 mt-1.5 leading-snug">{desc}</p>
    </Link>
  );
}
