"use client";

import * as React from "react";
import { JourneyCharacter } from "@/components/journey/JourneyCharacter";
import { STAGE_LABELS, type CharacterStage } from "@/lib/journey/character-stage";

/**
 * Animacao fullscreen de evolucao do personagem.
 * Dispara quando user.character_stage muda (bebe -> adolescente ou
 * adolescente -> adulta). Auto-dismiss em 4s ou click.
 */
export function LevelUpAnimation({
  fromStage,
  toStage,
  onDismiss,
}: {
  fromStage: CharacterStage;
  toStage: CharacterStage;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  // Detecta reduced motion
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      role="dialog"
      aria-label={`Evoluiu para ${STAGE_LABELS[toStage]}`}
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{
        background:
          "radial-gradient(circle at center, rgba(255,95,141,0.95), rgba(42,42,42,0.98) 70%)",
        animation: reduced ? "level-up-fade-in 300ms" : "level-up-fade-in 600ms",
      }}
    >
      {/* Rays */}
      {!reduced && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-left bg-white/40"
              style={{
                width: "60vw",
                height: "2px",
                transform: `rotate(${i * 30}deg)`,
                animation: `level-up-ray-rotate 8s linear infinite`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center text-white px-6">
        <div
          className="text-[12px] font-extrabold uppercase tracking-[0.3em] opacity-80 mb-4"
          style={{ animation: reduced ? undefined : "level-up-label 2s ease-out" }}
        >
          ✦ Evolução ✦
        </div>

        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="opacity-50" style={{ filter: "grayscale(80%)" }}>
            <JourneyCharacter stage={fromStage} size={80} />
            <div className="text-[11px] mt-2 opacity-70">antes</div>
          </div>

          <div
            className="text-4xl"
            style={{
              animation: reduced ? undefined : "level-up-arrow 1.5s ease-out infinite",
            }}
          >
            →
          </div>

          <div
            style={{
              animation: reduced ? undefined : "level-up-character-pop 1s ease-out",
            }}
          >
            <JourneyCharacter stage={toStage} size={120} />
            <div className="text-[12px] mt-2 font-extrabold">{STAGE_LABELS[toStage]}!</div>
          </div>
        </div>

        <h2 className="font-display text-[36px] md:text-[48px] leading-tight">
          Você evoluiu! 🌟
        </h2>
        <p className="mt-3 text-[14px] opacity-90 max-w-[44ch] mx-auto">
          De <strong>{STAGE_LABELS[fromStage]}</strong> pra{" "}
          <strong>{STAGE_LABELS[toStage]}</strong>. Continua firme — você tá vendo
          de outro nível agora.
        </p>

        <div className="mt-6 text-[11px] opacity-60">toque pra continuar</div>
      </div>

      <style>{`
        @keyframes level-up-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes level-up-label {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes level-up-character-pop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes level-up-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes level-up-ray-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
