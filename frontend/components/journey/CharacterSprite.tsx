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

const SPRITE_BASE = 64; // px por frame (sprite sheet)
const DISPLAY_BASE = 64; // px base de render

/**
 * Pixel art character sprite com 3 fallbacks em ordem:
 *
 * 1. Sprite sheet animado em /sprites/characters/{stage}/{anim}.sheet.png
 *    (frames horizontais de 64x64). Renderiza via canvas + RAF.
 *
 * 2. Single-pose PNG em /sprites/characters/{stage}/{anim}.png
 *    (1024x1024 gerado pelo script generate-jornada-assets.mjs).
 *    Renderiza via <img> + CSS bounce.
 *
 * 3. Emoji fallback (👶/👧/🙋‍♀️) com bounce CSS.
 *
 * Deteccao automatica — basta colocar o PNG no path correto.
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
  const prefersReduced = useReducedMotion(reducedMotion);
  const [mode, setMode] = React.useState<"sheet" | "single" | "emoji" | null>(null);

  // Tenta sheet → single → emoji
  React.useEffect(() => {
    const sheetImg = new Image();
    sheetImg.onload = () => setMode("sheet");
    sheetImg.onerror = () => {
      const singleImg = new Image();
      singleImg.onload = () => setMode("single");
      singleImg.onerror = () => setMode("emoji");
      singleImg.src = `/sprites/characters/${stage}/${anim}.png`;
    };
    sheetImg.src = `/sprites/characters/${stage}/${anim}.sheet.png`;
  }, [stage, anim]);

  const label = ariaLabel ?? `Personagem ${STAGE_LABELS[stage]}`;
  const displaySize = DISPLAY_BASE * scale;

  if (mode === null) {
    // Loading invisivel — evita flicker
    return (
      <div
        className={cn("inline-block", className)}
        style={{ width: displaySize, height: displaySize }}
        aria-label={label}
        role="img"
      />
    );
  }

  if (mode === "sheet") {
    return (
      <SheetCanvas
        stage={stage}
        anim={anim}
        scale={scale}
        reducedMotion={prefersReduced}
        label={label}
        className={className}
      />
    );
  }

  if (mode === "single") {
    // PNG gerado pela openai vem com character off-center no canvas 1024x1024
    // (bbox tipica 640x960, dy=-26px do centro vertical, margens transparentes
    // 180-204px laterais). cover + objectPosition 50% 35% + scale 1.35 ancora
    // o character no centro visual do slot e crop as margens vazias.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/sprites/characters/${stage}/${anim}.png`}
        alt={label}
        width={displaySize}
        height={displaySize}
        className={cn("select-none", className)}
        style={{
          width: displaySize,
          height: displaySize,
          objectFit: "cover",
          objectPosition: "50% 35%",
          transform: "scale(1.35)",
          transformOrigin: "center 40%",
          imageRendering: "pixelated",
          animation: prefersReduced ? undefined : "char-bounce 2.4s ease-in-out infinite",
        }}
      />
    );
  }

  // Emoji fallback
  const emojiSize = displaySize * 0.6;
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        fontSize: emojiSize,
        lineHeight: 1,
        display: "inline-block",
        width: displaySize,
        height: displaySize,
        textAlign: "center",
        animation: prefersReduced ? undefined : "char-bounce 2.4s ease-in-out infinite",
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

function SheetCanvas({
  stage,
  anim,
  scale,
  reducedMotion,
  label,
  className,
}: {
  stage: CharacterStage;
  anim: Anim;
  scale: number;
  reducedMotion: boolean;
  label: string;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const img = new Image();
    img.src = `/sprites/characters/${stage}/${anim}.sheet.png`;
    let raf = 0;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      const totalFrames = FRAMES[anim];
      if (totalFrames === 1 || reducedMotion) {
        ctx.clearRect(0, 0, SPRITE_BASE, SPRITE_BASE);
        ctx.drawImage(img, 0, 0, SPRITE_BASE, SPRITE_BASE, 0, 0, SPRITE_BASE, SPRITE_BASE);
        return;
      }

      let frame = 0;
      let lastFrameTime = 0;
      const frameInterval = 1000 / FPS[anim];

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
    };
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stage, anim, reducedMotion]);

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
      }}
    />
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
