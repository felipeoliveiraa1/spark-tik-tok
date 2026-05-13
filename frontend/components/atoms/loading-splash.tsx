import * as React from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: number; gap: string; label: string }> = {
  sm: { box: 48, gap: "py-6", label: "text-[11px]" },
  md: { box: 64, gap: "py-10", label: "text-[12px]" },
  lg: { box: 84, gap: "py-14", label: "text-[13px]" },
};

type Props = {
  size?: Size;
  message?: string;
  className?: string;
};

/**
 * Splash de carregamento — caixinha sorridente com laço que balança e sparkles
 * que piscam. Usado nas páginas que fazem fetch client-side enquanto os dados
 * chegam do Supabase.
 */
export function LoadingSplash({ size = "md", message = "Carregando…", className }: Props) {
  const s = sizes[size];
  return (
    <div className={cn("flex flex-col items-center justify-center", s.gap, className)}>
      <div className="relative" style={{ width: s.box * 1.4, height: s.box * 1.4 }}>
        {/* Sparkles em volta */}
        <span
          aria-hidden
          className="absolute top-1 right-3 text-spark-brand animate-splash-sparkle"
          style={{ fontSize: s.box * 0.22 }}
        >
          ✦
        </span>
        <span
          aria-hidden
          className="absolute bottom-6 left-1 text-spark-brand animate-splash-sparkle"
          style={{ fontSize: s.box * 0.18, animationDelay: "0.3s" }}
        >
          ✦
        </span>
        <span
          aria-hidden
          className="absolute top-6 left-0 text-spark-brand-deep animate-splash-sparkle"
          style={{ fontSize: s.box * 0.14, animationDelay: "0.6s" }}
        >
          ★
        </span>

        {/* Sombra */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-spark-ink animate-splash-shadow"
          style={{ bottom: 4, width: s.box * 0.85, height: s.box * 0.08 }}
        />

        {/* Caixinha animada */}
        <div
          className="absolute left-1/2 -translate-x-1/2 animate-splash-bounce"
          style={{ bottom: s.box * 0.18 }}
        >
          <CutePackage size={s.box} />
        </div>
      </div>
      {message && (
        <div
          className={cn(
            "mt-2 font-bold text-spark-ink-50 tracking-[0.08em] uppercase",
            s.label,
          )}
        >
          {message}
        </div>
      )}
    </div>
  );
}

function CutePackage({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corpo da caixa */}
      <rect x="8" y="24" width="48" height="32" rx="3" fill="#F4D6A8" />
      {/* Sombra interna na lateral pra dar volume */}
      <rect x="8" y="24" width="48" height="32" rx="3" fill="url(#boxShade)" />
      {/* Tampa */}
      <rect x="6" y="20" width="52" height="8" rx="2" fill="#E9C28A" />

      {/* Fita vertical */}
      <rect x="30" y="20" width="4" height="36" fill="oklch(0.55 0.22 305)" />
      {/* Fita horizontal */}
      <rect x="6" y="22" width="52" height="4" fill="oklch(0.55 0.22 305)" />

      {/* Laço */}
      <ellipse cx="26" cy="16" rx="6" ry="4" fill="oklch(0.62 0.22 340)" />
      <ellipse cx="38" cy="16" rx="6" ry="4" fill="oklch(0.62 0.22 340)" />
      <circle cx="32" cy="20" r="3.5" fill="oklch(0.55 0.22 305)" />

      {/* Carinha fofa */}
      <circle cx="24" cy="38" r="2" fill="#3D2415" />
      <circle cx="40" cy="38" r="2" fill="#3D2415" />
      {/* Bochechas */}
      <circle cx="20" cy="42" r="2.5" fill="oklch(0.85 0.1 25)" opacity="0.5" />
      <circle cx="44" cy="42" r="2.5" fill="oklch(0.85 0.1 25)" opacity="0.5" />
      {/* Sorriso */}
      <path
        d="M 26 44 Q 32 49 38 44"
        stroke="#3D2415"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient id="boxShade" x1="0" y1="24" x2="0" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
    </svg>
  );
}
