"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, PlayCircle, ChevronRight } from "lucide-react";
import { NotificationFeed } from "@/components/journey/NotificationFeed";
import { JourneyImmersiveBG } from "@/components/journey/JourneyImmersiveBG";
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-dvh relative">
        <JourneyImmersiveBG stage="bebe" intensity="medium" fixed />
        <StickyHeader />
        <div className="px-4 max-w-[520px] mx-auto flex flex-col gap-4 pt-3">
          <div className="h-[72px] rounded-spark-xl skeleton-shimmer" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] w-full rounded-spark-xl skeleton-shimmer"
            />
          ))}
        </div>
      </div>
    );
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
            className="mx-4 mt-3 flex items-center gap-3 h-[72px] px-4 rounded-spark-xl bg-gradient-to-r from-spark-brand/15 to-spark-brand/5 border border-spark-brand/40 active:scale-[0.98] transition-transform"
          >
            <PlayCircle
              size={28}
              className="text-spark-brand-deep shrink-0"
              strokeWidth={2.2}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-spark-brand-deep">
                Continuar
              </div>
              <div className="font-display text-[15px] text-spark-ink truncate">
                {currentJourney.title}
                {currentJourney.pct_complete > 0 && (
                  <span className="text-spark-ink-50 font-normal ml-1.5 text-[12.5px]">
                    · {Math.round(currentJourney.pct_complete)}%
                  </span>
                )}
              </div>
            </div>
            <ChevronRight
              size={20}
              className="text-spark-brand-deep shrink-0"
            />
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

        {/* Stats inline (oculta se aluna ainda nao fez nada) */}
        {stats &&
          (stats.lessons_completed_count > 0 ||
            stats.proofs_approved_count > 0 ||
            stats.badges.length > 0) && (
            <div className="px-4 mt-6 flex items-center justify-center gap-4 text-[13px] font-bold text-spark-ink-70 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                📚 {stats.lessons_completed_count} aulas
              </span>
              <span className="inline-flex items-center gap-1.5">
                🎯 {stats.proofs_approved_count} provas
              </span>
              <span className="inline-flex items-center gap-1.5">
                🏆 {stats.badges.length} badges
              </span>
            </div>
          )}

        {/* Badges scroll horizontal — so se houver */}
        {stats && stats.badges.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-spark-brand-deep mb-2 px-4">
              Suas conquistas ({stats.badges.length})
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-2 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none" }}
            >
              {stats.badges.map((b) => (
                <div
                  key={b.slug}
                  className="snap-start shrink-0 max-w-[160px] px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline text-[11.5px] font-extrabold inline-flex items-center gap-1.5"
                  title={b.description ?? undefined}
                >
                  {b.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.icon_url}
                      alt=""
                      className="w-4 h-4 shrink-0"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <span>✨</span>
                  )}
                  <span className="truncate">{b.title}</span>
                </div>
              ))}
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
