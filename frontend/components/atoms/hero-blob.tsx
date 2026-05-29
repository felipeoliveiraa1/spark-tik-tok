import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * HeroBlob — blob orgânico que dança suavemente. Pra fundos hero.
 *
 * Usar 2-3 blobs sobrepostos em cores diferentes pra criar o efeito
 * radial dramático. Posiciona via top/left/right/bottom + classNames.
 *
 * Exemplo:
 *   <div className="relative overflow-hidden">
 *     <HeroBlob color="rose"   variant={1} className="-top-20 -left-20 w-[420px] h-[420px]" />
 *     <HeroBlob color="peach"  variant={2} className="top-40 -right-32 w-[480px] h-[480px]" />
 *     <HeroBlob color="lilac"  variant={3} className="bottom-0 left-1/3 w-[360px] h-[360px]" />
 *   </div>
 */

type Color = "rose" | "peach" | "lilac" | "deep" | "cream";
type Variant = 1 | 2 | 3;

// Opacidade reduzida globalmente (era 0.45-0.60) pra nao lavar o fundo
// das paginas com hero-radial — tava prejudicando o contraste do
// text-grad-brand especialmente no mobile, onde blobs cobrem mais % do
// viewport. Lightness um pouco subida pra compensar a saturacao menor.
const COLOR_MAP: Record<Color, string> = {
  rose: "oklch(0.78 0.18 350 / 0.30)",
  peach: "oklch(0.84 0.15 30 / 0.26)",
  lilac: "oklch(0.82 0.13 310 / 0.24)",
  deep: "oklch(0.60 0.22 340 / 0.35)",
  cream: "oklch(0.96 0.04 50 / 0.40)",
};

const VARIANT_ANIM: Record<Variant, string> = {
  1: "animate-blob-1",
  2: "animate-blob-2",
  3: "animate-blob-3",
};

type Props = {
  color?: Color;
  variant?: Variant;
  /** Tamanho/posição via Tailwind (ex: "-top-20 left-10 w-[400px] h-[400px]") */
  className?: string;
};

export function HeroBlob({ color = "rose", variant = 1, className }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none",
        VARIANT_ANIM[variant],
        className,
      )}
      style={{ background: COLOR_MAP[color] }}
    />
  );
}
