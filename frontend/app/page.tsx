"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Package, Radio, Sparkles, Plus, Flame } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CountUp } from "@/components/atoms/count-up";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { Parallax } from "@/components/atoms/parallax";
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";

// =================================================================
// Tipos
// =================================================================

type Profile = { name: string | null; email: string };
type ProductRow = { id: string; name: string; category: string | null; created_at: string };
type ScriptRow = { id: string; title: string; created_at: string; product_id: string | null };
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

type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  today_done: boolean;
  total_checkins: number;
};

function useDashboardData() {
  const [data, setData] = React.useState<{
    profile: Profile | null;
    products: ProductRow[];
    scripts: ScriptRow[];
    education: EducationRow[];
    progress: ProgressRow[];
    lives: LiveRow[];
    news: NewsRow[];
    streak: StreakInfo | null;
    loaded: boolean;
  }>({
    profile: null,
    products: [],
    scripts: [],
    education: [],
    progress: [],
    lives: [],
    news: [],
    streak: null,
    loaded: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [me, prod, scripts, edu, prog, lives, news, streak] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/scripts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/educacao", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/educacao/progress", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/ao-vivo", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/news", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/checkins/streak", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (cancelled) return;
      setData({
        profile: me?.profile ?? null,
        products: prod?.products ?? [],
        scripts: scripts?.scripts ?? [],
        education: edu?.videos ?? [],
        progress: prog?.progress ?? [],
        lives: lives?.events ?? [],
        news: news?.news ?? [],
        streak: streak ?? null,
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
  const data = useDashboardData();

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
        href: "/scripts/novo",
        cta: "Cadastrar roteiros",
      });
    }

    // Catálogo vazio
    if (data.products.length === 0 && data.loaded) {
      list.push({
        id: "no-products",
        emoji: "📦",
        title: "Comece adicionando seu primeiro produto",
        href: "/produtos/novo",
        cta: "Cadastrar agora",
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

  const pad = desktop ? "" : "px-4";
  const maxW = desktop ? "max-w-[1100px]" : "";

  return (
    <div
      className={`flex-1 overflow-auto ${desktop ? "py-12 px-12" : "pb-10"}`}
      style={
        desktop
          ? undefined
          : { paddingTop: "calc(env(safe-area-inset-top) + 16px)" }
      }
    >
      <div className={maxW}>
        {/* Logo grande direto no body do mobile (com parallax leve) */}
        {!desktop && (
          <div className="flex justify-center px-4">
            <Parallax speed={-0.08}>
              <SparkWordmark size={88} />
            </Parallax>
          </div>
        )}

        {/* Hero editorial: eyebrow + headline fluido com character reveal */}
        <div className={`${pad} ${desktop ? "" : "mt-8"}`}>
          <div className="text-eyebrow text-spark-brand">
            {hi.text}, {firstName} {hi.emoji}
          </div>
          <CharacterReveal
            as="h1"
            immediate
            staggerMs={20}
            className="mt-3 block text-fluid-headline font-extrabold text-spark-ink leading-[1.02] tracking-tight max-w-[18ch]"
          >
            Pronta pra criar algo lindo hoje?
          </CharacterReveal>
        </div>

        {/* KPI cards — card unificado com 3 stats */}
        <div className={`mt-7 ${pad}`}>
          <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest hover-lift">
            <div className="grid grid-cols-3 divide-x divide-spark-hairline">
              <KpiCell
                emoji="📦"
                label="Produtos"
                value={data.products.length}
                href="/produtos"
                tone="brand"
              />
              <KpiCell
                emoji="✍️"
                label="Scripts"
                value={data.scripts.length}
                href="/scripts"
              />
              <KpiCell
                emoji="🎓"
                label="Aulas"
                value={`${eduCompleted}/${data.education.length || 0}`}
                href="/educacao"
              />
            </div>
          </div>
        </div>

        {/* Banner contextual: live agora / próxima / CTA padrão */}
        <div className={`mt-8 ${pad}`}>
          {liveNow ? (
            <LiveNowBanner live={liveNow} desktop={desktop} />
          ) : nextLive ? (
            <NextLiveBanner live={nextLive} desktop={desktop} />
          ) : (
            <DefaultCtaBanner desktop={desktop} />
          )}
        </div>

        {/* Banner Check-in Rotina TTS */}
        <div className={`mt-4 ${pad}`}>
          <CheckinBanner streak={data.streak} desktop={desktop} />
        </div>

        {/* Sugestões inteligentes */}
        {suggestions.length > 0 && (
          <div className={`mt-10 ${pad}`}>
            <div className="text-eyebrow text-spark-brand mb-4">
              💡 Pra você fazer agora
            </div>
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3">
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-brand-soft/30 hover-lift block shadow-rest"
                >
                  <div className="text-[24px]">{s.emoji}</div>
                  <div className="mt-1.5 text-[14px] font-extrabold leading-snug">{s.title}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-spark-brand">
                    {s.cta} <ArrowRight size={11} strokeWidth={2} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Atalhos rápidos */}
        <div className={`mt-10 ${pad}`}>
          <div className="text-eyebrow text-spark-brand mb-4">
            ✨ Atalhos rápidos
          </div>
          <div className={`grid gap-2.5 ${desktop ? "grid-cols-3" : "grid-cols-1"}`}>
            <QuickAction
              href="/agentes"
              emoji="✨"
              title="Conversar com agentes"
              hint="Info, Scripts por nicho e Suporte no ChatGPT ou Gemini"
              accent="brand"
            />
            <QuickAction
              href="/produtos/novo"
              emoji="📦"
              title="Adicionar produto"
              hint="Cadastra a ficha que você gerou no agente Info"
            />
            <QuickAction
              href="/scripts/novo"
              emoji="✍️"
              title="Adicionar roteiros"
              hint="Cola os 5 roteiros que você gerou no Scripts"
            />
          </div>
        </div>

        {/* Atividade recente em 2 colunas: news + produtos */}
        <div
          className={`mt-10 grid gap-3.5 ${desktop ? "grid-cols-2" : "grid-cols-1"} ${pad}`}
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
            emptyHint="Vai em Agentes ✨, gera a ficha no Info e cadastra aqui em 'Adicionar produto'. 💄"
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

function KpiCell({
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
  const isNumeric = typeof value === "number";
  return (
    <Link
      href={href}
      className={`p-4 text-center transition-colors duration-300 ease-premium active:bg-spark-surface-sunken hover:bg-spark-surface-sunken/60 ${
        tone === "brand" ? "bg-brand-grad-soft/60" : ""
      }`}
    >
      <div className="text-[24px] leading-none">{emoji}</div>
      <div
        className={`mt-2.5 font-extrabold font-mono tracking-tight text-[28px] leading-none ${
          tone === "brand" ? "text-spark-brand-deep" : "text-spark-ink"
        }`}
      >
        {isNumeric ? <CountUp value={value} durationMs={900} /> : value}
      </div>
      <div className="text-eyebrow text-spark-ink-50 mt-2">{label}</div>
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

function CheckinBanner({
  streak,
  desktop,
}: {
  streak: StreakInfo | null;
  desktop: boolean;
}) {
  const current = streak?.current_streak ?? 0;
  const todayDone = streak?.today_done ?? false;

  if (todayDone) {
    return (
      <Link
        href="/rotina/evolucao"
        className={`block rounded-[22px] bg-spark-surface border border-spark-hairline ${desktop ? "p-5" : "p-4"} hover:border-spark-brand/40 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-400 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Flame size={22} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-spark-brand uppercase tracking-[0.08em]">
              Check-in feito hoje ✓
            </div>
            <div className={`mt-0.5 font-extrabold text-spark-ink leading-tight ${desktop ? "text-[18px]" : "text-[15px]"}`}>
              {current} {current === 1 ? "dia" : "dias"} seguidos 🔥
            </div>
            <div className="text-[12px] text-spark-ink-50 mt-0.5">
              Bora ver sua evolução?
            </div>
          </div>
          <ArrowRight size={16} strokeWidth={2} className="text-spark-ink-50 shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/rotina/hoje"
      className={`block rounded-[22px] relative overflow-hidden text-white bg-gradient-to-br from-orange-500 to-pink-500 shadow-[0_12px_32px_-16px_rgba(255,90,120,0.45)] ${desktop ? "p-5" : "p-4"}`}
    >
      <div
        aria-hidden
        className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl pointer-events-none"
      />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Flame size={22} strokeWidth={2.2} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
            Rotina diária ✨
          </div>
          <div className={`mt-0.5 font-extrabold leading-tight ${desktop ? "text-[18px]" : "text-[15px]"}`}>
            {current > 0
              ? `Sequência de ${current} ${current === 1 ? "dia" : "dias"} em risco!`
              : "Bora começar sua sequência?"}
          </div>
          <div className="text-[12px] opacity-90 mt-0.5">
            Faz seu check-in em 3 min — atividades, autocuidado e KPIs do dia.
          </div>
        </div>
        <ArrowRight size={16} strokeWidth={2} className="shrink-0" />
      </div>
    </Link>
  );
}

function DefaultCtaBanner({ desktop }: { desktop: boolean }) {
  return (
    <Link
      href="/agentes"
      className={`block rounded-[22px] relative overflow-hidden text-white bg-brand-grad-hero shadow-[0_20px_40px_-20px_oklch(0.55_0.24_340/0.45)] ${desktop ? "p-7" : "p-[18px]"}`}
    >
      <div className="flex items-center gap-1.5 opacity-90 text-[11px] font-bold uppercase tracking-[0.08em]">
        ✨ Agentes Método TTS
      </div>
      <div
        className={`mt-2.5 font-bold tracking-[-0.015em] leading-[1.25] ${desktop ? "text-[24px]" : "text-[19px]"}`}
      >
        &ldquo;Cada nicho tem uma especialista. Escolhe a sua e bora criar. 💅&rdquo;
      </div>
      <div className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-bold">
        Ver agentes <ArrowRight size={14} strokeWidth={1.7} />
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  emoji,
  title,
  hint,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  hint: string;
  accent?: "brand";
}) {
  return (
    <Link
      href={href}
      className={`p-5 rounded-spark-2xl border flex items-start gap-3.5 hover-lift shadow-rest ${
        accent === "brand"
          ? "bg-brand-grad-soft/60 border-spark-brand/30 hover:border-spark-brand/60"
          : "bg-spark-surface border-spark-hairline hover:border-spark-brand/40"
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[24px] shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[15px] font-extrabold tracking-tight">{title}</div>
        <div className="text-[12.5px] text-spark-ink-70 mt-1 leading-snug line-clamp-2">
          {hint}
        </div>
      </div>
    </Link>
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
    <div className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift">
      <div className="flex items-center justify-between">
        <div className="text-eyebrow text-spark-ink">
          {title}
        </div>
        <Link
          href={href}
          className="text-[12px] font-semibold text-spark-brand inline-flex items-center gap-1 hover:text-spark-brand-deep"
        >
          Abrir <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
      {empty ? (
        <div className="mt-3 p-4 rounded-2xl bg-spark-surface-sunken text-[12.5px] text-spark-ink-50 leading-snug">
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
