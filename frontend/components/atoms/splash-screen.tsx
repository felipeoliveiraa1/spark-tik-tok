"use client";

import * as React from "react";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { Sticker } from "@/components/atoms/sticker";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { cn } from "@/lib/cn";

/**
 * SplashScreen — tela cheia premium pra primeira impressão.
 *
 * Visual:
 *   - Fullscreen com hero-radial dramático
 *   - 3 blobs orgânicos flutuantes
 *   - 14 sparkles pulsando
 *   - Logo Spark centralizado com mask-reveal
 *   - Sticker rotativo "MÉTODO TTS · 2026" em volta
 *   - Eyebrow + Tanker text "carregando" / "seu dia" com cycle de mensagens
 *   - Progress dot ring sutil
 *   - Fade out automático quando isLoading=false
 *
 * Uso:
 *   const [loading, setLoading] = useState(true);
 *   useEffect(() => { ... setLoading(false); }, []);
 *   return (
 *     <>
 *       <SplashScreen show={loading} />
 *       <Home />
 *     </>
 *   );
 */

const MESSAGES = [
  "preparando seu dia",
  "ajeitando o cenário",
  "buscando seus dados",
  "quase lá",
];

type Props = {
  show: boolean;
  /** Tempo mínimo em ms pra exibir antes de dismissar. Default 1200. */
  minDurationMs?: number;
  /** Tempo do fade-out em ms. Default 600. */
  fadeOutMs?: number;
};

export function SplashScreen({
  show,
  minDurationMs = 1200,
  fadeOutMs = 600,
}: Props) {
  const [visible, setVisible] = React.useState(true);
  const [fadingOut, setFadingOut] = React.useState(false);
  const [msgIdx, setMsgIdx] = React.useState(0);
  const mountedAt = React.useRef<number>(Date.now());

  // Cycle das mensagens
  React.useEffect(() => {
    if (fadingOut) return;
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [fadingOut]);

  // Quando show vira false, espera minDuration e faz fade out
  React.useEffect(() => {
    if (show) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, minDurationMs - elapsed);
    const t1 = setTimeout(() => {
      setFadingOut(true);
      const t2 = setTimeout(() => setVisible(false), fadeOutMs);
      (t1 as unknown as { _t2?: ReturnType<typeof setTimeout> })._t2 = t2;
    }, wait);
    return () => {
      clearTimeout(t1);
      const t2 = (t1 as unknown as { _t2?: ReturnType<typeof setTimeout> })._t2;
      if (t2) clearTimeout(t2);
    };
  }, [show, minDurationMs, fadeOutMs]);

  if (!visible) return null;

  return (
    <div
      aria-hidden={fadingOut}
      role="status"
      className={cn(
        "fixed inset-0 z-[100] overflow-hidden hero-radial flex items-center justify-center",
        "transition-opacity ease-premium",
      )}
      style={{
        opacity: fadingOut ? 0 : 1,
        transitionDuration: `${fadeOutMs}ms`,
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      {/* Blobs orgânicos drifting */}
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="-bottom-20 left-1/4 w-[400px] h-[400px]" />

      {/* Sparkles */}
      <SparkleField count={18} seed={314} className="opacity-80" />

      {/* Conteúdo central */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Sticker rotativo */}
        <div className="mb-10 animate-mask-reveal" style={{ animationDelay: "200ms" }}>
          <Sticker
            text="MÉTODO TTS · 2026 · PREMIUM · "
            emoji="✨"
            size={148}
          />
        </div>

        {/* Eyebrow */}
        <div
          className="text-eyebrow text-spark-brand-deep mb-5 animate-character"
          style={{ animationDelay: "100ms" }}
        >
          ✦ bem-vinda
        </div>

        {/* Logo / Wordmark */}
        <div className="animate-character" style={{ animationDelay: "300ms" }}>
          <SparkWordmark size={120} />
        </div>

        {/* Mensagem rotativa em Tanker */}
        <div className="mt-10 h-[44px] sm:h-[56px] overflow-hidden">
          <div
            className="font-display lowercase leading-tight tracking-tight text-spark-ink transition-transform duration-500 ease-premium"
            style={{
              transform: `translateY(-${msgIdx * 44}px)`,
              fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)",
            }}
          >
            {MESSAGES.map((m, i) => (
              <div key={i} className="h-[44px] sm:h-[56px] flex items-center justify-center">
                {m}
                <span className="text-grad-brand">.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-8 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-spark-ink/30 animate-typing-dot"
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
