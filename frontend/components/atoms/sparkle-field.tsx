"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * SparkleField — decorativo de sparkles pulsando em posições aleatórias
 * mas estáveis (mesma seed sempre). Pra dar magia em heros.
 *
 * Renderiza N sparkles SVG em posições pseudo-aleatórias com delays
 * diferentes pra brilharem em momentos distintos.
 */

type Sparkle = { x: number; y: number; size: number; delay: number; rotate: number };

function pseudoRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function generateSparkles(count: number, seed: number): Sparkle[] {
  const rng = pseudoRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rng() * 100,
    y: rng() * 100,
    size: 8 + rng() * 14,
    delay: rng() * 3,
    rotate: rng() * 360,
  }));
}

type Props = {
  count?: number;
  seed?: number;
  color?: string;
  className?: string;
};

export function SparkleField({
  count = 12,
  seed = 42,
  color = "oklch(0.65 0.22 350)",
  className,
}: Props) {
  const sparkles = React.useMemo(() => generateSparkles(count, seed), [count, seed]);
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
    >
      {sparkles.map((s, i) => (
        <svg
          key={i}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          className="absolute animate-sparkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDelay: `${s.delay}s`,
            transform: `rotate(${s.rotate}deg)`,
          }}
        >
          <path
            d="M12 0L13.5 9L22 10.5L13.5 12L12 21L10.5 12L2 10.5L10.5 9Z"
            fill={color}
          />
        </svg>
      ))}
    </div>
  );
}
