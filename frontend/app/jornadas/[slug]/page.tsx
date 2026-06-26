"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Camera,
  Trophy,
} from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import { XPBar } from "@/components/journey/XPBar";
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

const STAGE_BG: Record<CharacterStage, string> = {
  bebe: "from-rose-100 via-pink-50 to-orange-50",
  adolescente: "from-purple-100 via-pink-50 to-rose-50",
  adulta: "from-orange-100 via-amber-50 to-rose-50",
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
  const currentLessonIdx = lessons.findIndex((l) => !l.completed && !l.locked);
  const proofPending = proof && proof.status === "pending";
  const proofApproved = proof && (proof.status === "approved" || proof.status === "auto_approved");
  const proofRejected = proof && proof.status === "rejected";
  const proofUnlocked = stats.all_lessons_complete;

  return (
    <div
      className={cn(
        "min-h-dvh pb-20 bg-gradient-to-b",
        STAGE_BG[journey.character_stage],
      )}
    >
      {/* Top bar — minimalista */}
      <header className="px-4 md:px-6 pt-4 pb-3 max-w-[600px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/jornadas"
          className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> Jornadas
        </Link>
        {data.progress && (
          <XPBar
            xpTotal={data.progress.xp_total ?? 0}
            stage={journey.character_stage}
          />
        )}
      </header>

      {/* Titulo simples */}
      <div className="px-4 md:px-6 max-w-[600px] mx-auto text-center mt-2 mb-4">
        <div className="text-eyebrow text-spark-brand-deep">
          Jornada · {journey.character_name ?? "aventura"}
        </div>
        <h1 className="font-display text-[24px] md:text-[32px] text-spark-ink leading-tight mt-1">
          {journey.title}
        </h1>
        <div className="mt-2 inline-flex items-center gap-3 px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-spark-hairline text-[12px] font-extrabold">
          <span className="text-spark-ink-70">
            {stats.completed_lessons}/{stats.total_lessons} aulas
          </span>
          <span className="text-spark-ink-35">·</span>
          <span className="text-spark-brand-deep">{stats.pct_complete}%</span>
        </div>
      </div>

      {/* CAMINHO vertical zigzag */}
      <div className="px-4 md:px-6 max-w-[420px] mx-auto">
        <Trail
          lessons={lessons}
          journey={journey}
          currentLessonIdx={currentLessonIdx}
          proofUnlocked={proofUnlocked}
          proofPending={!!proofPending}
          proofApproved={!!proofApproved}
          proofRejected={!!proofRejected}
        />
      </div>
    </div>
  );
}

function Trail({
  lessons,
  journey,
  currentLessonIdx,
  proofUnlocked,
  proofPending,
  proofApproved,
  proofRejected,
}: {
  lessons: Lesson[];
  journey: Journey;
  currentLessonIdx: number;
  proofUnlocked: boolean;
  proofPending: boolean;
  proofApproved: boolean;
  proofRejected: boolean;
}) {
  // Layout zigzag: aulas alternam left -> center -> right -> center -> left
  const POSITIONS = ["left", "center", "right", "center"] as const;
  return (
    <div className="relative py-8">
      {lessons.map((lesson, idx) => {
        const align = POSITIONS[idx % POSITIONS.length]!;
        const isCurrent = idx === currentLessonIdx;
        const isLast = idx === lessons.length - 1;
        return (
          <CheckpointRow
            key={lesson.id}
            lesson={lesson}
            journey={journey}
            index={idx + 1}
            align={align}
            isCurrent={isCurrent}
            isLast={isLast && !proofUnlocked}
          />
        );
      })}

      {/* Prova final no topo do caminho (depois de TODAS as aulas) */}
      <ProofCheckpoint
        journey={journey}
        align={POSITIONS[lessons.length % POSITIONS.length]!}
        unlocked={proofUnlocked}
        proofPending={proofPending}
        proofApproved={proofApproved}
        proofRejected={proofRejected}
        hasAnyLessons={lessons.length > 0}
      />
    </div>
  );
}

function CheckpointRow({
  lesson,
  journey,
  index,
  align,
  isCurrent,
  isLast,
}: {
  lesson: Lesson;
  journey: Journey;
  index: number;
  align: "left" | "center" | "right";
  isCurrent: boolean;
  isLast: boolean;
}) {
  const disabled = lesson.locked;
  const alignmentClass = {
    left: "items-start pl-4",
    center: "items-center",
    right: "items-end pr-4",
  }[align];

  return (
    <div className="relative">
      {/* Linha vertical conectando ao proximo (se nao for o ultimo) */}
      {!isLast && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 bg-spark-ink-10"
          style={{
            top: "60%",
            height: "80px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--spark-brand-soft, #ffd1dd) 0 6px, transparent 6px 12px)",
          }}
          aria-hidden
        />
      )}

      <div className={cn("relative flex flex-col mb-[60px]", alignmentClass)}>
        <Link
          href={disabled ? "#" : `/jornadas/${journey.slug}/aula/${lesson.slug}`}
          aria-label={`Aula ${index}: ${lesson.title}${lesson.completed ? " (concluída)" : lesson.locked ? " (bloqueada)" : ""}`}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "group relative inline-block",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {/* Halo pulsante no atual */}
          {isCurrent && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark-brand"
              style={{
                width: "100px",
                height: "100px",
                opacity: 0.3,
                animation: "trail-pulse 2s ease-in-out infinite",
              }}
              aria-hidden
            />
          )}

          {/* Personagem em cima do checkpoint atual */}
          {isCurrent && (
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: "calc(100% - 12px)",
                left: "50%",
                transform: "translateX(-50%)",
                animation: "trail-char-float 3s ease-in-out infinite",
              }}
            >
              <CharacterSprite
                stage={journey.character_stage}
                anim="idle"
                scale={1.3}
              />
            </div>
          )}

          {/* Checkpoint ball */}
          <div
            className={cn(
              "relative w-20 h-20 md:w-24 md:h-24 rounded-full border-[5px] flex items-center justify-center font-display text-[24px] md:text-[28px] shadow-lift transition-all duration-300",
              lesson.completed
                ? "bg-emerald-500 border-white text-white"
                : lesson.locked
                  ? "bg-spark-ink/50 border-white/60 text-white/80"
                  : isCurrent
                    ? "bg-white border-spark-brand text-spark-brand-deep group-hover:scale-110"
                    : "bg-white border-spark-hairline text-spark-ink-70 group-hover:scale-110 group-hover:border-spark-brand/40",
            )}
          >
            {lesson.completed ? (
              <CheckCircle2 size={32} strokeWidth={3} />
            ) : lesson.locked ? (
              <Lock size={24} strokeWidth={2.5} />
            ) : (
              index
            )}
          </div>
        </Link>

        {/* Titulo embaixo do checkpoint */}
        <div className="mt-2 text-center max-w-[180px]">
          <div
            className={cn(
              "text-[13px] md:text-[14px] font-extrabold leading-tight",
              disabled ? "text-spark-ink-35" : "text-spark-ink",
            )}
          >
            {lesson.title}
          </div>
          {!disabled && (
            <div className="text-[10.5px] text-spark-ink-50 font-mono mt-0.5">
              +{lesson.xp_reward} XP
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes trail-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes trail-char-float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function ProofCheckpoint({
  journey,
  align,
  unlocked,
  proofPending,
  proofApproved,
  proofRejected,
  hasAnyLessons,
}: {
  journey: Journey;
  align: "left" | "center" | "right";
  unlocked: boolean;
  proofPending: boolean;
  proofApproved: boolean;
  proofRejected: boolean;
  hasAnyLessons: boolean;
}) {
  const alignmentClass = {
    left: "items-start pl-4",
    center: "items-center",
    right: "items-end pr-4",
  }[align];

  const disabled = !unlocked;

  const statusLabel = proofApproved
    ? "✅ Aprovada"
    : proofPending
      ? "⏳ Em análise"
      : proofRejected
        ? "❌ Rejeitada"
        : unlocked
          ? "Tesouro liberado!"
          : "Complete as aulas";

  return (
    <div className="relative">
      {/* Linha de conexao se houver aulas antes */}
      {hasAnyLessons && (
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 -top-[80px] h-[80px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--spark-brand-soft, #ffd1dd) 0 6px, transparent 6px 12px)",
          }}
          aria-hidden
        />
      )}

      <div className={cn("relative flex flex-col", alignmentClass)}>
        <Link
          href={disabled ? "#" : `/jornadas/${journey.slug}/prova`}
          aria-label={`Prova final — ${statusLabel}`}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "group relative inline-block",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {/* Halo grande dourado se unlocked + sem prova ainda */}
          {unlocked && !proofPending && !proofApproved && !proofRejected && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
              style={{
                width: "130px",
                height: "130px",
                opacity: 0.4,
                animation: "treasure-pulse 1.8s ease-in-out infinite",
              }}
              aria-hidden
            />
          )}

          {/* Sparkles em volta se unlocked */}
          {unlocked && !proofApproved && (
            <>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-amber-400"
                  style={{
                    top: `${20 + (i % 3) * 30}%`,
                    left: `${(i * 53) % 100}%`,
                    fontSize: "14px",
                    animation: `treasure-sparkle 1.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                  aria-hidden
                >
                  ✨
                </div>
              ))}
            </>
          )}

          {/* Tesouro */}
          <div
            className={cn(
              "relative w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex items-center justify-center shadow-lift transition-all duration-300",
              proofApproved
                ? "bg-emerald-500 border-white"
                : disabled
                  ? "bg-spark-ink/50 border-white/60"
                  : "bg-gradient-to-br from-amber-400 to-orange-500 border-white group-hover:scale-110",
            )}
          >
            {proofApproved ? (
              <CheckCircle2 size={36} strokeWidth={3} className="text-white" />
            ) : disabled ? (
              <Lock size={28} strokeWidth={2.5} className="text-white" />
            ) : (
              <Trophy size={36} strokeWidth={2.5} className="text-white drop-shadow" />
            )}
          </div>
        </Link>

        {/* Label embaixo */}
        <div className="mt-3 text-center max-w-[220px]">
          <div
            className={cn(
              "font-display text-[16px] md:text-[18px] leading-tight",
              disabled ? "text-spark-ink-35" : "text-spark-ink",
            )}
          >
            Prova final
          </div>
          <div
            className={cn(
              "text-[12px] mt-0.5 font-extrabold",
              proofApproved
                ? "text-emerald-700"
                : proofPending
                  ? "text-yellow-700"
                  : proofRejected
                    ? "text-red-700"
                    : disabled
                      ? "text-spark-ink-35"
                      : "text-amber-700",
            )}
          >
            {statusLabel}
          </div>

          {/* CTA pra enviar prova */}
          {unlocked && !proofPending && !proofApproved && !proofRejected && (
            <Link
              href={`/jornadas/${journey.slug}/prova`}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-grad text-white text-[12px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all"
            >
              <Camera size={12} />
              Enviar print
            </Link>
          )}
          {proofRejected && (
            <Link
              href={`/jornadas/${journey.slug}/prova`}
              className="mt-2 inline-block text-spark-brand-deep underline text-[12px] font-extrabold"
            >
              Tentar de novo
            </Link>
          )}
        </div>
      </div>

      <style>{`
        @keyframes treasure-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        @keyframes treasure-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
