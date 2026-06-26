"use client";

import * as React from "react";
import { STAGE_EMOJI, STAGE_LABELS, type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type Anim = "idle" | "walk" | "celebrating" | "locked" | "studying";

const FRAMES: Record<Anim, number> = {
  idle: 4,
  walk: 8,
  celebrating: 6,
  locked: 1,
  studying: 4,
};

const FPS: Record<Anim, number> = {
  idle: 4,
  walk: 8,
  celebrating: 10,
  locked: 1,
  studying: 3,
};

const SPRITE_BASE = 64; // px por frame (sprite sheet horizontal)

/**
 * Pixel art character sprite. Tenta carregar sprite sheet de
 * /sprites/characters/{stage}/{anim}.png. Se nao existir, fallback pra
 * emoji animado com bounce CSS.
 *
 * API estavel: stage + anim + scale. Quando swap pra real pixel art,
 * basta colocar PNGs nas paths definidas em character-stage.ts.
 */
export function CharacterSprite({
  stage,
  anim = "idle",
  scale = 4,
  reducedMotion = false,
  className,
  ariaLabel,
}: {
  stage: CharacterStage;
  anim?: Anim;
  scale?: number;
  reducedMotion?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hasSprite, setHasSprite] = React.useState<boolean | null>(null);

  // Detecta prefers-reduced-motion
  const prefersReduced = useReducedMotion(reducedMotion);

  // Tenta carregar sprite sheet. Se 404, marca hasSprite=false → fallback emoji
  React.useEffect(() => {
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setHasSprite(true);
      drawSpriteFrames(canvasRef.current, img, anim, prefersReduced);
    };
    img.onerror = () => {
      if (!cancelled) setHasSprite(false);
    };
    img.src = `/sprites/characters/${stage}/${anim}.png`;
    return () => {
      cancelled = true;
    };
  }, [stage, anim, prefersReduced]);

  const label = ariaLabel ?? `Personagem ${STAGE_LABELS[stage]} — ${anim}`;

  if (hasSprite === false) {
    // Fallback: emoji animado (sem sprite real ainda)
    return (
      <EmojiFallback stage={stage} scale={scale} className={className} label={label} reduced={prefersReduced} />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={SPRITE_BASE}
      height={SPRITE_BASE}
      role="img"
      aria-label={label}
      className={cn("select-none", className)}
      style={{
        width: SPRITE_BASE * scale,
        height: SPRITE_BASE * scale,
        imageRendering: "pixelated",
        opacity: hasSprite === null ? 0 : 1,
        transition: "opacity 150ms",
      }}
    />
  );
}

function drawSpriteFrames(
  canvas: HTMLCanvasElement | null,
  img: HTMLImageElement,
  anim: Anim,
  reduced: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const totalFrames = FRAMES[anim];
  if (totalFrames === 1 || reduced) {
    // Frame unico
    ctx.clearRect(0, 0, SPRITE_BASE, SPRITE_BASE);
    ctx.drawImage(img, 0, 0, SPRITE_BASE, SPRITE_BASE, 0, 0, SPRITE_BASE, SPRITE_BASE);
    return;
  }

  let frame = 0;
  let lastFrameTime = 0;
  const frameInterval = 1000 / FPS[anim];
  let raf = 0;

  const loop = (now: number) => {
    if (now - lastFrameTime >= frameInterval) {
      ctx.clearRect(0, 0, SPRITE_BASE, SPRITE_BASE);
      ctx.drawImage(
        img,
        frame * SPRITE_BASE,
        0,
        SPRITE_BASE,
        SPRITE_BASE,
        0,
        0,
        SPRITE_BASE,
        SPRITE_BASE,
      );
      frame = (frame + 1) % totalFrames;
      lastFrameTime = now;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Cleanup quando o canvas sai do DOM (mas o efeito useEffect ja gerencia
  // remount via deps; aqui RAF para sozinho se canvas for desmontado pelo GC)
  return () => cancelAnimationFrame(raf);
}

function EmojiFallback({
  stage,
  scale,
  className,
  label,
  reduced,
}: {
  stage: CharacterStage;
  scale: number;
  className?: string;
  label: string;
  reduced: boolean;
}) {
  const size = SPRITE_BASE * scale * 0.6;
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        animation: reduced ? undefined : "char-bounce 2.4s ease-in-out infinite",
      }}
      className={cn("select-none", className)}
    >
      {STAGE_EMOJI[stage]}
      <style>{`
        @keyframes char-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.03); }
        }
      `}</style>
    </span>
  );
}

function useReducedMotion(forceReduced: boolean) {
  const [reduced, setReduced] = React.useState(forceReduced);
  React.useEffect(() => {
    if (forceReduced) {
      setReduced(true);
      return;
    }
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [forceReduced]);
  return reduced;
}
