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
  ChevronRight,
  Sparkles,
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
  map_x: number | null;
  map_y: number | null;
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

// Mapeia slug -> path do bg (suporta jornada-1-bebe etc OU fallback por stage)
function bgPathFor(slug: string, stage: CharacterStage): string {
  if (slug.includes("jornada-1") || stage === "bebe") {
    return "/sprites/map/journey-1-bg.png";
  }
  if (slug.includes("jornada-2") || stage === "adolescente") {
    return "/sprites/map/journey-2-bg.png";
  }
  return "/sprites/map/journey-3-bg.png";
}

const STAGE_GRADIENTS: Record<CharacterStage, { from: string; to: string }> = {
  bebe: { from: "#fff0f3", to: "#ffe8ed" },
  adolescente: { from: "#f5edff", to: "#ede5ff" },
  adulta: { from: "#fff6ec", to: "#ffeed8" },
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

  const bg = bgPathFor(journey.slug, journey.character_stage);
  const gradient = STAGE_GRADIENTS[journey.character_stage];

  // Aula atual (primeira nao completed E nao locked)
  const currentLessonIdx = lessons.findIndex((l) => !l.completed && !l.locked);

  return (
    <div
      className="min-h-dvh pb-20"
      style={{
        background: `linear-gradient(180deg, ${gradient.from} 0%, var(--spark-bg) 60%)`,
      }}
    >
      {/* Top bar */}
      <header className="px-4 md:px-6 pt-4 pb-3 max-w-[1100px] mx-auto flex items-center justify-between gap-3 flex-wrap">
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

      {/* Hero fullwidth com background pixel art */}
      <div className="px-4 md:px-6 max-w-[1100px] mx-auto">
        <JourneyHero
          journey={journey}
          stats={stats}
          bgPath={bg}
        />
      </div>

      {/* Mapa de checkpoints das aulas em cima do background */}
      {lessons.length > 0 && (
        <div className="px-4 md:px-6 max-w-[1100px] mx-auto mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-spark-brand-deep" />
            <span className="text-eyebrow text-spark-brand-deep">
              Caminho das aulas
            </span>
          </div>
          <LessonsTrail
            lessons={lessons}
            journey={journey}
            bgPath={bg}
            currentLessonIdx={currentLessonIdx}
          />
        </div>
      )}

      {/* Bloco de prova / tesouro final */}
      {stats.all_lessons_complete && (
        <div className="px-4 md:px-6 max-w-[920px] mx-auto mt-6">
          <ProofBlock
            journey={journey}
            proof={proof}
            proofPending={!!proofPending}
            proofApproved={!!proofApproved}
            proofRejected={!!proofRejected}
          />
        </div>
      )}

      {/* Lista compacta de aulas (referencia textual + tactil mobile) */}
      <div className="px-4 md:px-6 max-w-[920px] mx-auto mt-8">
        <div className="text-eyebrow text-spark-brand-deep mb-3">
          📚 Aulas — lista
        </div>
        <div className="space-y-2">
          {lessons.map((l, idx) => (
            <LessonRow key={l.id} journey={journey} lesson={l} index={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyHero({
  journey,
  stats,
  bgPath,
}: {
  journey: Journey;
  stats: ApiResp["stats"];
  bgPath: string;
}) {
  const [bgLoaded, setBgLoaded] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.onerror = () => setBgLoaded(false);
    img.src = bgPath;
  }, [bgPath]);

  return (
    <div
      className="relative w-full rounded-spark-xl border-2 border-spark-hairline overflow-hidden shadow-lift"
      style={{
        aspectRatio: "16 / 7",
        backgroundColor: "#fff5f7",
        backgroundImage: bgLoaded ? `url(${bgPath})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: bgLoaded ? "pixelated" : "auto",
      }}
    >
      {/* Overlay gradient pra texto ficar legivel sobre o pixel art */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)",
        }}
      />

      {/* Conteudo textual à esquerda */}
      <div className="absolute inset-0 flex flex-col justify-center pl-4 md:pl-8 pr-4 max-w-[60%]">
        <div className="text-eyebrow text-spark-brand-deep">
          ✦ {journey.character_name || "Tua aventura"}
        </div>
        <h1 className="font-display text-[22px] md:text-[36px] text-spark-ink leading-tight mt-1">
          {journey.title}
        </h1>
        {journey.subtitle && (
          <p className="text-[12.5px] md:text-[14px] text-spark-ink-70 mt-1 line-clamp-2">
            {journey.subtitle}
          </p>
        )}

        {/* Stats inline */}
        <div className="mt-3 md:mt-4 inline-flex items-center gap-2 md:gap-3">
          <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/90 backdrop-blur border border-spark-hairline text-[11px] md:text-[12.5px] font-extrabold text-spark-ink-70 shadow-rest">
            {stats.completed_lessons}/{stats.total_lessons} aulas
          </div>
          <div className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-spark-brand-soft/95 backdrop-blur border border-spark-brand/30 text-[11px] md:text-[12.5px] font-extrabold text-spark-brand-deep shadow-rest">
            {stats.pct_complete}% completo
          </div>
        </div>
      </div>

      {/* Personagem à direita, posicionado no chão pixel art */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "8%",
          bottom: "10%",
          animation: "hero-char-float 3s ease-in-out infinite",
        }}
      >
        <CharacterSprite
          stage={journey.character_stage}
          anim="idle"
          scale={2.5}
        />
      </div>

      {/* Progress bar fina embaixo */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-spark-ink/15">
        <div
          className="h-full bg-brand-grad transition-all duration-700"
          style={{ width: `${stats.pct_complete}%` }}
        />
      </div>

      <style>{`
        @keyframes hero-char-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function LessonsTrail({
  lessons,
  journey,
  bgPath,
  currentLessonIdx,
}: {
  lessons: Lesson[];
  journey: Journey;
  bgPath: string;
  currentLessonIdx: number;
}) {
  // Distribui aulas em zigzag se nao tiver map_x/y definido
  const positioned = lessons.map((l, i) => {
    const total = lessons.length;
    // Path zigzag: x de 10 a 90, y oscilando 25-75
    const fallbackX = 10 + (i / Math.max(1, total - 1)) * 80;
    const fallbackY = 40 + Math.sin(i * 1.3) * 25;
    return {
      ...l,
      x: l.map_x ?? fallbackX,
      y: l.map_y ?? fallbackY,
    };
  });

  // Path SVG conectando os pontos
  const pathD = positioned.reduce(
    (acc, p, i) =>
      acc +
      (i === 0
        ? `M ${p.x} ${p.y}`
        : ` Q ${(positioned[i - 1]!.x + p.x) / 2} ${(positioned[i - 1]!.y + p.y) / 2 + 5}, ${p.x} ${p.y}`),
    "",
  );

  const currentLesson =
    currentLessonIdx >= 0 ? positioned[currentLessonIdx] : null;

  return (
    <div
      className="relative w-full rounded-spark-xl border-2 border-spark-hairline overflow-hidden shadow-lift"
      style={{
        aspectRatio: "21 / 9",
        backgroundColor: "#fff5f7",
        backgroundImage: `url(${bgPath})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: "pixelated",
      }}
    >
      {/* Overlay sutil pra checkpoints destacarem */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* SVG path tracejado */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Path glow (atras) */}
        <path
          d={pathD}
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeDasharray="2.5 1.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.4}
        />
        {/* Path principal */}
        <path
          d={pathD}
          stroke="#ff5f8d"
          strokeWidth="0.9"
          strokeDasharray="2.5 1.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.95}
        />
      </svg>

      {/* Checkpoints clicáveis */}
      {positioned.map((lesson, idx) => (
        <LessonCheckpoint
          key={lesson.id}
          lesson={lesson}
          index={idx + 1}
          journeySlug={journey.slug}
          isCurrent={idx === currentLessonIdx}
        />
      ))}

      {/* Personagem em cima da aula atual */}
      {currentLesson && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-out"
          style={{
            left: `${currentLesson.x}%`,
            top: `${currentLesson.y}%`,
            transform: "translate(-50%, -150%)",
            zIndex: 5,
          }}
        >
          <CharacterSprite
            stage={journey.character_stage}
            anim="idle"
            scale={1.5}
          />
        </div>
      )}
    </div>
  );
}

function LessonCheckpoint({
  lesson,
  index,
  journeySlug,
  isCurrent,
}: {
  lesson: Lesson & { x: number; y: number };
  index: number;
  journeySlug: string;
  isCurrent: boolean;
}) {
  const disabled = lesson.locked;
  return (
    <Link
      href={disabled ? "#" : `/jornadas/${journeySlug}/aula/${lesson.slug}`}
      aria-label={`Aula ${index}: ${lesson.title}${lesson.completed ? " (concluída)" : lesson.locked ? " (bloqueada)" : ""}`}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-1/2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
      style={{
        left: `${lesson.x}%`,
        top: `${lesson.y}%`,
        zIndex: 4,
      }}
    >
      {/* Halo de pulso no atual */}
      {isCurrent && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark-brand"
          style={{
            width: "60px",
            height: "60px",
            opacity: 0.35,
            animation: "checkpoint-pulse 2s ease-in-out infinite",
          }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] flex items-center justify-center font-display text-[13px] md:text-[15px] shadow-lift transition-all duration-300",
          lesson.completed
            ? "bg-emerald-500 border-white text-white"
            : lesson.locked
              ? "bg-spark-ink/70 border-white/60 text-white"
              : isCurrent
                ? "bg-white border-spark-brand text-spark-brand-deep group-hover:scale-110"
                : "bg-white border-spark-hairline text-spark-ink-70 group-hover:scale-110 group-hover:border-spark-brand/40",
        )}
      >
        {lesson.completed ? (
          <CheckCircle2 size={18} strokeWidth={3} />
        ) : lesson.locked ? (
          <Lock size={14} strokeWidth={2.5} />
        ) : (
          index
        )}
      </div>

      {/* Tooltip on hover (titulo da aula) */}
      {!disabled && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
          <div className="bg-spark-ink text-white px-2.5 py-1 rounded-spark-lg text-[11px] font-extrabold whitespace-nowrap shadow-lift">
            {lesson.title}
            <div className="text-[9.5px] opacity-70 font-mono mt-0.5">
              +{lesson.xp_reward} XP
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes checkpoint-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
      `}</style>
    </Link>
  );
}

function ProofBlock({
  journey,
  proof,
  proofPending,
  proofApproved,
  proofRejected,
}: {
  journey: Journey;
  proof: { status: string } | null;
  proofPending: boolean;
  proofApproved: boolean;
  proofRejected: boolean;
}) {
  return (
    <div className="relative rounded-spark-xl border-2 border-spark-brand bg-gradient-to-br from-spark-brand-soft to-orange-50 p-6 md:p-8 text-center overflow-hidden">
      {/* Sparkles decorativas */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-spark-brand text-xs"
            style={{
              left: `${(i * 137) % 100}%`,
              top: `${(i * 89) % 100}%`,
              animation: `sparkle-twinkle 2.4s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="font-display text-[24px] md:text-[30px] text-spark-ink">
          Hora da prova!
        </h3>
        <p className="text-[13.5px] md:text-[14px] text-spark-ink-70 mt-2 max-w-[44ch] mx-auto">
          Você completou todas as aulas. Agora envie um print do seu TikTok Shop
          mostrando suas vendas pra desbloquear a próxima jornada.
        </p>

        {!proof && (
          <Link
            href={`/jornadas/${journey.slug}/prova`}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-grad text-white text-[14px] font-extrabold shadow-lift-brand hover:-translate-y-1 transition-all"
          >
            <Camera size={16} />
            Enviar print do TikTok
          </Link>
        )}

        {proofPending && (
          <div className="mt-5 inline-block px-5 py-2.5 rounded-full bg-yellow-100 border-2 border-yellow-300 text-yellow-800 text-[13px] font-extrabold">
            ⏳ Prova em análise — em até 24h
          </div>
        )}

        {proofApproved && (
          <div className="mt-5 inline-block px-5 py-2.5 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 text-[13px] font-extrabold">
            ✅ Prova aprovada — bora pra próxima jornada!
          </div>
        )}

        {proofRejected && (
          <>
            <div className="mt-5 inline-block px-5 py-2.5 rounded-full bg-red-100 border-2 border-red-300 text-red-800 text-[13px] font-extrabold">
              ❌ Prova rejeitada
            </div>
            <Link
              href={`/jornadas/${journey.slug}/prova`}
              className="block mt-3 text-spark-brand-deep underline text-[13px] font-extrabold"
            >
              Tentar de novo
            </Link>
          </>
        )}
      </div>

      <style>{`
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
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
        "flex items-center gap-3 rounded-spark-lg border p-4 transition-all",
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
