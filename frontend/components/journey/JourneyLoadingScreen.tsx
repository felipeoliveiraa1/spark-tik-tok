"use client";

import * as React from "react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import type { CharacterStage } from "@/lib/journey/character-stage";

const MESSAGES = [
  "Preparando seu joguinho... ✨",
  "Carregando as aulas... 📚",
  "Animando os personagens... 🎨",
  "Quase lá... 💕",
] as const;

/**
 * Tela de loading fofinha pra rotas /jornadas — gradient brand + sprite
 * pulando + progresso fake (anima 0->95% em 1.5s, cap em 95% ate parent
 * desmontar a tela). Mensagem alterna a cada 1.2s.
 *
 * NAO usa pixel art BG (PNG ~1.3MB pode estar carregando) — gradient
 * inline cobre a tela imediatamente sem flash branco.
 */
export function JourneyLoadingScreen({
  stage = "bebe",
  label,
}: {
  stage?: CharacterStage;
  label?: string;
}) {
  const [pct, setPct] = React.useState(0);
  const [msgIdx, setMsgIdx] = React.useState(0);

  React.useEffect(() => {
    // Anima 0 -> 95% em ~1.5s, cap em 95% (so chega 100% quando parent troca)
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.min(95, Math.round((elapsed / duration) * 95));
      setPct(next);
      if (next < 95) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    const id = window.setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      1400,
    );
    return () => window.clearInterval(id);
  }, []);

  const gradient =
    stage === "adolescente"
      ? "linear-gradient(135deg, #d4a8ff 0%, #fdb4c2 100%)"
      : stage === "adulta"
        ? "linear-gradient(135deg, #ffd6a8 0%, #d4a8ff 100%)"
        : "linear-gradient(135deg, #fdb4c2 0%, #ffd6a8 100%)";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: gradient }}
      role="status"
      aria-live="polite"
      aria-label="Carregando jornada"
    >
      {/* Sparkles flutuando — decorativo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[
          { top: "18%", left: "20%", delay: "0s" },
          { top: "30%", left: "80%", delay: "0.4s" },
          { top: "60%", left: "15%", delay: "0.8s" },
          { top: "72%", left: "82%", delay: "1.2s" },
          { top: "45%", left: "50%", delay: "1.6s" },
        ].map((s, i) => (
          <span
            key={i}
            className="absolute text-white text-lg"
            style={{
              top: s.top,
              left: s.left,
              animation: `story-twinkle 2.5s ease-in-out ${s.delay} infinite`,
            }}
          >
            ✨
          </span>
        ))}
      </div>

      {/* Sprite no centro com bounce */}
      <div
        className="relative z-10"
        style={{
          animation:
            "char-bounce 1.6s ease-in-out infinite, ken-burns 18s ease-in-out alternate infinite",
        }}
      >
        <CharacterSprite stage={stage} anim="idle" scale={3} />
      </div>

      {/* Progress bar + mensagem rotativa */}
      <div className="relative z-10 mt-8 w-full max-w-[280px]">
        <div
          className="text-center text-white font-extrabold text-[14px] mb-2.5 h-5"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
        >
          {label ?? MESSAGES[msgIdx]}
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden border border-white/40 shadow-lift">
          <div
            className="h-full bg-white rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          className="text-center text-white/95 mt-1.5 text-[13px] font-extrabold tabular-nums"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
        >
          {pct}%
        </div>
      </div>
    </div>
  );
}
