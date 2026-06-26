"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { JourneyStoryDeck } from "@/components/journey/JourneyStoryDeck";
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

type ApiResp = {
  journey: Journey;
  lessons: Lesson[];
  progress: { xp_total: number; status: string } | null;
  proof: { status: string } | null;
  stats: {
    total_lessons: number;
    completed_lessons: number;
    pct_complete: number;
    all_lessons_complete: boolean;
  };
};

export default function JornadaDetailPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void fetch(`/api/jornadas/${params.slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, [params.slug]);

  // Trava scroll do body enquanto deck mounted (deck eh fixed, evita pull-to-refresh)
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
      <div className="min-h-dvh flex items-center justify-center text-spark-ink-50">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!data || !data.journey) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Jornada não encontrada.</p>
        <Link href="/jornadas" className="mt-4 text-spark-brand-deep underline">
          Voltar
        </Link>
      </div>
    );
  }

  const { journey, lessons, stats, proof, progress } = data;

  // Calcula current lesson (primeira nao-completed e nao-locked)
  const currentLessonIdx = lessons.findIndex((l) => !l.completed && !l.locked);

  // Calcula status da prova final
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
    />
  );
}
