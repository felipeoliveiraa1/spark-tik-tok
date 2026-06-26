"use client";

import * as React from "react";
import { Award, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export type AwardedBadge = {
  badge_id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  xp_bonus: number;
};

const RARITY_STYLES: Record<string, { ring: string; from: string; to: string; label: string }> = {
  common: { ring: "ring-slate-300", from: "from-slate-100", to: "to-slate-200", label: "comum" },
  rare: { ring: "ring-blue-400", from: "from-blue-100", to: "to-cyan-200", label: "raro" },
  epic: { ring: "ring-purple-500", from: "from-purple-100", to: "to-pink-200", label: "épico" },
  legendary: { ring: "ring-amber-500", from: "from-amber-100", to: "to-orange-200", label: "lendário" },
};

/**
 * Modal de unlock de badge — confetti + sprite gigante + descricao.
 * Aceita queue de badges (se mais de 1 vier no mesmo evento, mostra
 * sequencialmente).
 */
export function BadgeUnlockModal({
  badges,
  onClose,
}: {
  badges: AwardedBadge[];
  onClose: () => void;
}) {
  const [idx, setIdx] = React.useState(0);
  if (badges.length === 0) return null;

  const badge = badges[idx]!;
  const isLast = idx === badges.length - 1;
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common!;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-spark-ink/70 backdrop-blur-sm animate-fade-in"
        onClick={handleNext}
      />

      {/* Confetti */}
      <ConfettiBurst />

      {/* Card */}
      <div
        className={cn(
          "relative max-w-[420px] w-full bg-spark-surface rounded-spark-xl border-2 shadow-lift p-8 text-center",
          `ring-4 ${style.ring} ring-offset-4 ring-offset-transparent`,
        )}
        style={{
          animation: "badge-modal-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <button
          onClick={handleNext}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
        >
          <X size={14} />
        </button>

        <div className="text-eyebrow text-spark-brand-deep mb-2">
          ✦ Conquista desbloqueada
        </div>

        {/* Sprite ou icone */}
        <div
          className={cn(
            "mx-auto mb-4 w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center",
            style.from,
            style.to,
          )}
          style={{
            animation: "badge-icon-spin 1.2s ease-out",
          }}
        >
          {badge.icon_url ? (
            <img
              src={badge.icon_url}
              alt={badge.title}
              className="w-24 h-24"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <Award size={64} className="text-spark-brand-deep" strokeWidth={2.2} />
          )}
        </div>

        <h2 className="font-display text-[28px] text-spark-ink leading-tight">
          {badge.title}
        </h2>
        <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-spark-ink-10 text-spark-ink-70 text-[10.5px] font-extrabold uppercase tracking-wide">
          {style.label}
        </div>
        {badge.description && (
          <p className="text-[14px] text-spark-ink-70 mt-3 max-w-[34ch] mx-auto">
            {badge.description}
          </p>
        )}
        {badge.xp_bonus > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[12.5px] font-extrabold">
            <Sparkles size={12} />+{badge.xp_bonus} XP bônus
          </div>
        )}

        <button
          onClick={handleNext}
          className="mt-6 w-full px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all"
        >
          {isLast ? "Continuar" : `Próxima (${badges.length - idx - 1})`}
        </button>
      </div>

      <style>{`
        @keyframes badge-modal-pop {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes badge-icon-spin {
          0% { transform: rotate(-180deg) scale(0); }
          60% { transform: rotate(15deg) scale(1.15); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 250ms ease-out; }
      `}</style>
    </div>
  );
}

/**
 * Confetti simples via SVG circles randomicas. Sem dependencia externa.
 */
function ConfettiBurst() {
  const pieces = React.useMemo(() => {
    const colors = ["#ff5f8d", "#ff8b5f", "#a855f7", "#06b6d4", "#10b981", "#f59e0b"];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 80,
      color: colors[i % colors.length]!,
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 0.8,
      size: 3 + Math.random() * 4,
    }));
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {pieces.map((p) => (
        <circle
          key={p.id}
          cx={50}
          cy={50}
          r={p.size}
          fill={p.color}
          style={{
            animation: `confetti-fly-${p.id} ${p.duration}s ease-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{pieces
        .map(
          (p) => `
        @keyframes confetti-fly-${p.id} {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(${p.x - 50}px, ${p.y - 50 + 30}px); opacity: 0; }
        }
      `,
        )
        .join("")}</style>
    </svg>
  );
}
