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

async function getStats() {
  const supabase = getServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    news,
    videos,
    lives,
    alunas,
    alunasAtivas,
    alunasTrial,
    products,
    scripts,
    conversations,
    aiUsageMonth,
    aiUsageToday,
  ] = await Promise.all([
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("education_videos").select("id", { count: "exact", head: true }),
    supabase.from("live_events").select("id", { count: "exact", head: true }),
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
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_usage")
      .select("cost_usd")
      .gte("created_at", startOfMonth),
    supabase
      .from("ai_usage")
      .select("cost_usd")
      .gte("created_at", startOfDay),
  ]);

  const monthCostUsd = (aiUsageMonth.data ?? []).reduce(
    (sum, r) => sum + Number(r.cost_usd ?? 0),
    0,
  );
  const todayCostUsd = (aiUsageToday.data ?? []).reduce(
    (sum, r) => sum + Number(r.cost_usd ?? 0),
    0,
  );

  return {
    news: news.count ?? 0,
    videos: videos.count ?? 0,
    lives: lives.count ?? 0,
    alunas: alunas.count ?? 0,
    alunasAtivas: alunasAtivas.count ?? 0,
    alunasTrial: alunasTrial.count ?? 0,
    alunasInativas: (alunas.count ?? 0) - (alunasAtivas.count ?? 0),
    products: products.count ?? 0,
    scripts: scripts.count ?? 0,
    conversations: conversations.count ?? 0,
    monthCostUsd,
    todayCostUsd,
  };
}

function formatBRL(usd: number, fx = 5.5): string {
  return (usd * fx).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

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

        {/* Custos IA */}
        <SectionBlock label="✦ custos" title="quanto a ia tá comendo">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Hoje (USD)"
              value={`$${s.todayCostUsd.toFixed(4)}`}
              emoji="📅"
            />
            <StatCard
              label="Hoje (BRL ~)"
              value={formatBRL(s.todayCostUsd)}
              emoji="🇧🇷"
            />
            <StatCard
              label="Mês (USD)"
              value={`$${s.monthCostUsd.toFixed(4)}`}
              emoji="📆"
            />
            <StatCard
              label="Mês (BRL ~)"
              value={formatBRL(s.monthCostUsd)}
              emoji="💸"
              tone={s.monthCostUsd * 5.5 > 500 ? "bad" : "brand"}
            />
          </div>
        </SectionBlock>

        {/* Conteúdo gerado */}
        <SectionBlock label="✦ produção" title="o que as alunas geraram">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Produtos salvos" value={s.products} emoji="📦" />
            <StatCard label="Roteiros gerados" value={s.scripts} emoji="✍️" />
            <StatCard label="Conversas no chat" value={s.conversations} emoji="💬" />
          </div>
        </SectionBlock>

        {/* Catálogo */}
        <SectionBlock label="✦ catálogo" title="conteúdo do método">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Notícias publicadas" value={s.news} emoji="📰" />
            <StatCard label="Videoaulas" value={s.videos} emoji="🎓" />
            <StatCard label="Lives" value={s.lives} emoji="🔴" />
          </div>
        </SectionBlock>

        {/* Ações */}
        <SectionBlock label="✦ ações rápidas" title="o que rolar agora">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ActionCard
              href="/admin/grant"
              emoji="🎁"
              title="Liberar acesso (trial)"
              desc="Criar contas em lote com N dias gratuitos. Email automático com senha."
            />
            <ActionCard
              href="/admin/usage"
              emoji="💰"
              title="Custos detalhados"
              desc="Uso da IA por aluna, modelo, agente. Últimos 30 dias."
            />
            <ActionCard
              href="/admin/news"
              emoji="📰"
              title="Gerenciar News"
              desc="Criar, editar e despublicar artigos do jornal."
            />
            <ActionCard
              href="/admin/educacao"
              emoji="🎓"
              title="Gerenciar Aulas"
              desc="Adicionar videoaulas do YouTube, organizar categorias."
            />
            <ActionCard
              href="/admin/ao-vivo"
              emoji="🔴"
              title="Agendar Lives"
              desc="Marcar encontros ao vivo via YouTube. Replay automático."
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
