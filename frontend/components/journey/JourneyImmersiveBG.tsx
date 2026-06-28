"use client";

import type { CharacterStage } from "@/lib/journey/character-stage";

type Stage = CharacterStage | "overworld";
type Intensity = "subtle" | "medium" | "full";

const STAGE_TO_BG: Record<Stage, string> = {
  bebe: "/sprites/map/journey-1-bg.png",
  adolescente: "/sprites/map/journey-2-bg.png",
  adulta: "/sprites/map/journey-3-bg.png",
  // overworld.png existe mas tem typos AI ("Aia da Iniciante"). Pra hub
  // geral usamos journey-1-bg (bebe) como fallback de "mundo inicial".
  overworld: "/sprites/map/journey-1-bg.png",
};

const INTENSITY_FILTER: Record<Intensity, string> = {
  subtle: "brightness(0.55) saturate(1.05)",
  medium: "brightness(0.75) saturate(1.1)",
  full: "brightness(0.85) saturate(1.1)",
};

const INTENSITY_VIGNETTE: Record<Intensity, string> = {
  subtle: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.65) 100%)",
  medium: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
  full: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)",
};

const INTENSITY_SPARKLES: Record<Intensity, number> = {
  subtle: 0,
  medium: 3,
  full: 5,
};

// Posicoes fixas pra sparkles (evita re-layout em re-render)
const SPARKLE_POSITIONS: Array<{ top: string; left: string }> = [
  { top: "12%", left: "18%" },
  { top: "28%", left: "78%" },
  { top: "55%", left: "12%" },
  { top: "70%", left: "84%" },
  { top: "40%", left: "50%" },
];

/**
 * BG imersivo unificado das telas de Jornada — pixel art com ken-burns +
 * vignette + sparkles, em 3 intensidades:
 *
 * - subtle:  aula longa. brightness 0.55, vignette forte, sem ken-burns
 *            nem sparkles. Pensado pra ficar atras de um sheet branco
 *            translucido pro conteudo respirar.
 * - medium:  hub de modulos / hub geral. brightness 0.75, ken-burns ON,
 *            3 sparkles. Atmosfera viva sem competir com cards.
 * - full:    deck/imersao maxima. brightness 0.85 + saturate 1.1, vignette
 *            padrao, 5 sparkles. (Deck nao migra — usa receita propria.)
 *
 * fixed=true (default false) coloca o BG em position:fixed pra seguir o
 * scroll, dando sensacao de "mundo persistente" enquanto aluna rola.
 */
export function JourneyImmersiveBG({
  stage,
  intensity = "medium",
  sparkles,
  kenBurns,
  bgPathOverride,
  className = "",
  fixed = false,
}: {
  stage: Stage;
  intensity?: Intensity;
  sparkles?: boolean;
  kenBurns?: boolean;
  bgPathOverride?: string;
  className?: string;
  fixed?: boolean;
}) {
  const bg = bgPathOverride ?? STAGE_TO_BG[stage];
  const baseSparkleCount = INTENSITY_SPARKLES[intensity];
  const sparkleCount =
    sparkles === false
      ? 0
      : sparkles === true
        ? Math.max(3, baseSparkleCount)
        : baseSparkleCount;
  const useKenBurns = kenBurns ?? intensity !== "subtle";
  const position = fixed ? "fixed" : "absolute";

  return (
    <div
      className={`${position} inset-0 bg-spark-ink overflow-hidden -z-10 ${className}`}
      aria-hidden
    >
      {/* Layer 1 — Pixel BG image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: INTENSITY_FILTER[intensity],
          animation: useKenBurns
            ? "ken-burns 18s ease-in-out alternate infinite"
            : undefined,
        }}
      />
      {/* Layer 2 — Vignette radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: INTENSITY_VIGNETTE[intensity] }}
      />
      {/* Layer 3 — Sparkles (opcional) */}
      {sparkleCount > 0 &&
        SPARKLE_POSITIONS.slice(0, sparkleCount).map((pos, i) => (
          <span
            key={i}
            className="absolute text-amber-200 text-base md:text-lg pointer-events-none select-none"
            style={{
              top: pos.top,
              left: pos.left,
              animation: "story-twinkle 2.5s ease-in-out infinite",
              animationDelay: `${i * 0.4}s`,
            }}
          >
            ✨
          </span>
        ))}
    </div>
  );
}
