"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Lock, ChevronRight, Sparkles } from "lucide-react";
import { JourneyCharacter } from "@/components/journey/JourneyCharacter";
import { XPBar } from "@/components/journey/XPBar";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { STAGE_EMOJI } from "@/lib/journey/character-stage";
import { useJourneyStats } from "@/lib/journey/useJourneyStats";
import { cn } from "@/lib/cn";

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

export default function JornadasPage() {
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { stats } = useJourneyStats();

  React.useEffect(() => {
    void fetch("/api/jornadas", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-dvh hero-radial pb-20">
      {/* Header com personagem */}
      <header className="px-6 pt-8 pb-6 text-center">
        <div className="text-eyebrow text-spark-brand-deep">Jornadas Método TTS</div>
        <h1 className="font-display text-[34px] md:text-[44px] text-spark-ink mt-1 leading-tight">
          Sua aventura
        </h1>
        <div className="mt-4 flex justify-center">
          <JourneyCharacter stage={data.me.character_stage} size={120} showLabel />
        </div>
        <p className="text-spark-ink-70 text-[14px] mt-3 max-w-[44ch] mx-auto">
          Complete aulas, prove suas vendas e evolua de bebê pra adulta no TikTok Shop.
        </p>
        {stats && (
          <div className="mt-4 flex justify-center">
            <XPBar xpTotal={stats.xp_total} stage={data.me.character_stage} />
          </div>
        )}
        {data.me.is_admin && (
          <div className="mt-3 inline-block px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10.5px] font-extrabold uppercase tracking-wide">
            ⚡ Preview admin
          </div>
        )}
      </header>

      {/* Cards jornadas */}
      <div className="px-6 max-w-[920px] mx-auto space-y-4">
        {data.journeys.map((j, idx) => {
          const isCompleted = j.progress?.status === "completed";
          const isInProgress = j.progress && !isCompleted;
          const isLocked = idx > 0 && data.journeys[idx - 1]?.progress?.status !== "completed";

          return (
            <Link
              key={j.id}
              href={isLocked && !data.me.is_admin ? "#" : `/jornadas/${j.slug}`}
              className={cn(
                "block rounded-spark-xl border-2 p-5 transition-all duration-300",
                isLocked && !data.me.is_admin
                  ? "border-spark-hairline bg-spark-surface-sunken opacity-60 cursor-not-allowed"
                  : "border-spark-hairline bg-spark-surface hover:border-spark-brand/40 hover:-translate-y-0.5 shadow-rest",
              )}
              style={
                isCompleted
                  ? {
                      borderColor: j.hero_color_a ?? "#fdb4c2",
                      background: `linear-gradient(135deg, ${j.hero_color_a ?? "#fdb4c2"}11, ${j.hero_color_b ?? "#ffd6a8"}11)`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl shrink-0" style={{ lineHeight: 1 }}>
                  {STAGE_EMOJI[j.character_stage]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-eyebrow text-spark-brand">Jornada {idx + 1}</div>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase">
                        concluída
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-extrabold uppercase">
                        em andamento
                      </span>
                    )}
                    {isLocked && !data.me.is_admin && (
                      <Lock size={12} className="text-spark-ink-35" />
                    )}
                  </div>
                  <h3 className="font-display text-[20px] md:text-[24px] text-spark-ink leading-tight">
                    {j.title}
                  </h3>
                  {j.subtitle && (
                    <p className="text-[13px] text-spark-ink-70 mt-0.5">{j.subtitle}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[12px] text-spark-ink-50">
                    <span>📚 {j.lesson_count} aulas</span>
                    {j.lessons_completed > 0 && (
                      <span className="font-extrabold text-spark-brand-deep">
                        {j.pct_complete}% completo
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {j.lesson_count > 0 && (
                    <div className="mt-2 h-1.5 bg-spark-ink-10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-grad transition-all duration-500"
                        style={{ width: `${j.pct_complete}%` }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="text-spark-ink-35 shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
