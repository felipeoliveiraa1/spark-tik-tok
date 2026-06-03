"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Crown,
  Flame,
  TrendingUp,
  Sparkles,
  X,
  Tag,
  CheckCircle2,
  Target,
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
import { HelpMenu } from "@/components/molecules/help-menu";
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
  niche: string | null;
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

function Podium({
  top3,
  onSelect,
}: {
  top3: RankingEntry[];
  onSelect?: (e: RankingEntry) => void;
}) {
  // Ordem visual: 2º (esquerda), 1º (centro), 3º (direita)
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights: Record<number, string> = { 1: "h-48 lg:h-56", 2: "h-36 lg:h-44", 3: "h-28 lg:h-36" };
  const sizes: Record<number, number> = { 1: 104, 2: 80, 3: 72 };

  return (
    <div className="flex items-end justify-center gap-2 lg:gap-5">
      {podium.map((entry) => {
        const p = entry.position;
        return (
          <SectionReveal
            key={entry.user_id}
            direction="up"
            delay={p === 1 ? 0 : p === 2 ? 120 : 240}
            durationMs={800}
          >
            <button
              type="button"
              onClick={() => onSelect?.(entry)}
              className="flex flex-col items-center w-[110px] lg:w-[140px] cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all duration-200"
            >
              {/* Coroa no 1º */}
              {p === 1 && (
                <Crown
                  size={32}
                  strokeWidth={2}
                  className="text-amber-400 mb-2 animate-float drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]"
                  fill="oklch(0.85 0.18 80)"
                />
              )}
              {p !== 1 && <div className="h-[42px]" aria-hidden />}

              <RankAvatar name={entry.name} url={entry.avatar_url} size={sizes[p]} />

              {/* Nome + Cidade */}
              <div className="mt-3 text-center w-full">
                <div
                  className={cn(
                    "font-extrabold leading-tight truncate tracking-tight",
                    p === 1 ? "text-[15px] text-spark-ink" : "text-[13px] text-spark-ink-70",
                  )}
                >
                  {entry.name}
                </div>
                {entry.cidade_uf && (
                  <div className="text-[10px] text-spark-ink-50 truncate mt-0.5 font-mono">
                    {entry.cidade_uf}
                  </div>
                )}
                {/* CTA pra abrir perfil */}
                <div className="mt-1.5 inline-flex items-center gap-1 text-spark-brand-deep text-[9px] font-extrabold uppercase tracking-widest">
                  toque pra ver mais →
                </div>
              </div>

              {/* Card do pódio com número + faturamento */}
              <div
                className={cn(
                  "mt-3 w-full rounded-t-spark-2xl flex flex-col items-center justify-end pb-3 text-white shadow-hero relative overflow-hidden",
                  heights[p],
                  p === 1
                    ? "bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500"
                    : p === 2
                      ? "bg-gradient-to-b from-spark-brand to-pink-500"
                      : "bg-gradient-to-b from-orange-300 to-rose-400",
                )}
              >
                {/* Brilho decorativo no topo */}
                <div
                  aria-hidden
                  className="absolute top-0 inset-x-0 h-8"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)",
                  }}
                />
                <span
                  className="font-display leading-none"
                  style={{
                    fontSize: p === 1 ? "clamp(3rem, 8vw, 4.5rem)" : "clamp(2.25rem, 6vw, 3.25rem)",
                  }}
                >
                  {p}
                </span>
                {/* Faturamento no card do pódio (1º destaque) */}
                {entry.revenue_brl > 0 && (
                  <div className="mt-1 text-center px-2">
                    <div className="text-[9px] uppercase tracking-widest opacity-85 font-extrabold">
                      faturou
                    </div>
                    <div
                      className={cn(
                        "font-mono font-extrabold leading-none",
                        p === 1 ? "text-[15px]" : "text-[12px]",
                      )}
                    >
                      {fmtBRL(entry.revenue_brl)}
                    </div>
                  </div>
                )}
              </div>

              {/* Score embaixo do pódio */}
              <div className="mt-2 text-center">
                <div className="text-[9.5px] uppercase tracking-widest text-spark-ink-50 font-extrabold">
                  score
                </div>
                <div
                  className={cn(
                    "font-display leading-none mt-0.5",
                    p === 1 ? "text-[20px] text-spark-brand-deep" : "text-[16px] text-spark-ink",
                  )}
                >
                  {(entry.score * 100).toFixed(0)}
                </div>
              </div>
            </button>
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
  onSelect,
}: {
  entries: RankingEntry[];
  meId: string | null;
  onSelect?: (e: RankingEntry) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
      {entries.map((e, i) => {
        const isMe = e.user_id === meId;
        const consistencyPct = Math.round(
          Math.min(1, e.checkins_done / Math.max(1, e.days_total)) * 100,
        );
        return (
          <SectionReveal key={e.user_id} delay={Math.min(i * 40, 240)}>
            <button
              type="button"
              onClick={() => onSelect?.(e)}
              className={cn(
                "w-full text-left flex items-center gap-3 lg:gap-4 p-4 lg:p-5 transition-all duration-300",
                i > 0 ? "border-t border-spark-hairline" : "",
                isMe
                  ? "bg-brand-grad-soft/60 ring-2 ring-inset ring-spark-brand/30"
                  : "hover:bg-spark-brand-soft/15 active:bg-spark-brand-soft/25",
              )}
            >
              {/* Posição grande estilo magazine */}
              <div className="w-12 lg:w-14 text-center shrink-0">
                <span className="font-display text-spark-ink text-[22px] lg:text-[26px] leading-none">
                  {e.position}
                </span>
              </div>

              <RankAvatar name={e.name} url={e.avatar_url} size={52} isMe={isMe} />

              {/* Bloco central: nome + nicho + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-[14.5px] font-extrabold truncate tracking-tight",
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

                {/* Cidade + streak meta */}
                <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-spark-ink-50 font-semibold flex-wrap">
                  {e.cidade_uf && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={9} strokeWidth={2.5} />
                      {e.cidade_uf}
                    </span>
                  )}
                  {e.cidade_uf && <span aria-hidden>·</span>}
                  <span className="inline-flex items-center gap-0.5">
                    <Flame size={9} strokeWidth={2.5} />
                    {e.checkins_done}/{e.days_total} ({consistencyPct}%)
                  </span>
                </div>

                {/* CTA pra abrir perfil */}
                <div className="mt-1 inline-flex items-center gap-1 text-spark-brand-deep text-[9.5px] font-extrabold uppercase tracking-widest">
                  toque pra ver mais →
                </div>
              </div>

              {/* Bloco direito: faturamento DESTACADO + score */}
              <div className="text-right shrink-0 min-w-[88px]">
                <div className="text-[8.5px] uppercase tracking-widest text-spark-ink-50 font-extrabold">
                  faturou
                </div>
                <div
                  className={cn(
                    "font-mono font-extrabold leading-none mt-0.5",
                    e.revenue_brl > 0 ? "text-spark-ink text-[15px]" : "text-spark-ink-35 text-[13px]",
                  )}
                >
                  {e.revenue_brl > 0 ? fmtBRL(e.revenue_brl) : "—"}
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-spark-ink text-white text-[9.5px] font-extrabold uppercase tracking-widest">
                  <Sparkles size={8} strokeWidth={2.5} />
                  {(e.score * 100).toFixed(0)}
                </div>
              </div>
            </button>
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
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<RankingEntry | null>(null);
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
              <HelpMenu onReopenTour={onReopenTour} />
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

          {/* Stats globais + botão Como funciona */}
          {data && data.total > 0 && (
            <SectionReveal direction="up" delay={500}>
              <div className="mt-7 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-spark-ink-70 font-extrabold uppercase tracking-wider">
                  <Sparkles size={11} strokeWidth={2.5} />
                  {data.total} {data.total === 1 ? "criadora" : "criadoras"}
                </span>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-ink text-white text-[11px] font-extrabold uppercase tracking-widest shadow-rest hover:-translate-y-0.5 transition-all duration-300 ease-premium"
                >
                  <TrendingUp size={11} strokeWidth={2.5} />
                  Como funciona o score?
                </button>
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
                  <Podium top3={top3} onSelect={setSelectedEntry} />
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
                  <RankingList entries={rest} meId={meId} onSelect={setSelectedEntry} />
                </section>
              )}

              {/* Sua posição (se fora dos 50 primeiros) */}
              {meNotInTop && data?.me && (
                <SectionReveal direction="up">
                  <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-5 shadow-lift-brand">
                    <div className="text-eyebrow text-spark-brand-deep mb-3">
                      ✦ sua posição
                    </div>
                    <RankingList entries={[data.me]} meId={meId} onSelect={setSelectedEntry} />
                  </div>
                </SectionReveal>
              )}
            </div>
          )}
        </div>
      </section>

      {helpOpen && <ScoreHelpModal onClose={() => setHelpOpen(false)} />}
      {selectedEntry && (
        <ProfileSheet
          entry={selectedEntry}
          isMe={selectedEntry.user_id === meId}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

// =================================================================
// PROFILE SHEET — modal mostrando perfil completo da aluna clicada
// =================================================================

function ProfileSheet({
  entry,
  isMe,
  onClose,
}: {
  entry: RankingEntry;
  isMe: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const consistencyPct = Math.round(
    Math.min(1, entry.checkins_done / Math.max(1, entry.days_total)) * 100,
  );
  const niches = (entry.niche ?? "")
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${entry.name}`}
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-spark-surface w-full max-w-[420px] shadow-hero animate-slide-up",
          "rounded-t-spark-3xl sm:rounded-spark-3xl",
          "max-h-[90vh] overflow-y-auto",
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {/* Close */}
        <div className="sticky top-0 right-0 z-10 flex justify-end p-3 pb-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-spark-surface-sunken hover:bg-spark-ink-10 flex items-center justify-center text-spark-ink-70 transition-colors"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cabecalho com avatar + posicao */}
        <div className="px-6 -mt-1 text-center">
          <div className="inline-flex flex-col items-center">
            <RankAvatar
              name={entry.name}
              url={entry.avatar_url}
              size={88}
              isMe={isMe}
            />
            <div className="mt-3 inline-flex items-center gap-2 text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50">
              <Trophy size={11} strokeWidth={2.5} />
              posição {entry.position}
            </div>
            <h2 className="mt-1 font-display lowercase leading-tight text-spark-ink text-[24px]">
              {entry.name.toLowerCase()}
            </h2>
            {isMe && (
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-spark-brand text-white text-[9.5px] font-extrabold uppercase tracking-wider">
                você
              </span>
            )}
            {entry.cidade_uf && (
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-spark-ink-70 font-semibold font-mono">
                <MapPin size={11} strokeWidth={2.5} />
                {entry.cidade_uf}
              </div>
            )}
          </div>
        </div>

        {/* Nichos — agora SEM cortar */}
        <div className="px-6 mt-5">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-spark-ink-50 mb-2 flex items-center gap-1.5">
            <Tag size={10} strokeWidth={2.5} />
            nichos
          </div>
          {niches.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {niches.map((n, idx) => (
                <span
                  key={`${n}-${idx}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[11px] font-extrabold"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-spark-ink-50 italic">
              Ainda não cadastrou nicho 💭
            </div>
          )}
        </div>

        {/* KPIs grandes: faturamento + consistência + score */}
        <div className="px-6 mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-spark-xl bg-spark-surface-sunken p-3 text-center">
            <div className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-widest font-extrabold text-spark-ink-50">
              <Target size={9} strokeWidth={2.5} />
              faturou
            </div>
            <div className="mt-1.5 font-mono font-extrabold text-spark-ink text-[15px] leading-none">
              {entry.revenue_brl > 0 ? fmtBRL(entry.revenue_brl) : "—"}
            </div>
          </div>
          <div className="rounded-spark-xl bg-spark-surface-sunken p-3 text-center">
            <div className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-widest font-extrabold text-spark-ink-50">
              <Flame size={9} strokeWidth={2.5} />
              rotina
            </div>
            <div className="mt-1.5 font-mono font-extrabold text-spark-ink text-[15px] leading-none">
              {consistencyPct}%
            </div>
            <div className="text-[9.5px] text-spark-ink-50 font-semibold mt-0.5">
              {entry.checkins_done}/{entry.days_total}
            </div>
          </div>
          <div className="rounded-spark-xl bg-spark-ink text-white p-3 text-center">
            <div className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-widest font-extrabold opacity-90">
              <Sparkles size={9} strokeWidth={2.5} />
              score
            </div>
            <div className="mt-1.5 font-mono font-extrabold text-[15px] leading-none">
              {(entry.score * 100).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Quebra do score (60% rotina + 40% faturamento) */}
        <div className="px-6 mt-5 mb-6">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-spark-ink-50 mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            como o score é calculado
          </div>
          <div className="rounded-spark-xl bg-spark-surface-sunken p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-spark-ink-70 mb-1">
                <span>60% Consistência de rotina</span>
                <span className="font-mono">{(entry.checkin_consistency * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-spark-ink-10 overflow-hidden">
                <div
                  className="h-full bg-brand-grad transition-all duration-700"
                  style={{ width: `${entry.checkin_consistency * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold text-spark-ink-70 mb-1">
                <span>40% Faturamento (relativo)</span>
                <span className="font-mono">{(entry.revenue_norm * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-spark-ink-10 overflow-hidden">
                <div
                  className="h-full bg-brand-grad transition-all duration-700"
                  style={{ width: `${entry.revenue_norm * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// SCORE HELP MODAL — explica como funciona pra quem ta confuso
// =================================================================

function ScoreHelpModal({ onClose }: { onClose: () => void }) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Como funciona o score"
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-[560px] bg-spark-surface rounded-t-spark-2xl sm:rounded-spark-2xl border-2 border-spark-brand/20 shadow-hero overflow-hidden flex flex-col max-h-[92dvh]"
        style={{ animation: "score-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-spark-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-grad-soft flex items-center justify-center text-spark-brand-deep">
              <TrendingUp size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-eyebrow text-spark-brand">✦ como funciona</div>
              <h2 className="text-[15px] font-extrabold text-spark-ink tracking-tight leading-none mt-1">
                O score do ranking
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Fórmula visual */}
          <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-5 text-center">
            <div className="text-eyebrow text-spark-brand-deep mb-3">a fórmula</div>
            <div className="flex items-center justify-center gap-2 font-display text-spark-ink leading-none flex-wrap">
              <span className="text-[28px]">score</span>
              <span className="text-[20px] text-spark-ink-50">=</span>
              <span className="px-3 py-1.5 rounded-spark-xl bg-spark-ink text-white text-[14px]">
                60% consistência
              </span>
              <span className="text-[20px] text-spark-ink-50">+</span>
              <span className="px-3 py-1.5 rounded-spark-xl bg-spark-brand text-white text-[14px]">
                40% faturamento
              </span>
            </div>
            <div className="mt-3 text-[11px] text-spark-ink-70 font-mono">
              0 a 100 pontos
            </div>
          </div>

          {/* Consistência */}
          <div>
            <div className="text-eyebrow text-spark-brand mb-2.5">
              60% · consistência (o que pesa mais)
            </div>
            <p className="text-[13.5px] text-spark-ink-70 leading-relaxed font-semibold">
              É o quanto você bateu sua <strong>rotina diária</strong> no período do
              ranking. Cada dia em que você abre a rotina e clica em "Concluir dia"
              conta como 1 ponto na sua consistência.
            </p>
            <ul className="mt-3 space-y-1.5 text-[12.5px] text-spark-ink-70 font-semibold">
              <li className="flex items-start gap-2">
                <span className="text-spark-brand-deep mt-0.5">✓</span>
                <span>30 dias com rotina batida no mês = consistência 100% = <strong>60 pontos</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-spark-brand-deep mt-0.5">✓</span>
                <span>15 dias batidos = 50% = <strong>30 pontos</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-spark-ink-50 mt-0.5">✗</span>
                <span>0 dias batidos = <strong>0 pontos</strong></span>
              </li>
            </ul>
          </div>

          {/* Faturamento */}
          <div>
            <div className="text-eyebrow text-spark-brand mb-2.5">
              40% · faturamento
            </div>
            <p className="text-[13.5px] text-spark-ink-70 leading-relaxed font-semibold">
              Quanto você faturou no TikTok Shop no período. É <strong>relativo ao grupo</strong> —
              se a top do ranking faturou R$10 mil e você faturou R$5 mil, ganha
              50% dos 40 pontos. Cadastra na sua{" "}
              <strong>Conta → Faturamento</strong>, atualiza durante o mês.
            </p>
            <div className="mt-3 rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-4 py-3 text-[12px] text-spark-ink-70 leading-relaxed font-semibold">
              💡 Como o faturamento é relativo, alguém pode ter faturado pouco mas
              ficar bem no ranking se mantém a consistência alta. E vice-versa: faturar
              muito não basta se você não bate a rotina.
            </div>
          </div>

          {/* Períodos */}
          <div>
            <div className="text-eyebrow text-spark-brand mb-2.5">
              os 3 períodos
            </div>
            <ul className="space-y-2 text-[12.5px] text-spark-ink-70 font-semibold">
              <li>
                <strong className="text-spark-ink">Semana</strong> — últimos 7 dias
                (movimento rápido)
              </li>
              <li>
                <strong className="text-spark-ink">Mês</strong> — mês atual (padrão)
              </li>
              <li>
                <strong className="text-spark-ink">Total</strong> — últimos 12 meses
                (quem é constante de verdade)
              </li>
            </ul>
          </div>

          {/* Dicas */}
          <div className="rounded-spark-xl bg-brand-grad-soft border border-spark-brand/20 px-4 py-3.5 text-[12.5px] text-spark-ink leading-relaxed font-semibold">
            <div className="font-extrabold text-spark-brand-deep mb-1">
              ✦ pra subir rápido
            </div>
            Bate a rotina <strong>todo dia</strong>. Mesmo dias que você só fez
            o mínimo, marca e conclui. A consistência diária é o que mais pesa
            — em 2 semanas batendo todo dia você já passa quem só faturou 💕
          </div>
        </div>

        <div className="px-5 py-4 border-t border-spark-hairline bg-spark-surface-sunken/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all duration-300 ease-premium"
          >
            Entendi
          </button>
        </div>

        <style jsx>{`
          @keyframes score-up {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
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
