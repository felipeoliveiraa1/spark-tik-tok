"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { JourneyStoryDeck } from "@/components/journey/JourneyStoryDeck";
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
};

type Journey = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  character_stage: CharacterStage;
  character_name: string | null;
};

type ModuleResp = {
  journey: Journey;
  module: {
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
  lessons: Lesson[];
  prev_module: { id: string; slug: string; title: string } | null;
  next_module: { id: string; slug: string; title: string } | null;
  progress: { xp_total: number; status: string } | null;
  proof: { status: string } | null;
};

export default function ModuloPage() {
  const params = useParams<{ slug: string; moduleSlug: string }>();
  const router = useRouter();
  const [data, setData] = React.useState<ModuleResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    void fetch(
      `/api/jornadas/${params.slug}/modulo/${params.moduleSlug}`,
      { cache: "no-store" },
    )
      .then((r) => {
        if (r.status === 403) {
          // Modulo bloqueado pelo gate inter-modulo — volta pro hub da jornada
          router.replace(`/jornadas/${params.slug}`);
          return null;
        }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((j: ModuleResp | null) => {
        if (j) setData(j);
      })
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, [params.slug, params.moduleSlug, router]);

  // Trava scroll do body enquanto deck mounted (fixed inset-0)
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (loading) {
    return (
      <JourneyLoadingScreen />
    );
  }

  if (errored || !data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Módulo não encontrado.</p>
        <Link
          href={`/jornadas/${params.slug}`}
          className="mt-4 text-spark-brand-deep underline"
        >
          Voltar pra jornada
        </Link>
      </div>
    );
  }

  const { journey, module: mod, lessons, progress } = data;

  // Modulo bloqueado pelo gate inter-modulo — redireciona pro hub (early return
  // protege contra navegacao direta via URL)
  if (mod.locked) {
    router.replace(`/jornadas/${params.slug}`);
    return (
      <JourneyLoadingScreen />
    );
  }

  // currentLessonIdx = primeira nao-completed/nao-locked do modulo
  const currentLessonIdx = lessons.findIndex((l) => !l.completed && !l.locked);

  return (
    <JourneyStoryDeck
      journey={journey}
      lessons={lessons}
      xpTotal={progress?.xp_total ?? 0}
      proofStatus="locked"
      currentLessonIdx={currentLessonIdx < 0 ? lessons.length - 1 : currentLessonIdx}
      showProofCard={false}
      backHref={`/jornadas/${params.slug}`}
      backLabel={`Voltar pra ${journey.title}`}
      topbarLabelTemplate={({ idx, total }) =>
        total === 0
          ? mod.title
          : `${mod.title} · Aula ${Math.min(idx + 1, total)} de ${total}`
      }
    />
  );
}
