import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

  // Contagens em paralelo.
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
    // Alunas totais — exclui admins
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("role.is.null,role.neq.admin"),
    // Plano ativo (active/trial em curso)
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("plan_active", true)
      .or("role.is.null,role.neq.admin"),
    // Em trial (status trial)
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
    <div className="max-w-[1080px] mx-auto">
      <h1 className="text-[28px] lg:text-[34px] font-extrabold tracking-tight">
        Painel admin ✨
      </h1>
      <p className="text-[14px] text-spark-ink-50 mt-2">
        Visão geral do app. Mudanças entram em ar instantaneamente.
      </p>

      {/* Alunas */}
      <div className="mt-7">
        <SectionLabel>👥 Alunas</SectionLabel>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total cadastradas" value={s.alunas} emoji="💖" tone="brand" />
          <StatCard label="Plano ativo" value={s.alunasAtivas} emoji="✅" tone="good" />
          <StatCard label="Em trial" value={s.alunasTrial} emoji="🎁" tone="warn" />
          <StatCard label="Inativas" value={s.alunasInativas} emoji="⏸️" />
        </div>
      </div>

      {/* Custos IA */}
      <div className="mt-6">
        <SectionLabel>💰 Custo da IA Gemini</SectionLabel>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      </div>

      {/* Conteúdo gerado */}
      <div className="mt-6">
        <SectionLabel>📚 Conteúdo gerado pelas alunas</SectionLabel>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Produtos salvos" value={s.products} emoji="📦" />
          <StatCard label="Roteiros gerados" value={s.scripts} emoji="✍️" />
          <StatCard label="Conversas no chat" value={s.conversations} emoji="💬" />
        </div>
      </div>

      {/* Catálogo da Yara */}
      <div className="mt-6">
        <SectionLabel>🎬 Catálogo Método TTS</SectionLabel>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Notícias publicadas" value={s.news} emoji="📰" />
          <StatCard label="Videoaulas" value={s.videos} emoji="🎓" />
          <StatCard label="Lives" value={s.lives} emoji="🔴" />
        </div>
      </div>

      {/* Ações */}
      <div className="mt-10">
        <SectionLabel>⚡ Ações rápidas</SectionLabel>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">
      {children}
    </div>
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
        ? "bg-good/5 border-good/15"
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
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="text-[20px] leading-none">{emoji}</div>
      <div
        className={`mt-2 font-extrabold font-mono tracking-tight text-[22px] leading-none ${color}`}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-spark-ink-50 mt-1 font-semibold">{label}</div>
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
      className="rounded-2xl bg-spark-surface border border-spark-hairline p-5 hover:border-spark-brand/40 hover:bg-spark-brand-soft/40 transition-colors block"
    >
      <div className="text-[26px]">{emoji}</div>
      <div className="mt-2 text-[15px] font-extrabold tracking-tight">{title}</div>
      <p className="text-[12.5px] text-spark-ink-50 mt-1 leading-snug">{desc}</p>
    </Link>
  );
}
