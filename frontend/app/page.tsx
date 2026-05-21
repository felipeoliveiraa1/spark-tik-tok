"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, Radio } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { VISIBLE_AGENTS, AGENTS, type AgentId } from "@/lib/agents";
import { useConversationStore } from "@/lib/conversation-store";
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";

// =================================================================
// Tipos
// =================================================================

type Profile = { name: string | null; email: string };
type ProductRow = { id: string; name: string; category: string | null; created_at: string };
type ScriptRow = { id: string; title: string; created_at: string; product_id: string | null };
type ViralRow = {
  id: string;
  thumbnail_url: string | null;
  product_name: string | null;
  creator: string | null;
  saved_at: string;
};
type EducationRow = { id: string; slug: string; title: string };
type ProgressRow = { video_id: string; completed: boolean };
type LiveRow = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  starts_at: string;
  ends_at: string | null;
  duration_minutes: number | null;
};
type NewsRow = {
  id: string;
  slug: string;
  category: string;
  title: string;
  reading_minutes: number;
  published_at: string;
  is_new: boolean;
};

// =================================================================
// Data fetch
// =================================================================

function useDashboardData() {
  const [data, setData] = React.useState<{
    profile: Profile | null;
    products: ProductRow[];
    scripts: ScriptRow[];
    virais: ViralRow[];
    education: EducationRow[];
    progress: ProgressRow[];
    lives: LiveRow[];
    news: NewsRow[];
    loaded: boolean;
  }>({
    profile: null,
    products: [],
    scripts: [],
    virais: [],
    education: [],
    progress: [],
    lives: [],
    news: [],
    loaded: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [me, prod, scripts, virais, edu, prog, lives, news] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/scripts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/virais", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/educacao", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/educacao/progress", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/ao-vivo", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/news", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (cancelled) return;
      setData({
        profile: me?.profile ?? null,
        products: prod?.products ?? [],
        scripts: scripts?.scripts ?? [],
        virais: virais?.virais ?? [],
        education: edu?.videos ?? [],
        progress: prog?.progress ?? [],
        lives: lives?.events ?? [],
        news: news?.news ?? [],
        loaded: true,
      });
    })().catch(() => setData((d) => ({ ...d, loaded: true })));
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

// =================================================================
// Helpers
// =================================================================

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function greeting(hour: number): { emoji: string; text: string } {
  if (hour < 6) return { emoji: "🌙", text: "Boa madrugada" };
  if (hour < 12) return { emoji: "☀️", text: "Bom dia" };
  if (hour < 18) return { emoji: "💕", text: "Boa tarde" };
  return { emoji: "✨", text: "Boa noite" };
}

// =================================================================
// Componente principal
// =================================================================

function HomeBody({ desktop = false }: { desktop?: boolean }) {
  const router = useRouter();
  const store = useConversationStore();
  const data = useDashboardData();
  const [creating, setCreating] = React.useState<AgentId | null>(null);

  const firstName = (data.profile?.name?.trim() || data.profile?.email?.split("@")[0] || "criadora").split(/\s+/)[0];
  const hi = greeting(new Date().getHours());

  // Encontra próxima live ou ao vivo agora
  const liveNow = React.useMemo(
    () => data.lives.find((l) => getLiveStatus(l) === "live"),
    [data.lives],
  );
  const nextLive = React.useMemo(() => {
    const upcoming = data.lives
      .filter((l) => getLiveStatus(l) === "upcoming")
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    return upcoming[0];
  }, [data.lives]);

  // Education progress
  const eduCompleted = React.useMemo(() => {
    const completedSet = new Set(data.progress.filter((p) => p.completed).map((p) => p.video_id));
    return data.education.filter((v) => completedSet.has(v.id)).length;
  }, [data.education, data.progress]);

  // Sugestões inteligentes
  const suggestions = React.useMemo(() => {
    const list: { id: string; emoji: string; title: string; href: string; cta: string }[] = [];

    // Produtos sem scripts
    const productsWithScripts = new Set(
      data.scripts.map((s) => s.product_id).filter(Boolean) as string[],
    );
    const productsWithoutScripts = data.products.filter((p) => !productsWithScripts.has(p.id));
    if (productsWithoutScripts.length > 0) {
      list.push({
        id: "scripts-missing",
        emoji: "✍️",
        title: `${productsWithoutScripts.length} ${productsWithoutScripts.length === 1 ? "produto sem script" : "produtos sem scripts"}`,
        href: "/chat",
        cta: "Bora gerar hooks",
      });
    }

    // Catálogo vazio
    if (data.products.length === 0 && data.loaded) {
      list.push({
        id: "no-products",
        emoji: "📦",
        title: "Comece adicionando seu primeiro produto",
        href: "/chat",
        cta: "Analisar agora",
      });
    }

    // Aulas não assistidas
    const eduRemaining = data.education.length - eduCompleted;
    if (eduRemaining > 0 && eduCompleted < data.education.length) {
      list.push({
        id: "edu-progress",
        emoji: "🎓",
        title: `Você assistiu ${eduCompleted} de ${data.education.length} aulas`,
        href: "/educacao",
        cta: "Continuar trilha",
      });
    }

    return list.slice(0, 3);
  }, [data, eduCompleted]);

  const start = async (agent: AgentId) => {
    if (creating) return;
    const existing = [...store.conversations]
      .filter((c) => c.agent === agent)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }
    setCreating(agent);
    try {
      const id = await store.createConversation({
        agent,
        title: `Conversa com ${AGENTS[agent].label}`,
      });
      router.push(`/chat/${id}`);
    } finally {
      setCreating(null);
    }
  };

  const pad = desktop ? "" : "px-4";
  const maxW = desktop ? "max-w-[1080px]" : "";

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={maxW}>
        {/* Saudação */}
        <div className={`${pad} ${desktop ? "" : "pt-6"}`}>
          <div className="text-[13px] font-bold text-spark-brand tracking-[0.06em] uppercase">
            {hi.text}, {firstName} {hi.emoji}
          </div>
          <h1
            className={`mt-1.5 font-extrabold tracking-tight leading-[1.1] ${desktop ? "text-[36px]" : "text-[28px]"}`}
          >
            Como anda seu trampo hoje? 💕
          </h1>
        </div>

        {/* KPI cards */}
        <div className={`mt-5 ${pad}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <KpiCard
              emoji="📦"
              label="Produtos"
              value={data.products.length}
              href="/produtos"
              tone="brand"
            />
            <KpiCard
              emoji="✍️"
              label="Scripts"
              value={data.scripts.length}
              href="/scripts"
            />
            <KpiCard
              emoji="🔥"
              label="Virais salvos"
              value={data.virais.length}
              href="/virais"
            />
            <KpiCard
              emoji="🎓"
              label="Aulas vistas"
              value={`${eduCompleted}/${data.education.length || 0}`}
              href="/educacao"
            />
          </div>
        </div>

        {/* Banner contextual: live agora / próxima / CTA padrão */}
        <div className={`mt-5 ${pad}`}>
          {liveNow ? (
            <LiveNowBanner live={liveNow} desktop={desktop} />
          ) : nextLive ? (
            <NextLiveBanner live={nextLive} desktop={desktop} />
          ) : (
            <DefaultCtaBanner desktop={desktop} />
          )}
        </div>

        {/* Sugestões inteligentes */}
        {suggestions.length > 0 && (
          <div className={`mt-6 ${pad}`}>
            <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
              Pra você fazer agora 💡
            </div>
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3">
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-brand-soft/30 transition-colors block"
                >
                  <div className="text-[22px]">{s.emoji}</div>
                  <div className="mt-1.5 text-[13.5px] font-extrabold leading-snug">{s.title}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-spark-brand">
                    {s.cta} <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Atalhos */}
        <div className={`mt-6 ${pad}`}>
          <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
            Conversar com 💕
          </div>
          <div className={`grid gap-2.5 ${desktop ? "grid-cols-3" : "grid-cols-1"}`}>
            {VISIBLE_AGENTS.map((a) => (
              <ShortcutCard key={a.id} agent={a.id} onStart={start} />
            ))}
          </div>
        </div>

        {/* Atividade recente em 2 colunas: news + produtos */}
        <div
          className={`mt-6 grid gap-3.5 ${desktop ? "grid-cols-2" : "grid-cols-1"} ${pad}`}
        >
          <SectionCard
            title="Notícias 📰"
            href="/news"
            empty={data.news.length === 0}
            emptyHint="Quando a Yara publicar uma nota, ela aparece aqui. ✨"
          >
            <div className="flex flex-col gap-2 mt-3">
              {data.news.slice(0, 3).map((n) => (
                <Link
                  key={n.id}
                  href={`/news/${n.slug}`}
                  className="p-2.5 rounded-xl bg-spark-surface-sunken hover:bg-spark-surface transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.08em] font-bold text-spark-brand">
                      {n.category}
                    </span>
                    {n.is_new && (
                      <span className="text-[9px] uppercase font-bold px-1.5 rounded-md bg-good text-white">
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-bold line-clamp-2 leading-snug">{n.title}</div>
                  <div className="text-[11px] text-spark-ink-50 mt-1 font-mono">
                    {n.reading_minutes}min · {timeAgo(n.published_at)}
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Seus produtos 📦"
            href="/produtos"
            empty={data.products.length === 0}
            emptyHint="Manda uma foto pro chat com a Informação pra criar a primeira ficha. 💄"
          >
            <div className="flex flex-col gap-2 mt-3">
              {data.products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/produtos/${p.id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-spark-surface-sunken hover:bg-spark-surface transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-spark-surface flex items-center justify-center text-spark-ink-70 shrink-0">
                    <Package size={16} strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{p.name}</div>
                    <div className="text-[11px] text-spark-ink-50 truncate">{p.category ?? "—"}</div>
                  </div>
                  <div className="text-[10.5px] text-spark-ink-35 font-mono">
                    {timeAgo(p.created_at)}
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Sub-componentes
// =================================================================

function KpiCard({
  emoji,
  label,
  value,
  href,
  tone,
}: {
  emoji: string;
  label: string;
  value: string | number;
  href: string;
  tone?: "brand";
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-3.5 transition-colors block ${
        tone === "brand"
          ? "bg-brand-grad-soft border border-spark-brand/15 hover:border-spark-brand/40"
          : "bg-spark-surface border border-spark-hairline hover:border-spark-ink/30"
      }`}
    >
      <div className="text-[20px] leading-none">{emoji}</div>
      <div
        className={`mt-1.5 font-extrabold font-mono tracking-tight text-[24px] ${
          tone === "brand" ? "text-spark-brand-deep" : "text-spark-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-spark-ink-50 font-semibold mt-0.5">{label}</div>
    </Link>
  );
}

function LiveNowBanner({ live, desktop }: { live: LiveRow; desktop: boolean }) {
  return (
    <Link
      href={`/ao-vivo/${live.slug}`}
      className={`block rounded-[22px] relative overflow-hidden text-white shadow-[0_20px_40px_-20px_oklch(0.6_0.22_25/0.4)] ${desktop ? "p-7" : "p-[18px]"}`}
      style={{
        background:
          "linear-gradient(135deg, oklch(0.6 0.22 25) 0%, oklch(0.55 0.24 340) 100%)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em]">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        AO VIVO AGORA
        <Radio size={12} strokeWidth={2.5} className="ml-1 animate-pulse" />
      </div>
      <div
        className={`mt-2 font-extrabold tracking-tight leading-[1.1] ${desktop ? "text-[26px]" : "text-[20px]"}`}
      >
        {live.title}
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold">
        Assistir agora <ArrowRight size={14} strokeWidth={2} />
      </div>
    </Link>
  );
}

function NextLiveBanner({ live, desktop }: { live: LiveRow; desktop: boolean }) {
  const min = minutesUntil(live.starts_at);
  return (
    <Link
      href={`/ao-vivo/${live.slug}`}
      className={`block rounded-[22px] relative overflow-hidden bg-spark-surface border border-spark-hairline hover:border-spark-brand/40 transition-colors ${desktop ? "p-6" : "p-[16px]"}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-[28px]">🔴</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-spark-brand">
            Próxima live · {formatCountdown(min)}
          </div>
          <div
            className={`mt-0.5 font-extrabold tracking-tight leading-tight ${desktop ? "text-[20px]" : "text-[15px]"}`}
          >
            {live.title}
          </div>
        </div>
        <ArrowRight size={18} strokeWidth={2} className="text-spark-ink-50" />
      </div>
    </Link>
  );
}

function DefaultCtaBanner({ desktop }: { desktop: boolean }) {
  return (
    <Link
      href="/chat"
      className={`block rounded-[22px] relative overflow-hidden text-white bg-brand-grad-hero shadow-[0_20px_40px_-20px_oklch(0.55_0.24_340/0.45)] ${desktop ? "p-7" : "p-[18px]"}`}
    >
      <div className="flex items-center gap-1.5 opacity-90 text-[11px] font-bold uppercase tracking-[0.08em]">
        ✨ Nova conversa
      </div>
      <div
        className={`mt-2.5 font-bold tracking-[-0.015em] leading-[1.25] ${desktop ? "text-[24px]" : "text-[19px]"}`}
      >
        &ldquo;Sobe a foto do produto, eu cuido do resto. 💅&rdquo;
      </div>
      <div className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-bold">
        Abrir chat <ArrowRight size={14} strokeWidth={1.7} />
      </div>
    </Link>
  );
}

function ShortcutCard({ agent, onStart }: { agent: AgentId; onStart: (a: AgentId) => void }) {
  const a = AGENTS[agent];
  return (
    <button
      onClick={() => onStart(agent)}
      className="text-left p-4 rounded-2xl bg-spark-surface border border-spark-hairline flex items-start gap-3.5 hover:border-spark-ink/30 transition-colors"
    >
      <AgentCharacter agent={agent} size={56} />
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[14.5px] font-extrabold tracking-[-0.01em]">{a.label}</div>
        <div className="text-[12px] text-spark-ink-50 mt-0.5 leading-snug line-clamp-2">
          {a.description}
        </div>
      </div>
    </button>
  );
}

function SectionCard({
  href,
  title,
  empty,
  emptyHint,
  children,
}: {
  href: string;
  title: string;
  empty: boolean;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl bg-spark-surface border border-spark-hairline">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-spark-ink tracking-[0.04em] uppercase">
          {title}
        </div>
        <Link
          href={href}
          className="text-[12px] font-semibold text-spark-brand inline-flex items-center gap-1"
        >
          Abrir <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      {empty ? (
        <div className="mt-3 p-4 rounded-xl bg-spark-surface-sunken text-[12.5px] text-spark-ink-50 leading-snug">
          {emptyHint}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function HomeMobile() {
  return (
    <>
      <AppHeader />
      <HomeBody />
      <BottomNav active="home" />
    </>
  );
}

function HomeDesktop() {
  return <HomeBody desktop />;
}

export default function HomePage() {
  return <ResponsiveShell mobile={<HomeMobile />} desktop={<HomeDesktop />} active="home" />;
}
