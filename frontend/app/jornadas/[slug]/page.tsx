"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { JourneyStoryDeck } from "@/components/journey/JourneyStoryDeck";
import { JourneyHeroBar } from "@/components/journey/JourneyHeroBar";
import { ModuleCard } from "@/components/journey/ModuleCard";
import { ProofFinalCard } from "@/components/journey/ProofFinalCard";
import { JourneyImmersiveBG } from "@/components/journey/JourneyImmersiveBG";
import { JourneyLoadingScreen } from "@/components/journey/JourneyLoadingScreen";
import type { CharacterStage } from "@/lib/journey/character-stage";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  order_index: number;
  xp_reward: number;
  requires_proof: boolean;
  completed: boolean;
  locked: boolean;
  module_id: string | null;
};

type Module = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  week_number: number | null;
  order_index: number;
  lesson_count: number;
  lessons_completed: number;
  pct_complete: number;
  all_complete: boolean;
  locked: boolean;
};

type Journey = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  character_stage: CharacterStage;
  character_name: string | null;
};

type ApiResp = {
  journey: Journey;
  modules: Module[];
  lessons: Lesson[];
  progress: { xp_total: number; status: string } | null;
  proof: { status: string } | null;
  stats: {
    total_lessons: number;
    completed_lessons: number;
    pct_complete: number;
    all_lessons_complete: boolean;
    module_count: number;
    modules_completed: number;
    all_modules_complete: boolean;
  };
};

export default function JornadaDetailPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void fetch(`/api/jornadas/${params.slug}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((j: ApiResp) => setData(j))
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <JourneyLoadingScreen />;
  }

  if (errored || !data || !data.journey) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Jornada não encontrada.</p>
        <Link href="/jornadas" className="mt-4 text-spark-brand-deep underline">
          Voltar
        </Link>
      </div>
    );
  }

  const { journey, modules, lessons, stats, proof, progress } = data;

  // Fallback legacy: jornada sem modulos cai no Story Deck antigo (flat)
  if (modules.length === 0) {
    return <LegacyDeckFallback data={data} />;
  }

  // currentModuleIdx = primeiro modulo nao-completed e nao-locked
  const currentModuleIdx = modules.findIndex(
    (m) => !m.all_complete && !m.locked,
  );

  // Status da prova final
  const proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready" =
    proof?.status === "approved" || proof?.status === "auto_approved"
      ? "approved"
      : proof?.status === "pending"
        ? "pending"
        : proof?.status === "rejected"
          ? "rejected"
          : stats.all_modules_complete
            ? "ready"
            : "locked";

  return (
    <div className="min-h-dvh pb-12 relative">
      <JourneyImmersiveBG
        stage={journey.character_stage}
        intensity="medium"
        fixed
      />
      <JourneyHeroBar
        journey={journey}
        modulesCompleted={stats.modules_completed}
        totalModules={stats.module_count}
        lessonsCompleted={stats.completed_lessons}
        totalLessons={stats.total_lessons}
        xpTotal={progress?.xp_total ?? 0}
      />

      <main className="max-w-[520px] mx-auto px-4 pt-4">
        {journey.subtitle && (
          <p
            className="text-[13.5px] text-white/95 mb-4 leading-snug"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.45)" }}
          >
            {journey.subtitle}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {modules.map((m, idx) => (
            <ModuleCard
              key={m.id}
              module={m}
              journeySlug={params.slug as string}
              index={idx + 1}
              isCurrent={idx === currentModuleIdx}
            />
          ))}

          <ProofFinalCard
            journeySlug={params.slug as string}
            proofStatus={proofStatus}
            modulesCompleted={stats.modules_completed}
            totalModules={stats.module_count}
          />
        </div>

        {lessons.length === 0 && modules.length > 0 && (
          <div className="mt-6 text-center text-spark-ink-50 text-[13px]">
            Aulas chegando — admin esta preparando.
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Fallback: jornada legacy SEM modulos (J2/J3 ate Yara estrutura).
 * Renderiza o Story Deck fullscreen flat (comportamento pre-batch 2).
 */
function LegacyDeckFallback({ data }: { data: ApiResp }) {
  // Trava scroll body enquanto deck mounted (fixed inset-0)
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { journey, lessons, stats, proof, progress } = data;
  const currentLessonIdx = lessons.findIndex((l) => !l.completed && !l.locked);
  const proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready" =
    proof?.status === "approved" || proof?.status === "auto_approved"
      ? "approved"
      : proof?.status === "pending"
        ? "pending"
        : proof?.status === "rejected"
          ? "rejected"
          : stats.all_lessons_complete
            ? "ready"
            : "locked";

  return (
    <JourneyStoryDeck
      journey={journey}
      lessons={lessons}
      xpTotal={progress?.xp_total ?? 0}
      proofStatus={proofStatus}
      currentLessonIdx={currentLessonIdx < 0 ? lessons.length : currentLessonIdx}
      backHref="/jornadas"
      backLabel="Voltar pra Jornadas"
    />
  );
}
