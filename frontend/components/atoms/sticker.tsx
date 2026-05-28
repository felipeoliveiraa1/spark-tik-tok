import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Sticker — badge circular rotativo inspirado no TastyBasics. Pra dar
 * uma assinatura editorial premium no hero. Texto curvado em volta de
 * um círculo + giro lento infinito.
 *
 * Exemplo:
 *   <Sticker text="MÉTODO TTS · 2026 · PREMIUM · " emoji="✨" />
 *
 * O texto deve ter espaçadores (·, /, ✦) entre palavras pra ficar
 * harmônico ao curvar.
 */

type Tone = "brand" | "ink" | "cream";

const TONE_CLASSES: Record<Tone, { bg: string; text: string }> = {
  brand: { bg: "bg-brand-grad", text: "fill-white" },
  ink: { bg: "bg-spark-ink", text: "fill-white" },
  cream: { bg: "bg-spark-bg", text: "fill-spark-ink" },
};

type Props = {
  text: string;
  emoji?: string;
  size?: number;
  tone?: Tone;
  className?: string;
};

export function Sticker({
  text,
  emoji = "✨",
  size = 120,
  tone = "brand",
  className,
}: Props) {
  const radius = size / 2 - 14;
  const tones = TONE_CLASSES[tone];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full shadow-lift-brand",
        tones.bg,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* Texto curvado giratório */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 animate-spin-slow"
        aria-hidden
      >
        <defs>
          <path
            id={`circle-${size}`}
            d={`M ${size / 2}, ${size / 2} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>
        <text className={cn("text-[10px] font-extrabold tracking-[0.18em]", tones.text)}>
          <textPath href={`#circle-${size}`} startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>

      {/* Emoji central — não gira */}
      <span
        className="relative text-[28px] z-10"
        style={{ filter: tone === "brand" ? "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" : "none" }}
      >
        {emoji}
      </span>
    </div>
  );
}
