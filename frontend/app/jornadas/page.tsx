"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, PlayCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { NotificationFeed } from "@/components/journey/NotificationFeed";
import { JourneyImmersiveBG } from "@/components/journey/JourneyImmersiveBG";
import { JourneyLoadingScreen } from "@/components/journey/JourneyLoadingScreen";
import { STAGE_EMOJI } from "@/lib/journey/character-stage";
import { LevelUpAnimation } from "@/components/journey/LevelUpAnimation";
import { JourneyCard } from "@/components/journey/JourneyCard";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { CHARACTER_STAGES } from "@/lib/journey/character-stage";
import { useJourneyStats } from "@/lib/journey/useJourneyStats";

type JourneyApiItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  character_stage: CharacterStage;
  character_name: string | null;
  hero_color_a: string | null;
  hero_color_b: string | null;
  order_index: number;
  xp_required: number;
  is_admin_only: boolean;
  progress: {
    xp_total: number;
    status: string;
    completed_at: string | null;
  } | null;
  lesson_count: number;
  lessons_completed: number;
  pct_complete: number;
};

type ApiResp = {
  journeys: JourneyApiItem[];
  me: {
    character_stage: CharacterStage;
    journeys_completed: number;
    is_admin: boolean;
  };
};

const LEVEL_UP_KEY = "tts:lastSeenStage";

export default function JornadasPage() {
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);
  const [levelUp, setLevelUp] = React.useState<{
    from: CharacterStage;
    to: CharacterStage;
  } | null>(null);
  const { stats } = useJourneyStats();

  const load = React.useCallback(() => {
    setErrored(false);
    setLoading(true);
    void fetch("/api/jornadas", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((j) => setData(j))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Detecta level up
  React.useEffect(() => {
    if (!data?.me.character_stage || typeof window === "undefined") return;
    const lastSeen = window.localStorage.getItem(LEVEL_UP_KEY) as CharacterStage | null;
    const current = data.me.character_stage;
    if (
      lastSeen &&
      CHARACTER_STAGES.includes(lastSeen) &&
      lastSeen !== current &&
      CHARACTER_STAGES.indexOf(current) > CHARACTER_STAGES.indexOf(lastSeen)
    ) {
      setLevelUp({ from: lastSeen, to: current });
      void import("@/lib/journey/track").then(({ trackJourneyEvent }) =>
        trackJourneyEvent("level_up_seen", {
          from_stage: lastSeen,
          to_stage: current,
        }),
      );
    }
    window.localStorage.setItem(LEVEL_UP_KEY, current);
  }, [data?.me.character_stage]);

  // Loading
  if (loading) {
    return <JourneyLoadingScreen />;
  }

  // Error state
  if (errored) {
    return (
      <div className="min-h-dvh relative">
        <JourneyImmersiveBG stage="bebe" intensity="medium" fixed />
        <StickyHeader />
        <div className="mx-4 max-w-[520px] md:mx-auto mt-6 rounded-spark-xl border border-spark-hairline bg-spark-surface/95 backdrop-blur p-6 text-center">
          <p className="text-spark-ink mb-4">
            Não conseguimos carregar suas jornadas agora.
          </p>
          <button
            onClick={load}
            className="w-full h-12 rounded-full bg-spark-brand text-white font-extrabold"
          >
            Tentar de novo
          </button>
          <Link
            href="/chat"
            className="block mt-3 text-spark-ink-70 text-[13px] underline"
          >
            Ir pro Chat
          </Link>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.journeys.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 text-center bg-spark-bg">
        <Sparkles size={32} className="text-spark-ink-35 mb-3" />
        <h2 className="font-display text-[24px] text-spark-ink">Em breve</h2>
        <p className="text-spark-ink-70 mt-2 max-w-[40ch]">
          As Jornadas chegam em breve. Aguarde!
        </p>
      </div>
    );
  }

  // Enrichment: marca current/locked/completed
  let currentIdx = -1;
  const enrichedJourneys = data.journeys.map((j, idx) => {
    const isCompleted = j.progress?.status === "completed";
    const isLocked =
      idx > 0 && data.journeys[idx - 1]?.progress?.status !== "completed";
    const isCurrent = !isCompleted && !isLocked && currentIdx === -1;
    if (isCurrent) currentIdx = idx;
    return {
      id: j.id,
      slug: j.slug,
      title: j.title,
      character_stage: j.character_stage,
      is_completed: isCompleted,
      is_current: isCurrent,
      is_locked: isLocked,
      is_admin_only: j.is_admin_only,
      pct_complete: j.pct_complete,
    };
  });

  const currentJourney = enrichedJourneys.find((j) => j.is_current);

  return (
    <div className="min-h-dvh pb-12 relative">
      <JourneyImmersiveBG
        stage={data.me.character_stage}
        intensity="medium"
        fixed
      />
      <StickyHeader
        xpTotal={stats?.xp_total ?? null}
        stage={data.me.character_stage}
        isAdmin={data.me.is_admin}
      />

      <main className="max-w-[520px] mx-auto">
        {/* Continue Hero — CTA primario quando ha jornada current */}
        {currentJourney && (
          <Link
            href={`/jornadas/${currentJourney.slug}`}
            className="mx-4 mt-3 flex items-center gap-3 h-[72px] px-4 rounded-spark-xl bg-spark-brand border border-spark-brand-deep shadow-lift-brand active:scale-[0.98] transition-transform"
          >
            <PlayCircle
              size={28}
              className="text-white shrink-0"
              strokeWidth={2.4}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">
                Continuar
              </div>
              <div className="font-display text-[15px] text-white truncate">
                {currentJourney.title}
                {currentJourney.pct_complete > 0 && (
                  <span className="text-white/80 font-normal ml-1.5 text-[12.5px]">
                    · {Math.round(currentJourney.pct_complete)}%
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={20} className="text-white shrink-0" />
          </Link>
        )}

        {/* Stack vertical de cards full-bleed */}
        <div className="px-4 mt-4 flex flex-col gap-4">
          {enrichedJourneys.map((j, idx) => (
            <JourneyCard
              key={j.id}
              journey={j}
              index={idx}
              characterStage={data.me.character_stage}
              isAdmin={data.me.is_admin}
              priority={idx === 0}
            />
          ))}
        </div>

        {/* Conquistas — sheet branco com stats + grid de distintivos */}
        {stats &&
          (stats.lessons_completed_count > 0 ||
            stats.proofs_approved_count > 0 ||
            stats.badges.length > 0) && (
            <div className="mt-6 mx-4">
              <div className="rounded-spark-2xl bg-white/95 backdrop-blur-md shadow-lift border border-white/50 p-5 md:p-6">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-spark-brand-deep">
                  ✦ minhas conquistas
                </div>

                {/* Stats inline (topo do sheet) */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatPill
                    emoji="📚"
                    value={stats.lessons_completed_count}
                    label="aulas"
                  />
                  <StatPill
                    emoji="🎯"
                    value={stats.proofs_approved_count}
                    label={
                      stats.proofs_approved_count === 1 ? "prova" : "provas"
                    }
                  />
                  <StatPill
                    emoji="🏆"
                    value={stats.badges.length}
                    label={stats.badges.length === 1 ? "selo" : "selos"}
                  />
                </div>

                {/* Grid de distintivos */}
                {stats.badges.length > 0 && (
                  <div className="mt-5 grid grid-cols-3 md:grid-cols-4 gap-3">
                    {stats.badges.map((b) => (
                      <BadgeChip key={b.slug} badge={b} />
                    ))}
                  </div>
                )}

                {stats.badges.length === 0 && (
                  <p className="mt-4 text-[12.5px] text-spark-ink-50 leading-snug">
                    Complete aulas, poste comentários e envie a prova pra
                    desbloquear seus primeiros selos 💕
                  </p>
                )}
              </div>
          </div>
        )}
      </main>

      {/* Level up animation */}
      {levelUp && (
        <LevelUpAnimation
          fromStage={levelUp.from}
          toStage={levelUp.to}
          onDismiss={() => setLevelUp(null)}
        />
      )}
    </div>
  );
}

function StickyHeader({
  xpTotal,
  stage,
  isAdmin,
}: {
  xpTotal?: number | null;
  stage?: CharacterStage;
  isAdmin?: boolean;
} = {}) {
  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-white/40">
      <div className="flex items-center justify-between gap-2 px-4 h-14 max-w-[520px] mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            aria-label="Voltar pra home"
            className="shrink-0 w-11 h-11 -ml-2 flex items-center justify-center text-spark-ink-70 hover:text-spark-ink active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="font-display text-[15px] text-spark-ink truncate">
              Jornadas
            </h1>
            {isAdmin && (
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-orange-600">
                ⚡ Preview admin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {xpTotal !== null && xpTotal !== undefined && stage && (
            <div
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-spark-surface border border-spark-hairline text-[12px] font-extrabold text-spark-ink shadow-rest"
              aria-label={`${xpTotal} XP total`}
            >
              <span className="text-base leading-none">{STAGE_EMOJI[stage]}</span>
              <span className="tabular-nums">{xpTotal}</span>
              <span className="text-spark-brand-deep">XP</span>
            </div>
          )}
          <NotificationFeed />
        </div>
      </div>
    </header>
  );
}

// =================================================================
// CONQUISTAS — StatPill + BadgeChip
// =================================================================

// Emoji por slug — visual proprio pra cada selo (fallback ✨).
const BADGE_EMOJI: Record<string, string> = {
  iniciante: "🌱",
  criadora: "🎨",
  consistente: "💪",
  afiliada: "🤝",
  vendedora: "💰",
  "elite-tts": "⭐️",
  "primeira-aula": "📖",
  "primeira-jornada": "🎯",
  trilogia: "👑",
  "primeira-venda": "🎉",
  "vendedora-100": "💯",
  "vendedora-1000": "🏆",
  comentarista: "💬",
  popular: "❤️",
  madrugadora: "🌅",
  coruja: "🌙",
  maratonista: "🏃‍♀️",
  "streak-7-dias": "🔥",
  adolescente: "👧",
  adulta: "🙋‍♀️",
  pioneira: "🚀",
};

const RARITY_STYLES: Record<
  string,
  { bg: string; border: string; label: string; labelColor: string }
> = {
  common: {
    bg: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    border: "#d1d5db",
    label: "Comum",
    labelColor: "#6b7280",
  },
  rare: {
    bg: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)",
    border: "#3b82f6",
    label: "Raro",
    labelColor: "#1e40af",
  },
  epic: {
    bg: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)",
    border: "#8b5cf6",
    label: "Épico",
    labelColor: "#5b21b6",
  },
  legendary: {
    bg: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)",
    border: "#d97706",
    label: "Lendário",
    labelColor: "#92400e",
  },
};

function StatPill({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-spark-xl bg-spark-surface-sunken/70 border border-spark-hairline px-3 py-2.5 text-center">
      <div className="text-[20px] leading-none mb-1">{emoji}</div>
      <div className="font-display text-[22px] leading-none text-spark-ink tabular-nums">
        {value}
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-spark-ink-50 mt-1">
        {label}
      </div>
    </div>
  );
}

function BadgeChip({
  badge,
}: {
  badge: {
    slug: string;
    title: string;
    description: string | null;
    icon_url: string | null;
    rarity: string;
  };
}) {
  const emoji = BADGE_EMOJI[badge.slug] ?? "✨";
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;

  return (
    <div
      className="rounded-spark-xl border-2 p-2.5 text-center shadow-rest transition-transform hover:scale-105 active:scale-95"
      style={{
        background: style.bg,
        borderColor: style.border,
      }}
      title={badge.description ?? undefined}
    >
      <div
        className="mx-auto mb-1 w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center text-[26px] shadow-lift"
        aria-hidden
      >
        {badge.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.icon_url}
            alt=""
            className="w-8 h-8"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          emoji
        )}
      </div>
      <div
        className="text-[11px] font-extrabold leading-tight line-clamp-2"
        style={{ color: style.labelColor }}
      >
        {badge.title}
      </div>
      <div
        className="text-[8.5px] font-extrabold uppercase tracking-[0.15em] mt-0.5 opacity-75"
        style={{ color: style.labelColor }}
      >
        {style.label}
      </div>
    </div>
  );
}
