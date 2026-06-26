"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { XPBar } from "@/components/journey/XPBar";
import { NotificationFeed } from "@/components/journey/NotificationFeed";
import { LevelUpAnimation } from "@/components/journey/LevelUpAnimation";
import { WorldMap } from "@/components/journey/WorldMap";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { CHARACTER_STAGES } from "@/lib/journey/character-stage";
import { useJourneyStats } from "@/lib/journey/useJourneyStats";

type JourneyCard = {
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
  journeys: JourneyCard[];
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
  const [levelUp, setLevelUp] = React.useState<{
    from: CharacterStage;
    to: CharacterStage;
  } | null>(null);
  const { stats } = useJourneyStats();

  React.useEffect(() => {
    void fetch("/api/jornadas", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-spark-ink-50">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!data || data.journeys.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 text-center">
        <Sparkles size={32} className="text-spark-ink-35 mb-3" />
        <h2 className="font-display text-[24px] text-spark-ink">Em breve</h2>
        <p className="text-spark-ink-70 mt-2 max-w-[40ch]">
          As Jornadas chegam em breve. Aguarde!
        </p>
      </div>
    );
  }

  // Marca current_journey (primeira nao-completed e nao-locked)
  let currentIdx = -1;
  const enrichedJourneys = data.journeys.map((j, idx) => {
    const isCompleted = j.progress?.status === "completed";
    const isLocked = idx > 0 && data.journeys[idx - 1]?.progress?.status !== "completed";
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

  return (
    <div className="min-h-dvh bg-spark-bg pb-12">
      {/* Top bar */}
      <div className="px-4 md:px-6 pt-4 flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-1">
          <div className="text-eyebrow text-spark-brand-deep">
            Jornadas Método TTS
          </div>
          {data.me.is_admin && (
            <span className="self-start px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-extrabold uppercase tracking-wide">
              ⚡ Preview admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <XPBar xpTotal={stats.xp_total} stage={data.me.character_stage} />
          )}
          <NotificationFeed />
        </div>
      </div>

      {/* Title */}
      <header className="px-4 md:px-6 pt-4 pb-3 text-center max-w-[920px] mx-auto">
        <h1 className="font-display text-[28px] md:text-[40px] text-spark-ink leading-tight">
          Sua aventura no <span className="text-grad-brand">TikTok Shop</span>
        </h1>
        <p className="text-spark-ink-70 text-[13px] md:text-[14px] mt-2 max-w-[44ch] mx-auto">
          Complete aulas, prove vendas reais e evolua de bebê pra adulta no jogo.
        </p>
      </header>

      {/* World map fullscreen */}
      <div className="px-4 md:px-6 max-w-[1200px] mx-auto">
        <WorldMap
          journeys={enrichedJourneys}
          characterStage={data.me.character_stage}
          isAdmin={data.me.is_admin}
        />
      </div>

      {/* Stats abaixo do mapa */}
      <div className="px-4 md:px-6 max-w-[920px] mx-auto mt-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Aulas"
            value={stats?.lessons_completed_count ?? 0}
            emoji="📚"
          />
          <StatCard
            label="Provas"
            value={stats?.proofs_approved_count ?? 0}
            emoji="🎯"
          />
          <StatCard
            label="Badges"
            value={stats?.badges.length ?? 0}
            emoji="🏆"
          />
        </div>
      </div>

      {/* Badges recentes (se houver) */}
      {stats && stats.badges.length > 0 && (
        <div className="px-4 md:px-6 max-w-[920px] mx-auto mt-6">
          <div className="text-eyebrow text-spark-brand-deep mb-3">
            🏆 Suas conquistas
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.badges.slice(0, 8).map((b) => (
              <div
                key={b.slug}
                className="px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline text-[11.5px] font-extrabold inline-flex items-center gap-1.5"
                title={b.description ?? undefined}
              >
                {b.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.icon_url}
                    alt=""
                    className="w-4 h-4"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span>✨</span>
                )}
                {b.title}
              </div>
            ))}
            {stats.badges.length > 8 && (
              <span className="px-3 py-1.5 text-[11.5px] text-spark-ink-50">
                +{stats.badges.length - 8} mais
              </span>
            )}
          </div>
        </div>
      )}

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

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number;
  emoji: string;
}) {
  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface px-4 py-3 text-center">
      <div className="text-2xl mb-1" style={{ lineHeight: 1 }}>
        {emoji}
      </div>
      <div className="font-display text-[24px] leading-none text-spark-ink">
        {value}
      </div>
      <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-spark-ink-50 mt-1">
        {label}
      </div>
    </div>
  );
}
