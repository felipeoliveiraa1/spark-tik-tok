"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoryTopBar } from "@/components/journey/StoryTopBar";
import { StoryCard } from "@/components/journey/StoryCard";
import { ProofStoryCard } from "@/components/journey/ProofStoryCard";
import { type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  xp_reward: number;
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

const HINT_DISMISSED_KEY = "tts:journeyStoryHintDismissed";

/**
 * Container principal do Story Deck. Mobile-first, fullscreen, swipe
 * horizontal nativo via scroll-snap. BG da jornada e' UM unico layer
 * fixed atras de TODOS os cards (economiza bandwidth + evita 6 cards
 * com mesmo fundo se a jornada tem N aulas).
 *
 * Fixes do reviewer:
 * - BG compartilhado 1x por jornada (layer fixed, nao dentro do card)
 * - Hint persistente ate primeiro swipe (sessionStorage)
 * - Cards locked: visivel mas com overlay + cadeado + CTA disabled
 *   (deixa aluna espiar oq vem mas nao confunde com "travou")
 * - Empty state: jornada sem aulas
 * - Auto-scroll inicial pro current
 * - Teclado ←/→ pra desktop
 * - Setas peek pra desktop
 */
export function JourneyStoryDeck({
  journey,
  lessons,
  xpTotal,
  proofStatus,
  currentLessonIdx,
}: {
  journey: Journey;
  lessons: Lesson[];
  xpTotal: number;
  proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready";
  currentLessonIdx: number;
}) {
  const router = useRouter();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [activeIdx, setActiveIdx] = React.useState(
    Math.max(0, currentLessonIdx),
  );
  const [hintVisible, setHintVisible] = React.useState(false);

  const totalCards = lessons.length + 1; // +1 prova

  // Cards array refs sempre com tamanho certo
  React.useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, totalCards);
  }, [totalCards]);

  // Auto-scroll inicial pro current — usa scrollIntoView pra deixar o
  // browser fazer a math respeitando padding lateral + snap-center
  React.useLayoutEffect(() => {
    const targetIdx = Math.max(0, currentLessonIdx);
    const card = cardRefs.current[targetIdx];
    if (card) {
      card.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "instant" as ScrollBehavior,
      });
    }
  }, [currentLessonIdx]);

  // IntersectionObserver pra detectar card visivel
  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            if (Number.isFinite(idx)) setActiveIdx(idx);
          }
        }
      },
      {
        root: scroller,
        threshold: [0.6],
        rootMargin: "0px",
      },
    );
    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [totalCards]);

  // Hint visivel ate primeiro swipe (sessionStorage)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem(HINT_DISMISSED_KEY);
    if (!dismissed && totalCards > 1) {
      setHintVisible(true);
    }
  }, [totalCards]);

  // Detecta primeiro swipe (mudanca de activeIdx vs initial) pra esconder hint
  const initialActiveIdx = React.useRef(activeIdx);
  React.useEffect(() => {
    if (hintVisible && activeIdx !== initialActiveIdx.current) {
      setHintVisible(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(HINT_DISMISSED_KEY, "1");
      }
    }
  }, [activeIdx, hintVisible]);

  // Teclado: ←/→ + Enter
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        jumpTo(Math.min(totalCards - 1, activeIdx + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        jumpTo(Math.max(0, activeIdx - 1));
      } else if (e.key === "Enter") {
        const card = cardRefs.current[activeIdx];
        const cta = card?.querySelector<HTMLAnchorElement>("a[href]");
        cta?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIdx, totalCards]);

  const jumpTo = React.useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    card.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, []);

  // Empty state
  if (lessons.length === 0) {
    return (
      <div className="fixed inset-0 bg-spark-ink flex flex-col items-center justify-center text-white px-6 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="font-display text-[24px] md:text-[28px]">
          Em preparação
        </h2>
        <p className="text-white/70 text-[14px] mt-2 max-w-[36ch]">
          Esta jornada está sendo preparada com carinho. Volta em breve!
        </p>
        <a
          href="/jornadas"
          className="mt-6 px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand"
        >
          ← Voltar pras Jornadas
        </a>
      </div>
    );
  }

  // BG da jornada (1 por jornada inteira)
  const bgPath =
    journey.character_stage === "bebe"
      ? "/sprites/map/journey-1-bg.png"
      : journey.character_stage === "adolescente"
        ? "/sprites/map/journey-2-bg.png"
        : "/sprites/map/journey-3-bg.png";

  // Label da topbar muda conforme card ativo
  const activeLesson = lessons[activeIdx];
  const activeLabel =
    activeIdx >= lessons.length
      ? `Prova final · ${journey.title}`
      : activeLesson
        ? `Aula ${activeIdx + 1} de ${lessons.length}`
        : journey.title;

  return (
    <div className="fixed inset-0 bg-spark-ink overflow-hidden">
      {/* BG LAYER COMPARTILHADO — 1 imagem fixed atras de todos os cards */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bgPath})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: "brightness(0.85) saturate(1.1)",
          animation: "ken-burns 18s ease-in-out alternate infinite",
        }}
        aria-hidden
      />
      {/* Vignette geral sutil pra dar profundidade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)",
        }}
        aria-hidden
      />

      {/* Top bar */}
      <StoryTopBar
        lessons={lessons}
        activeIdx={activeIdx}
        onJump={jumpTo}
        xpTotal={xpTotal}
        proofStatus={proofStatus}
        activeLabel={activeLabel}
      />

      {/* Scroller horizontal com snap */}
      <div
        ref={scrollerRef}
        className={cn(
          "absolute inset-0 flex overflow-x-auto overflow-y-hidden",
          "snap-x snap-proximity",
          "scrollbar-none",
          "md:px-[calc((100vw-440px)/2)]",
        )}
        style={{
          scrollSnapType: "x proximity",
          overscrollBehaviorInline: "contain",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {lessons.map((lesson, idx) => {
          const blockingIdx = lesson.locked
            ? lessons.findIndex((l, i) => i < idx && !l.completed) + 1
            : null;
          return (
            <div
              key={lesson.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              data-idx={idx}
              className="shrink-0"
            >
              <StoryCard
                lesson={lesson}
                journey={{ slug: journey.slug, title: journey.title }}
                index={idx + 1}
                totalLessons={lessons.length}
                isActive={idx === activeIdx}
                characterStage={journey.character_stage}
                blockingLessonIndex={blockingIdx}
              />
            </div>
          );
        })}

        {/* Card especial prova final */}
        <div
          ref={(el) => {
            cardRefs.current[lessons.length] = el;
          }}
          data-idx={lessons.length}
          className="shrink-0"
        >
          <ProofStoryCard
            journey={{ slug: journey.slug, title: journey.title }}
            proofStatus={proofStatus}
            isActive={activeIdx === lessons.length}
            totalLessons={lessons.length}
          />
        </div>
      </div>

      {/* Setas desktop (peek navigation) */}
      {activeIdx > 0 && (
        <button
          onClick={() => jumpTo(activeIdx - 1)}
          aria-label="Aula anterior"
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white hover:bg-white/25 transition-colors items-center justify-center active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
      )}
      {activeIdx < totalCards - 1 && (
        <button
          onClick={() => jumpTo(activeIdx + 1)}
          aria-label="Próxima aula"
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white hover:bg-white/25 transition-colors items-center justify-center active:scale-95"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      )}

      {/* Hint swipe direcional (so mobile, ate primeiro swipe) */}
      {hintVisible && (
        <div
          className="absolute bottom-32 right-6 z-30 md:hidden pointer-events-none flex items-center gap-1 text-white/80 text-[11.5px] font-extrabold tracking-wider uppercase"
          style={{ animation: "deck-hint-bounce 1.6s ease-in-out infinite" }}
        >
          {activeIdx > 0 && <ChevronLeft size={14} strokeWidth={3} />}
          deslize
          {activeIdx < totalCards - 1 && <ChevronRight size={14} strokeWidth={3} />}
        </div>
      )}

      {/* Sr-only live region (anuncia card atual) */}
      <div className="sr-only" aria-live="polite" role="status">
        {activeLabel}
        {activeLesson ? `: ${activeLesson.title}` : ""}
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
