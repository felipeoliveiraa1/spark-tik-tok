"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Lock, CheckCircle2, Camera, ChevronRight } from "lucide-react";
import { JourneyCharacter } from "@/components/journey/JourneyCharacter";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

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
  description: string | null;
  character_stage: CharacterStage;
  character_name: string | null;
  is_admin_only: boolean;
};

type ApiResp = {
  journey: Journey;
  lessons: Lesson[];
  progress: { xp_total: number; status: string } | null;
  proof: { status: string; created_at: string } | null;
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

  const { journey, lessons, stats, proof } = data;
  const proofPending = proof && proof.status === "pending";
  const proofApproved = proof && (proof.status === "approved" || proof.status === "auto_approved");
  const proofRejected = proof && proof.status === "rejected";

  return (
    <div className="min-h-dvh pb-20" style={{
      background: journey ? `linear-gradient(180deg, ${journey.character_stage === "bebe" ? "#fff0f3" : journey.character_stage === "adolescente" ? "#f5edff" : "#fff6ec"} 0%, var(--spark-bg) 50%)` : undefined,
    }}>
      <header className="px-6 pt-6 pb-4 max-w-[920px] mx-auto">
        <Link
          href="/jornadas"
          className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> Jornadas
        </Link>
      </header>

      <div className="px-6 max-w-[920px] mx-auto">
        {/* Hero */}
        <div className="text-center py-6">
          <JourneyCharacter stage={journey.character_stage} size={100} />
          <h1 className="font-display text-[28px] md:text-[36px] text-spark-ink mt-3 leading-tight">
            {journey.title}
          </h1>
          {journey.subtitle && (
            <p className="text-spark-ink-70 mt-1">{journey.subtitle}</p>
          )}
          {journey.description && (
            <p className="text-[13px] text-spark-ink-70 mt-4 max-w-[50ch] mx-auto">
              {journey.description}
            </p>
          )}
          {/* Stats */}
          <div className="mt-6 inline-flex items-center gap-4 px-4 py-2 rounded-full bg-spark-surface border border-spark-hairline">
            <span className="text-[12.5px] font-extrabold text-spark-ink-70">
              {stats.completed_lessons} / {stats.total_lessons} aulas
            </span>
            <span className="text-spark-ink-35">·</span>
            <span className="text-[12.5px] font-extrabold text-spark-brand-deep">
              {stats.pct_complete}%
            </span>
          </div>
        </div>

        {/* Lista de aulas */}
        <div className="mt-6 space-y-2">
          {lessons.map((l, idx) => (
            <LessonRow key={l.id} journey={journey} lesson={l} index={idx + 1} />
          ))}
        </div>

        {/* Bloco de prova */}
        {stats.all_lessons_complete && (
          <div className="mt-8 rounded-spark-xl border-2 border-spark-brand/30 bg-spark-brand-soft/30 p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-display text-[24px] text-spark-ink">Hora da prova!</h3>
            <p className="text-[13.5px] text-spark-ink-70 mt-2 max-w-[44ch] mx-auto">
              Você completou todas as aulas. Agora envie um print do seu TikTok Shop
              mostrando suas vendas pra desbloquear a próxima jornada.
            </p>

            {!proof && (
              <Link
                href={`/jornadas/${journey.slug}/prova`}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all"
              >
                <Camera size={14} />
                Enviar print do TikTok
              </Link>
            )}

            {proofPending && (
              <div className="mt-4 inline-block px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-[12.5px] font-extrabold">
                ⏳ Prova em análise — em até 24h
              </div>
            )}

            {proofApproved && (
              <div className="mt-4 inline-block px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12.5px] font-extrabold">
                ✅ Prova aprovada — bora pra próxima jornada!
              </div>
            )}

            {proofRejected && (
              <>
                <div className="mt-4 inline-block px-4 py-2 rounded-full bg-red-50 border border-red-200 text-red-700 text-[12.5px] font-extrabold">
                  ❌ Prova rejeitada
                </div>
                <Link
                  href={`/jornadas/${journey.slug}/prova`}
                  className="block mt-3 text-spark-brand-deep underline text-[13px]"
                >
                  Tentar de novo
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  journey,
  lesson,
  index,
}: {
  journey: Journey;
  lesson: Lesson;
  index: number;
}) {
  const disabled = lesson.locked;
  return (
    <Link
      href={disabled ? "#" : `/jornadas/${journey.slug}/aula/${lesson.slug}`}
      className={cn(
        "block rounded-spark-lg border p-4 flex items-center gap-3 transition-all",
        disabled
          ? "bg-spark-surface-sunken/50 border-spark-hairline opacity-50 cursor-not-allowed"
          : lesson.completed
            ? "bg-emerald-50/40 border-emerald-200 hover:-translate-y-0.5"
            : "bg-spark-surface border-spark-hairline hover:border-spark-brand/40 hover:-translate-y-0.5",
      )}
    >
      <span className="text-[11px] font-mono text-spark-ink-50 w-7 text-center">
        #{index}
      </span>
      {lesson.completed ? (
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
      ) : disabled ? (
        <Lock size={18} className="text-spark-ink-35 shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-spark-brand shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-spark-ink text-[14px]">{lesson.title}</div>
        {lesson.description && (
          <div className="text-[12px] text-spark-ink-50 mt-0.5 line-clamp-1">
            {lesson.description}
          </div>
        )}
      </div>
      <div className="text-[11px] text-spark-ink-50 shrink-0">+{lesson.xp_reward} XP</div>
      <ChevronRight size={16} className="text-spark-ink-35 shrink-0" />
    </Link>
  );
}
