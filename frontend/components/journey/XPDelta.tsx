"use client";

import * as React from "react";

/**
 * Tooltip flutuante "+N XP" animado. Aparece, sobe e somem em 1.5s.
 * Use via showXpDelta(amount) (helper imperativo simples), ou renderize
 * direto <XPDelta amount={10} onDone={...} /> em componentes especificos.
 */
export function XPDelta({
  amount,
  onDone,
}: {
  amount: number;
  onDone?: () => void;
}) {
  React.useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
      style={{
        animation: "xp-delta-rise 1.5s ease-out forwards",
      }}
    >
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-display text-3xl px-5 py-2.5 rounded-full shadow-lift">
        +{amount} XP ✨
      </div>
      <style>{`
        @keyframes xp-delta-rise {
          0% { opacity: 0; transform: translate(-50%, -30%) scale(0.7); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          25% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -110%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -130%) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
