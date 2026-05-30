"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  HelpCircle,
  Trophy,
  MapPin,
  Crown,
  Flame,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { type TutorialStep } from "@/lib/tutorial";

// =================================================================
// TYPES
// =================================================================

type Period = "week" | "month" | "all";

type RankingEntry = {
  position: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  cidade_uf: string | null;
  revenue_brl: number;
  checkins_done: number;
  days_total: number;
  revenue_norm: number;
  checkin_consistency: number;
  score: number;
};

type RankingResponse = {
  period: Period;
  total: number;
  days_total: number;
  ranking: RankingEntry[];
  me: RankingEntry | null;
};

const PERIOD_LABELS: Record<Period, { short: string; full: string }> = {
  week: { short: "Semana", full: "últimos 7 dias" },
  month: { short: "Mês", full: "mês atual" },
  all: { short: "Total", full: "último ano" },
};

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getInitial(name: string): string {
  return (name?.trim() || "?").charAt(0).toUpperCase();
}

// =================================================================
// HOOK
// =================================================================

function useRanking(period: Period) {
  const [data, setData] = React.useState<RankingResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/ranking?period=${period}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const d = (await res.json()) as RankingResponse;
        setData(d);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  return { data, loading };
}

// =================================================================
// AVATAR ATOM
// =================================================================

function RankAvatar({
  name,
  url,
  size = 56,
  isMe = false,
}: {
  name: string;
  url: string | null;
  size?: number;
  isMe?: boolean;
}) {
  const dim = { width: size, height: size };
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 shadow-lift-brand",
        isMe ? "ring-4 ring-spark-brand/40" : "",
      )}
      style={dim}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full bg-brand-grad text-white flex items-center justify-center font-display"
          style={{ fontSize: size * 0.42 }}
        >
          {getInitial(name)}
        </div>
      )}
    </div>
  );
}

// =================================================================
// PÓDIO TOP 3
// =================================================================

function Podium({ top3 }: { top3: RankingEntry[] }) {
  // Ordem visual: 2º (esquerda), 1º (centro), 3º (direita)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights: Record<number, string> = { 1: "h-40", 2: "h-32", 3: "h-24" };
  const sizes: Record<number, number> = { 1: 88, 2: 72, 3: 64 };

  return (
    <div className="flex items-end justify-center gap-3 lg:gap-6">
      {podium.map((entry) => {
        const p = entry.position;
        return (
          <SectionReveal
            key={entry.user_id}
            direction="up"
            delay={p === 1 ? 0 : p === 2 ? 100 : 200}
            durationMs={700}
          >
            <div className="flex flex-col items-center">
              {p === 1 && (
                <Crown
                  size={28}
                  strokeWidth={2.2}
                  className="text-amber-400 mb-1 animate-float"
                  fill="oklch(0.85 0.18 80)"
                />
              )}
              <RankAvatar name={entry.name} url={entry.avatar_url} size={sizes[p]} />
              <div className="mt-2 text-center max-w-[120px]">
                <div
                  className={cn(
                    "font-extrabold leading-tight truncate",
                    p === 1 ? "text-[14px] text-spark-ink" : "text-[12.5px] text-spark-ink-70",
                  )}
                >
                  {entry.name}
                </div>
                {entry.cidade_uf && (
                  <div className="text-[10px] text-spark-ink-50 truncate mt-0.5">
                    {entry.cidade_uf}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "mt-3 w-20 lg:w-24 rounded-t-spark-2xl flex items-center justify-center font-display text-white shadow-hero relative overflow-hidden",
                  heights[p],
                  p === 1
                    ? "bg-gradient-to-b from-amber-400 to-orange-400"
                    : p === 2
                      ? "bg-gradient-to-b from-spark-brand to-pink-400"
                      : "bg-gradient-to-b from-orange-300 to-rose-300",
                )}
              >
                <span
                  style={{
                    fontSize: p === 1 ? "clamp(2.5rem, 6vw, 3.5rem)" : "clamp(2rem, 5vw, 2.75rem)",
                  }}
                >
                  {p}
                </span>
              </div>
            </div>
          </SectionReveal>
        );
      })}
    </div>
  );
}

// =================================================================
// LISTA (4+)
// =================================================================

function RankingList({
  entries,
  meId,
}: {
  entries: RankingEntry[];
  meId: string | null;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
      {entries.map((e, i) => {
        const isMe = e.user_id === meId;
        return (
          <SectionReveal key={e.user_id} delay={Math.min(i * 40, 240)}>
            <div
              className={cn(
                "flex items-center gap-3 lg:gap-4 p-4 lg:p-5 transition-colors duration-300",
                i > 0 ? "border-t border-spark-hairline" : "",
                isMe ? "bg-brand-grad-soft/40" : "hover:bg-spark-brand-soft/20",
              )}
            >
              <div className="w-10 text-center shrink-0">
                <span className="font-mono font-extrabold text-spark-ink text-[15px]">
                  {String(e.position).padStart(2, "0")}
                </span>
              </div>
              <RankAvatar name={e.name} url={e.avatar_url} size={44} isMe={isMe} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[14px] font-extrabold truncate",
                      isMe ? "text-spark-brand-deep" : "text-spark-ink",
                    )}
                  >
                    {e.name}
                  </span>
                  {isMe && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-spark-brand text-white text-[8.5px] font-extrabold uppercase tracking-wider shrink-0">
                      você
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-spark-ink-50 font-semibold">
                  {e.cidade_uf && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={9} strokeWidth={2.5} />
                      {e.cidade_uf}
                    </span>
                  )}
                  {e.cidade_uf && <span>·</span>}
                  <span className="inline-flex items-center gap-0.5">
                    <Flame size={9} strokeWidth={2.5} />
                    {e.checkins_done}/{e.days_total}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-extrabold text-spark-ink text-[13.5px]">
                  {fmtBRL(e.revenue_brl)}
                </div>
                <div className="text-[10px] text-spark-brand-deep font-extrabold mt-0.5">
                  score {(e.score * 100).toFixed(0)}
                </div>
              </div>
            </div>
          </SectionReveal>
        );
      })}
    </div>
  );
}

// =================================================================
// EMPTY / OPT-IN PROMPT
// =================================================================

function EmptyRanking() {
  return (
    <SectionReveal direction="up">
      <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline p-12 text-center shadow-rest">
        <div className="text-[48px] mb-3">🏆</div>
        <div className="font-display lowercase text-[24px] text-spark-ink leading-tight">
          ranking ainda vazio.
        </div>
        <p className="text-[13px] text-spark-ink-50 mt-3 max-w-[44ch] mx-auto leading-relaxed">
          Quando outras alunas escolherem aparecer no ranking, elas vão pintar aqui. Você pode
          ativar o seu na página de conta.
        </p>
        <Link
          href="/conta"
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift hover:-translate-y-0.5 transition-all duration-300 ease-premium"
        >
          <Sparkles size={13} strokeWidth={2.5} />
          Ativar meu ranking
        </Link>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// BODY
// =================================================================

function RankingBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const [period, setPeriod] = React.useState<Period>("month");
  const { data, loading } = useRanking(period);

  const top3 = (data?.ranking ?? []).slice(0, 3);
  const rest = (data?.ranking ?? []).slice(3);
  const meId = data?.me?.user_id ?? null;
  const meNotInTop = data?.me && data.me.position > 50;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
          paddingBottom: desktop ? "48px" : "32px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
        <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[460px] h-[460px]" />
        <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
        <SparkleField count={14} seed={9999} className="opacity-60" />

        <div className={`relative ${desktop ? "px-12 max-w-[900px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                Voltar pra home
              </Link>
              <button
                type="button"
                onClick={onReopenTour}
                className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 text-[12px] font-extrabold transition-all duration-300 ease-premium shadow-rest"
                aria-label="Refazer tour do ranking"
              >
                <HelpCircle size={12} strokeWidth={2.5} />
                <span className="hidden sm:inline">Tour</span>
              </button>
            </div>
          </SectionReveal>

          <div className="flex items-start justify-between gap-4 mt-6">
            <SectionReveal direction="down" delay={100}>
              <div data-tutorial-id="ranking-intro">
                <div className="text-eyebrow text-spark-brand-deep flex items-center gap-2">
                  <Trophy size={13} strokeWidth={2.5} />
                  ✦ ranking de criadoras
                </div>
                <p className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[40ch] font-semibold">
                  Faturamento + consistência viraram um score só. Bora pra cima.
                </p>
              </div>
            </SectionReveal>

            {desktop && (
              <SectionReveal direction="scale" delay={250}>
                <Sticker text="RANKING · MÉTODO TTS · " emoji="🏆" size={128} />
              </SectionReveal>
            )}
          </div>

          <SectionReveal direction="up" delay={150} durationMs={900}>
            <h1
              className="mt-5 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              quem tá <span className="text-grad-brand">no topo.</span>
            </h1>
          </SectionReveal>

          {/* Tabs periodo */}
          <SectionReveal direction="up" delay={350}>
            <div data-tutorial-id="ranking-tabs" className="mt-8 inline-flex p-1.5 rounded-full glass border border-spark-hairline shadow-rest gap-1">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-extrabold uppercase tracking-widest transition-all duration-300 ease-premium",
                    period === p
                      ? "bg-brand-grad text-white shadow-lift-brand"
                      : "text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60",
                  )}
                >
                  {PERIOD_LABELS[p].short}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              {PERIOD_LABELS[period].full}
            </div>
          </SectionReveal>

          {/* Stats globais */}
          {data && data.total > 0 && (
            <SectionReveal direction="up" delay={500}>
              <div className="mt-7 flex items-center gap-3 text-[12px] text-spark-ink-70 font-extrabold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={11} strokeWidth={2.5} />
                  {data.total} {data.total === 1 ? "criadora" : "criadoras"}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp size={11} strokeWidth={2.5} />
                  Score = 60% faturamento + 40% consistência
                </span>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* Conteúdo */}
      <section
        data-tutorial-id="ranking-listagem"
        className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}
      >
        <div className={desktop ? "max-w-[900px] mx-auto" : ""}>
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSplash message="Calculando ranking" />
            </div>
          ) : !data || data.ranking.length === 0 ? (
            <EmptyRanking />
          ) : (
            <div className="space-y-10">
              {/* Pódio */}
              {top3.length > 0 && (
                <section>
                  <Podium top3={top3} />
                </section>
              )}

              {/* Lista 4+ */}
              {rest.length > 0 && (
                <section>
                  <SectionReveal direction="up" durationMs={500}>
                    <div className="mb-4 text-eyebrow text-spark-brand">
                      ✦ posição {rest[0].position} em diante
                    </div>
                  </SectionReveal>
                  <RankingList entries={rest} meId={meId} />
                </section>
              )}

              {/* Sua posição (se fora dos 50 primeiros) */}
              {meNotInTop && data?.me && (
                <SectionReveal direction="up">
                  <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-5 shadow-lift-brand">
                    <div className="text-eyebrow text-spark-brand-deep mb-3">
                      ✦ sua posição
                    </div>
                    <RankingList entries={[data.me]} meId={meId} />
                  </div>
                </SectionReveal>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function RankingMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <RankingBody onReopenTour={onReopenTour} />;
}

// Steps do tour de Ranking (6 steps com variantes mobile/desktop pro nav)
function buildRankingSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda ao ranking!",
      description:
        "Aqui você vê quem tá no topo. Score combina faturamento (60%) e consistência da rotina (40%) — não adianta só vender, tem que manter o hábito. Em 20s te mostro tudo.",
    },
    {
      id: "intro",
      target: "ranking-intro",
      title: "Score: dinheiro + hábito",
      description:
        "Não é só quem fatura mais que ganha. O score equilibra faturamento mensal e consistência da rotina diária. Você precisa optar por aparecer (opt-in em Conta).",
    },
    {
      id: "tabs",
      target: "ranking-tabs",
      title: "Filtros de período",
      description:
        "Vê o ranking dos últimos 7 dias, do mês atual ou do ano todo. Cada período recalcula o score e mostra quem dominou aquela janela.",
    },
    {
      id: "listagem",
      target: "ranking-listagem",
      title: "Pódio + posições",
      description:
        "Top 3 fica em destaque no pódio com a coroa de quem está em 1°. Da 4ª pra baixo vira lista. Se você tá fora dos 50 primeiros, sua posição aparece num card destacado embaixo.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é subir 💕",
      description:
        "Pra entrar no ranking, ativa o opt-in em Conta e registra teu faturamento mensal. Pra refazer o tour, clica no ✨ Tour no canto.",
    },
  ];
}

function RankingPageContent() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildRankingSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <ResponsiveShell
        mobile={<RankingMobile onReopenTour={reopenTour} />}
        desktop={<RankingBody desktop onReopenTour={reopenTour} />}
        active="ranking"
        customSidebar
      />
      <FloatingMainNav active="ranking" />
      <TutorialOverlay
        steps={steps}
        storageKey="ranking"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function RankingPage() {
  return <RankingPageContent />;
}
