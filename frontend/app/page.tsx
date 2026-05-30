"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  HelpCircle,
  Package,
  Pen,
  Plus,
  Radio,
  Shield,
  Sparkles,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { CountUp } from "@/components/atoms/count-up";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { FloatingNav } from "@/components/atoms/floating-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { Parallax } from "@/components/atoms/parallax";
import { SplashScreen } from "@/components/atoms/splash-screen";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { resetTutorial, type TutorialStep } from "@/lib/tutorial";
import { getLiveStatus, formatCountdown } from "@/lib/live-status";

/**
 * Home magazine — premium editorial.
 *
 * Estrutura cinematográfica (todas as seções com SectionReveal):
 *   1. HERO full-bleed: gradient radial dramático + blobs flutuantes +
 *      sparkles + sticker rotativo + headline GIGANTE em Tanker (display
 *      lowercase) + CharacterReveal + CTAs premium
 *   2. STATS — 4 KPIs full-width com CountUp + marquee de números
 *   3. AÇÕES — cards magazine com hover-lift, alternating layout
 *   4. ROTINA — banner streak + heatmap teaser
 *   5. CATÁLOGO — galeria de produtos com mask-reveal
 *   6. NEWS/AGENTES — cards editoriais
 *
 * + FloatingNav glass morphism que aparece no scroll com indicador de
 *   seção ativa via IntersectionObserver.
 */

// =================================================================
// Tipos
// =================================================================

type Profile = { name: string | null; email: string; role?: string | null };
type ProductRow = {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
};
type ScriptRow = {
  id: string;
  title: string;
  created_at: string;
  product_id: string | null;
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

type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  today_done: boolean;
  total_checkins: number;
};

// =================================================================
// Data fetch
// =================================================================

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

function greeting(hour: number): { emoji: string; text: string } {
  if (hour < 6) return { emoji: "🌙", text: "Boa madrugada" };
  if (hour < 12) return { emoji: "☀️", text: "Bom dia" };
  if (hour < 18) return { emoji: "💕", text: "Boa tarde" };
  return { emoji: "✨", text: "Boa noite" };
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86_400_000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  return `${days}d atrás`;
}

const NAV_ITEMS = [
  { href: "#hero", emoji: "🏠", label: "Topo", targetId: "hero" },
  { href: "#stats", emoji: "📊", label: "Stats", targetId: "stats" },
  { href: "#acoes", emoji: "✨", label: "Ações", targetId: "acoes" },
  { href: "#rotina", emoji: "🔥", label: "Rotina", targetId: "rotina" },
  { href: "#catalogo", emoji: "📦", label: "Catálogo", targetId: "catalogo" },
];

// =================================================================
// HERO — full-bleed cinematográfico
// =================================================================

function HeroSection({
  firstName,
  profile,
  desktop,
  onReopenTour,
}: {
  firstName: string;
  profile: Profile | null;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  const hi = greeting(new Date().getHours());
  const isAdmin = profile?.role === "admin";

  return (
    <section
      id="hero"
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "120px" : "96px",
      }}
    >
      {/* Blobs orgânicos */}
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />

      {/* Sparkles dançantes */}
      <SparkleField count={14} seed={27} className="opacity-70" />

      {/* Pílulas top-right: Admin (se for admin) + Tour */}
      <div
        className="absolute z-10 flex items-center gap-2"
        style={{
          top: desktop ? "24px" : "calc(env(safe-area-inset-top) + 12px)",
          right: desktop ? "48px" : "16px",
        }}
      >
        {isAdmin && (
          <Link
            href="/admin"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-spark-brand/25 text-spark-brand-deep text-[11.5px] font-extrabold uppercase tracking-widest shadow-lift-brand hover:bg-spark-brand-soft hover:-translate-y-0.5 transition-all duration-300 ease-premium"
            aria-label="Abrir painel admin"
          >
            <Shield
              size={13}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="hidden sm:inline">Painel admin</span>
            <ArrowUpRight
              size={12}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onReopenTour}
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 text-[11.5px] font-extrabold uppercase tracking-widest shadow-rest transition-all duration-300 ease-premium"
          aria-label="Refazer tour da home"
        >
          <HelpCircle
            size={13}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>

      {/* Conteúdo */}
      <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
        {/* Eyebrow + sticker rotativo */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <SectionReveal direction="down" durationMs={600}>
            <div data-tutorial-id="greeting">
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ {hi.text}, {firstName} {hi.emoji}
              </div>
              <div className="mt-2 text-fluid-lead text-spark-ink-70 max-w-[28ch] font-semibold">
                Sua central pra criar, vender e crescer no TikTok Shop.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={200}>
              <Parallax speed={-0.12}>
                <Sticker
                  text="MÉTODO TTS · 2026 · PREMIUM · "
                  emoji="✨"
                  size={132}
                />
              </Parallax>
            </SectionReveal>
          )}
        </div>

        {/* Headline gigante — TANKER lowercase pra wow factor */}
        <SectionReveal direction="up" delay={100} durationMs={900}>
          <h1
            data-tutorial-id="headline"
            className="font-display lowercase leading-[0.9] tracking-tight max-w-[18ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              className="block text-spark-ink"
            >
              chega de postar
            </CharacterReveal>
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              delayMs={500}
              className="block"
              charClassName="text-grad-brand"
            >
              no escuro.
            </CharacterReveal>
          </h1>
        </SectionReveal>

        {/* Sub-copy + CTAs */}
        <SectionReveal direction="up" delay={900}>
          <p className="mt-8 text-fluid-lead text-spark-ink-70 leading-snug max-w-[44ch]">
            Conversa com as especialistas, gera roteiros virais, acompanha sua rotina.
            Tudo num lugar só, do jeitinho que você merece. 💕
          </p>

          <div data-tutorial-id="hero-ctas" className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/agentes"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep active:translate-y-0"
            >
              Conversar com agentes
              <ArrowUpRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <Link
              href="/rotina/hoje"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-full glass text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift active:translate-y-0"
            >
              Check-in de hoje
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// STATS — Tiles dramáticos com CountUp + marquee
// =================================================================

function StatsSection({
  data,
  desktop,
}: {
  data: ReturnType<typeof useDashboardData>;
  desktop: boolean;
}) {
  const eduCompleted = React.useMemo(() => {
    const set = new Set(data.progress.filter((p) => p.completed).map((p) => p.video_id));
    return data.education.filter((v) => set.has(v.id)).length;
  }, [data.progress, data.education]);

  const stats = [
    {
      emoji: "📦",
      label: "Produtos no catálogo",
      value: data.products.length,
      href: "/produtos",
      tone: "brand" as const,
    },
    {
      emoji: "✍️",
      label: "Conjuntos de scripts",
      value: data.scripts.length,
      href: "/scripts",
      tone: "default" as const,
    },
    {
      emoji: "🎓",
      label: "Aulas concluídas",
      value: eduCompleted,
      total: data.education.length,
      href: "/educacao",
      tone: "default" as const,
    },
    {
      emoji: "🔥",
      label: "Dias seguidos",
      value: data.streak?.current_streak ?? 0,
      href: "/rotina/evolucao",
      tone: "default" as const,
    },
  ];

  return (
    <section
      id="stats"
      className={`relative ${desktop ? "py-24 px-12" : "py-16 px-5"}`}
    >
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="text-eyebrow text-spark-brand mb-3">✦ você hoje</div>
          <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[12ch]">
            seus números
          </h2>
        </SectionReveal>

        <div
          data-tutorial-id="stats"
          className={`mt-10 grid gap-3 ${desktop ? "grid-cols-4" : "grid-cols-2"}`}
        >
          {stats.map((s, i) => (
            <SectionReveal key={s.label} delay={i * 80} direction="up">
              <Link
                href={s.href}
                className={`group block rounded-spark-2xl p-5 sm:p-6 border hover-lift transition-colors duration-300 ${
                  s.tone === "brand"
                    ? "bg-brand-grad-soft border-spark-brand/30"
                    : "bg-spark-surface border-spark-hairline"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[28px] leading-none">{s.emoji}</span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2.2}
                    className="text-spark-ink-35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-spark-brand"
                  />
                </div>
                <div className={`mt-6 font-extrabold tracking-tight leading-none ${desktop ? "text-[44px]" : "text-[36px]"}`}>
                  <CountUp value={s.value} durationMs={1100} />
                  {s.total !== undefined && (
                    <span className="text-spark-ink-50 text-[20px] font-bold">/{s.total}</span>
                  )}
                </div>
                <div className="mt-3 text-eyebrow text-spark-ink-50">{s.label}</div>
              </Link>
            </SectionReveal>
          ))}
        </div>

        {/* Marquee horizontal de stats globais */}
        <SectionReveal delay={300}>
          <div className="mt-12 overflow-hidden rounded-spark-2xl bg-spark-ink text-white py-5">
            <div className="flex gap-12 whitespace-nowrap animate-marquee">
              {Array.from({ length: 2 }).map((_, dup) => (
                <div key={dup} className="flex gap-12 shrink-0">
                  {[
                    "✦ 8 agentes especialistas",
                    "✦ Método validado pela comunidade",
                    "✦ Conteúdo novo toda semana",
                    "✦ Comunidade exclusiva no WhatsApp",
                    "✦ Suporte 24/7 com a Yara",
                    "✦ Atualizações automáticas",
                  ].map((t, i) => (
                    <span key={i} className="text-[15px] font-extrabold tracking-tight">
                      {t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// AÇÕES — Cards magazine grandes com hover-lift
// =================================================================

function ActionsSection({ desktop }: { desktop: boolean }) {
  const actions = [
    {
      eyebrow: "Análise & roteiros",
      title: "Converse com as especialistas",
      hint: "8 agentes pra cada nicho. Skincare, suplementos, makeup, casa, eletrônicos…",
      href: "/agentes",
      emoji: "✨",
      gradient: "from-rose-300 via-pink-200 to-orange-200",
      featured: true,
    },
    {
      eyebrow: "Catálogo",
      title: "Cadastrar produto",
      hint: "Cole a ficha gerada no agente Info pra organizar.",
      href: "/produtos/novo",
      emoji: "📦",
      gradient: "from-amber-200 to-rose-200",
    },
    {
      eyebrow: "Roteiros",
      title: "Adicionar roteiros",
      hint: "5 scripts no método Yara — gancho, dev, benefício, CTA.",
      href: "/scripts/novo",
      emoji: "✍️",
      gradient: "from-purple-200 to-rose-200",
    },
  ];

  return (
    <section
      id="acoes"
      className={`relative ${desktop ? "py-24 px-12" : "py-16 px-5"}`}
    >
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ pra começar agora</div>
              <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
                bora criar?
              </h2>
            </div>
            <Link
              href="/agentes"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors duration-300"
            >
              ver tudo <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </SectionReveal>

        <div
          data-tutorial-id="actions"
          className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {actions.map((a, i) => (
            <SectionReveal key={a.href} delay={i * 120}>
              <Link
                href={a.href}
                className={`group relative overflow-hidden rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift block ${
                  a.featured ? "row-span-2 sm:col-span-1" : ""
                }`}
              >
                {/* Image area com gradient */}
                <div
                  className={`relative ${
                    a.featured ? "h-[280px] sm:h-[340px]" : "h-[180px]"
                  } bg-gradient-to-br ${a.gradient} overflow-hidden`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.5) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={`drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform duration-700 ease-premium group-hover:scale-110 group-hover:rotate-6 ${
                        a.featured ? "text-[140px] sm:text-[180px]" : "text-[80px]"
                      }`}
                    >
                      {a.emoji}
                    </span>
                  </div>
                  {a.featured && (
                    <div className="absolute top-5 left-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-ink/85 backdrop-blur text-white text-[10.5px] font-extrabold tracking-widest uppercase">
                        ✦ destaque
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="text-eyebrow text-spark-brand mb-2.5">{a.eyebrow}</div>
                  <h3
                    className={`font-extrabold text-spark-ink leading-tight tracking-tight ${
                      a.featured ? "text-fluid-title" : "text-[18px]"
                    }`}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-2 text-fluid-body text-spark-ink-70 leading-snug">{a.hint}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-extrabold text-spark-brand-deep group-hover:text-spark-brand transition-colors duration-300">
                    abrir <ArrowUpRight size={13} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// ROTINA — Banner streak premium
// =================================================================

function RotinaSection({
  streak,
  liveNow,
  desktop,
}: {
  streak: StreakInfo | null;
  liveNow: LiveRow | undefined;
  desktop: boolean;
}) {
  const current = streak?.current_streak ?? 0;
  const todayDone = streak?.today_done ?? false;

  return (
    <section
      id="rotina"
      className={`relative ${desktop ? "py-24 px-12" : "py-16 px-5"}`}
    >
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="text-eyebrow text-spark-brand mb-3">✦ sua jornada</div>
          <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
            consistência<br />
            <span className="text-spark-brand-deep">vira venda.</span>
          </h2>
        </SectionReveal>

        <div
          data-tutorial-id="rotina"
          className={`mt-10 grid gap-4 ${desktop ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {/* Streak card */}
          <SectionReveal direction="left">
            <Link
              href="/rotina/evolucao"
              className="group relative block rounded-spark-2xl overflow-hidden hover-lift bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 text-white p-6 sm:p-8 shadow-lift-brand"
            >
              <SparkleField count={8} seed={91} color="rgba(255,255,255,0.6)" className="opacity-60" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-eyebrow text-white/80">
                    {todayDone ? "✓ Check-in feito hoje" : "🔥 Sequência atual"}
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-extrabold tracking-tight leading-none text-[80px] sm:text-[110px]">
                      <CountUp value={current} durationMs={1400} />
                    </span>
                    <span className="text-[20px] font-extrabold opacity-90">
                      {current === 1 ? "dia" : "dias"}
                    </span>
                  </div>
                  <div className="mt-2 text-[14px] opacity-90 max-w-[28ch]">
                    {current > 0
                      ? "Você tá voando! Mantém o ritmo 💕"
                      : "Bora começar sua sequência hoje?"}
                  </div>
                </div>
                <Flame size={48} strokeWidth={2} className="opacity-50 animate-float" />
              </div>
              <div className="relative mt-8 inline-flex items-center gap-1.5 text-[13px] font-extrabold">
                {todayDone ? "ver evolução" : "fazer check-in"}
                <ArrowUpRight size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </SectionReveal>

          {/* Live banner ou referencia */}
          <SectionReveal direction="right" delay={120}>
            {liveNow ? (
              <Link
                href={`/ao-vivo/${liveNow.slug}`}
                className="group relative block rounded-spark-2xl overflow-hidden hover-lift bg-spark-ink text-white p-6 sm:p-8 h-full shadow-lift"
              >
                <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 opacity-50 blur-3xl animate-blob-1" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 text-eyebrow text-white/80">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-rose-400 animate-pulse-soft" />
                      <span className="relative w-2 h-2 rounded-full bg-rose-400" />
                    </span>
                    AO VIVO AGORA
                    <Radio size={12} strokeWidth={2.5} />
                  </div>
                  <h3 className="mt-4 text-fluid-headline font-extrabold tracking-tight leading-tight">
                    {liveNow.title}
                  </h3>
                  <div className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-extrabold">
                    assistir agora <ArrowUpRight size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/rotina/referencia"
                className="group relative block rounded-spark-2xl overflow-hidden hover-lift glass border border-spark-hairline p-6 sm:p-8 h-full shadow-rest"
              >
                <div className="text-eyebrow text-spark-brand mb-3">✦ referência</div>
                <h3 className="text-fluid-headline font-extrabold tracking-tight leading-tight text-spark-ink max-w-[14ch]">
                  A rotina<br />
                  ideal da Yara
                </h3>
                <p className="mt-4 text-fluid-body text-spark-ink-70 leading-snug max-w-[36ch]">
                  06h às 23h: 7 postagens, 2 lives, gravação em lote. Inspire-se.
                </p>
                <div className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-spark-brand-deep">
                  ver timeline <ArrowUpRight size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            )}
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// CATÁLOGO — Galeria de produtos com hover lift
// =================================================================

function CatalogoSection({
  products,
  desktop,
}: {
  products: ProductRow[];
  desktop: boolean;
}) {
  const items = products.slice(0, desktop ? 4 : 3);
  const hasItems = items.length > 0;

  return (
    <section
      id="catalogo"
      data-tutorial-id="catalogo"
      className={`relative ${desktop ? "py-24 px-12" : "py-16 px-5"}`}
    >
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ catálogo</div>
              <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
                seus<br />produtos
              </h2>
            </div>
            <Link
              href="/produtos"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors duration-300"
            >
              ver todos <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </SectionReveal>

        {hasItems ? (
          <div className={`grid gap-4 ${desktop ? "grid-cols-4" : "grid-cols-2"}`}>
            {items.map((p, i) => (
              <SectionReveal key={p.id} delay={i * 90}>
                <Link
                  href={`/produtos/${p.id}`}
                  className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
                >
                  <div className="relative aspect-square bg-spark-surface-sunken overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-spark-brand-soft to-spark-surface-sunken flex items-center justify-center">
                        <Package size={48} strokeWidth={1.4} className="text-spark-ink-35" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight line-clamp-1">
                      {p.name}
                    </div>
                    <div className="mt-1 text-[11.5px] text-spark-ink-50 font-mono">
                      {p.category ?? "—"} · {timeAgo(p.created_at)}
                    </div>
                  </div>
                </Link>
              </SectionReveal>
            ))}
            {/* Card "Adicionar" sempre no fim */}
            <SectionReveal delay={items.length * 90}>
              <Link
                href="/produtos/novo"
                className="group flex flex-col items-center justify-center text-center rounded-spark-2xl border-2 border-dashed border-spark-brand/30 bg-spark-brand-soft/30 hover-lift shadow-rest p-6 aspect-square"
              >
                <div className="w-14 h-14 rounded-full bg-brand-grad text-white flex items-center justify-center shadow-lift-brand">
                  <Plus size={24} strokeWidth={2.5} />
                </div>
                <div className="mt-4 text-[13px] font-extrabold text-spark-brand-deep">
                  Novo produto
                </div>
                <div className="mt-1 text-[11px] text-spark-ink-50">
                  Cadastrar ficha
                </div>
              </Link>
            </SectionReveal>
          </div>
        ) : (
          <SectionReveal>
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-8 sm:p-12 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-brand-grad-soft flex items-center justify-center text-[40px] mb-5">
                📦
              </div>
              <h3 className="text-fluid-title font-extrabold text-spark-ink">
                Comece adicionando seu primeiro produto
              </h3>
              <p className="mt-3 text-fluid-body text-spark-ink-50 max-w-[42ch] mx-auto leading-snug">
                Use os agentes pra gerar a ficha completa e cadastre aqui pra ter tudo organizado.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Link
                  href="/agentes"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full glass border border-spark-hairline text-spark-ink text-[13px] font-extrabold transition-all duration-300 ease-premium hover:-translate-y-0.5"
                >
                  Ver agentes
                </Link>
                <Link
                  href="/produtos/novo"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand transition-all duration-300 ease-premium hover:-translate-y-0.5"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Cadastrar agora
                </Link>
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}

// =================================================================
// CTA FINAL — dramatic outro
// =================================================================

function FinalCtaSection({ desktop }: { desktop: boolean }) {
  return (
    <section
      className={`relative overflow-hidden ${desktop ? "py-32 px-12" : "py-24 px-5"}`}
    >
      {/* Background dramático */}
      <div className="absolute inset-0 hero-radial" />
      <HeroBlob color="deep" variant={2} className="-top-20 -left-20 w-[500px] h-[500px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 -right-32 w-[440px] h-[440px]" />
      <SparkleField count={10} seed={777} className="opacity-60" />

      <div className={`relative ${desktop ? "max-w-[1200px] mx-auto text-center" : "text-center"}`}>
        <SectionReveal direction="scale">
          <div className="text-eyebrow text-spark-brand mb-5">
            ✦ pronta pra hoje?
          </div>
          <h2
            className="font-display lowercase text-spark-ink leading-[0.88] tracking-tight max-w-[14ch] mx-auto"
            style={{ fontSize: "clamp(2.5rem, 9vw + 0.5rem, 8rem)" }}
          >
            crie algo<br />
            <span className="text-grad-brand">
              que ninguém
            </span>
            <br />já viu.
          </h2>
        </SectionReveal>

        <SectionReveal delay={400}>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Link
              href="/agentes"
              className="group inline-flex items-center gap-2 px-8 py-5 rounded-full bg-spark-ink text-white text-[15px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep"
            >
              começar agora
              <Sparkles
                size={18}
                strokeWidth={2.2}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// NEWS — Cards editoriais
// =================================================================

function NewsSection({ news, desktop }: { news: NewsRow[]; desktop: boolean }) {
  if (news.length === 0) return null;
  const items = news.slice(0, desktop ? 3 : 2);

  return (
    <section
      className={`relative ${desktop ? "py-24 px-12" : "py-16 px-5"}`}
    >
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ novidades</div>
              <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
                últimas<br />notícias
              </h2>
            </div>
            <Link
              href="/news"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors duration-300"
            >
              todas <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </SectionReveal>

        <div
          data-tutorial-id="news"
          className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {items.map((n, i) => (
            <SectionReveal key={n.id} delay={i * 110}>
              <Link
                href={`/news/${n.slug}`}
                className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 hover-lift shadow-rest"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-eyebrow text-spark-brand">{n.category}</span>
                  {n.is_new && (
                    <span className="text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-good text-white">
                      novo
                    </span>
                  )}
                </div>
                <h3 className="text-fluid-title font-extrabold text-spark-ink leading-tight tracking-tight line-clamp-3">
                  {n.title}
                </h3>
                <div className="mt-6 flex items-center gap-2 text-[11.5px] text-spark-ink-50 font-mono">
                  <Pen size={11} strokeWidth={1.8} />
                  {n.reading_minutes} min · {timeAgo(n.published_at)}
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Body principal
// =================================================================

// Steps do tour — versões mobile e desktop sao parecidas mas o último step
// muda (mobile fala da bottom bar / desktop fala da sidebar lateral).
function buildHomeSteps(desktop: boolean, firstName: string): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta. Passa o mouse pra expandir os labels.",
        placement: "right",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre uma grade com TODOS os 9 itens do app — ranking, educação, news e mais.",
        placement: "top",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: `bem-vinda, ${firstName}!`,
      description:
        "Em 30 segundos eu te mostro tudo que tem nessa tela. Pode pular a qualquer momento e refazer depois pelo botão ✨ Tour.",
    },
    {
      id: "greeting",
      target: "greeting",
      title: "Sua saudação personalizada",
      description:
        "Aqui mostra a hora do dia e seu nome. É o ponto de partida — bom dia, boa tarde, boa noite, sempre te lembrando que esse espaço é seu.",
      placement: "bottom",
    },
    {
      id: "headline",
      target: "headline",
      title: "O lema do método",
      description:
        "Chega de postar no escuro. Tudo no app é pra você criar com método, não com chute. Toda decisão tem dado e direção por trás.",
      placement: "bottom",
    },
    {
      id: "ctas",
      target: "hero-ctas",
      title: "Seus dois fluxos principais",
      description:
        "Conversar com agentes abre os 10 GPTs/Gems especialistas por nicho. Check-in de hoje vai pra sua rotina diária — quanto mais consistente, melhor o resultado.",
      placement: "bottom",
    },
    {
      id: "stats",
      target: "stats",
      title: "Seus números em tempo real",
      description:
        "Produtos cadastrados, scripts salvos, aulas concluídas e seu streak de check-ins. Tudo clicável — toca em qualquer um pra ir direto na seção.",
      placement: desktop ? "top" : "top",
    },
    {
      id: "actions",
      target: "actions",
      title: "Próximas ações sugeridas",
      description:
        "Cards mostrando o que fazer agora baseado em onde você tá. Cadastrar produto novo, gerar scripts, completar uma aula — sempre tem próximo passo.",
      placement: "top",
    },
    {
      id: "rotina",
      target: "rotina",
      title: "Sua rotina + lives ao vivo",
      description:
        "Resumo do seu streak diário e atalho pra próxima live com a Yara. Hábito é o que separa quem posta 1x por semana de quem posta 5x por dia.",
      placement: "top",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é com você 💕",
      description:
        "Explora à vontade. Se precisar refazer o tour, clica no botão ✨ Tour no canto da home. Bora vender no TikTok Shop!",
    },
  ];
}

function HomeBody({ desktop = false }: { desktop?: boolean }) {
  const data = useDashboardData();
  const firstName =
    (data.profile?.name?.trim() || data.profile?.email?.split("@")[0] || "criadora").split(/\s+/)[0];

  const liveNow = React.useMemo(
    () => data.lives.find((l) => getLiveStatus(l) === "live"),
    [data.lives],
  );

  const steps = React.useMemo(
    () => buildHomeSteps(desktop, firstName),
    [desktop, firstName],
  );

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = () => {
    resetTutorial("home");
    setTourOpen(true);
  };

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 0 : "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      {/* Floating Nav de seções (aparece no scroll, sempre top) */}
      <FloatingNav items={NAV_ITEMS} position="top" />

      <HeroSection
        firstName={firstName}
        profile={data.profile}
        desktop={desktop}
        onReopenTour={reopenTour}
      />
      <StatsSection data={data} desktop={desktop} />
      <ActionsSection desktop={desktop} />
      <RotinaSection streak={data.streak} liveNow={liveNow} desktop={desktop} />
      <CatalogoSection products={data.products} desktop={desktop} />
      <NewsSection news={data.news} desktop={desktop} />
      <FinalCtaSection desktop={desktop} />

      {/* Tour guiado — auto-abre na primeira visita e pode re-abrir pelo botão */}
      <TutorialOverlay
        steps={steps}
        storageKey="home"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}

// =================================================================
// Page
// =================================================================

function HomeMobile() {
  return <HomeBody />;
}

function HomeDesktop() {
  return <HomeBody desktop />;
}

function HomePageContent() {
  // Mostra o splash por ~1.4s no carregamento inicial. Curto o suficiente
  // pra não atrasar, longo o suficiente pra dar identidade premium.
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <SplashScreen show={showSplash} />
      <ResponsiveShell
        mobile={<HomeMobile />}
        desktop={<HomeDesktop />}
        active="home"
        customSidebar
      />
      <FloatingMainNav active="home" />
    </>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}

// Format countdown is imported but kept silent for now.
void formatCountdown;
