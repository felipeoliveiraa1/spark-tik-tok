"use client";

import Link from "next/link";
import { Lock, Check, ChevronRight } from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

const BG_PATHS = [
  "/sprites/map/journey-1-bg.png",
  "/sprites/map/journey-2-bg.png",
  "/sprites/map/journey-3-bg.png",
];

type Journey = {
  id: string;
  slug: string;
  title: string;
  character_stage: CharacterStage;
  is_completed: boolean;
  is_current: boolean;
  is_locked: boolean;
  is_admin_only: boolean;
  pct_complete: number;
};

/**
 * Card de jornada full-bleed pra hub /jornadas. Substitui o grid 3-col do
 * WorldMap que ficava ilegivel em mobile (cards de ~100px). Aqui cada card
 * eh aspect-[4/3] full-width — em 375px da ~343x256, espaco sobrando pro
 * sprite, badges, progress e CTA. Imagem pixelada vira object-cover com
 * fallback color caso BG nao carregue.
 */
export function JourneyCard({
  journey,
  index,
  characterStage,
  isAdmin,
  priority,
}: {
  journey: Journey;
  index: number;
  characterStage: CharacterStage;
  isAdmin: boolean;
  priority?: boolean;
}) {
  const bg = BG_PATHS[index] ?? BG_PATHS[0];
  const disabled = journey.is_locked && !isAdmin;
  const num = index + 1;
  const statusLabel = journey.is_completed
    ? "Concluída"
    : journey.is_current
      ? "Em andamento"
      : disabled
        ? "Bloqueada"
        : "Disponível";

  const inner = (
    <div
      className={cn(
        "relative aspect-[4/3] w-full rounded-spark-xl overflow-hidden border-2 shadow-lift transition-transform",
        journey.is_current && "border-spark-brand",
        journey.is_completed && "border-emerald-400",
        disabled && "border-spark-ink/15",
        !disabled && "active:scale-[0.98] hover:shadow-lift-brand",
      )}
    >
      {/* BG pixel art */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: "pixelated" }}
        aria-hidden
      />

      {/* Tint colorido (nao grayscale — menos deprimente) */}
      {disabled && (
        <div
          className="absolute inset-0 bg-slate-900/55 mix-blend-multiply"
          aria-hidden
        />
      )}

      {/* Halo current via opacity (nao box-shadow, GPU-friendly) */}
      {journey.is_current && (
        <div
          className="absolute inset-0 pointer-events-none rounded-spark-xl ring-inset ring-4 ring-spark-brand/60"
          style={{ animation: "halo-pulse 2.2s ease-in-out infinite" }}
          aria-hidden
        />
      )}

      {/* Badge numerico top-left (44x44 atinge HIG) */}
      <div
        className={cn(
          "absolute top-3 left-3 w-11 h-11 rounded-full border-2 flex items-center justify-center font-display text-[18px] shadow-lift z-10",
          journey.is_completed && "bg-emerald-500 border-white text-white",
          journey.is_current &&
            !journey.is_completed &&
            "bg-white border-spark-brand text-spark-brand-deep",
          (disabled || (!journey.is_current && !journey.is_completed)) &&
            !journey.is_completed &&
            !journey.is_current &&
            "bg-spark-ink/70 border-white/80 text-white",
        )}
      >
        {journey.is_completed ? (
          <Check size={20} strokeWidth={3} />
        ) : (
          num
        )}
      </div>

      {/* Status pill top-right */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide backdrop-blur bg-white/90 text-spark-ink z-10">
        {statusLabel}
      </div>

      {/* Sprite (so current — evita repetir bonequinho como no Story Deck) */}
      {journey.is_current && !disabled && (
        <div
          className="absolute right-4 z-[5] pointer-events-none"
          style={{
            bottom: "30%",
            animation: "character-float 3s ease-in-out infinite",
          }}
          aria-hidden
        >
          <CharacterSprite stage={characterStage} anim="idle" scale={1.5} />
        </div>
      )}

      {/* Footer com gradient + conteudo textual */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 text-white z-[6] bg-gradient-to-t from-spark-ink/90 via-spark-ink/55 to-transparent">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">
          Jornada {num}
        </div>
        <h2
          className="font-display text-[22px] leading-tight mt-0.5"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
        >
          {journey.title}
        </h2>

        {/* Progress bar so se em andamento */}
        {journey.is_current && journey.pct_complete > 0 && !journey.is_completed && (
          <div className="mt-2.5">
            <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-spark-brand transition-all"
                style={{ width: `${Math.min(100, journey.pct_complete)}%` }}
              />
            </div>
            <div className="text-[11.5px] mt-1 font-bold text-white/90">
              {Math.round(journey.pct_complete)}% completo
            </div>
          </div>
        )}

        {/* CTA inline conforme estado */}
        <div className="mt-3 flex items-center justify-between">
          {journey.is_current && !disabled && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-spark-brand text-white text-[12.5px] font-extrabold shadow-lift-brand">
              Continuar <ChevronRight size={13} strokeWidth={2.8} />
            </span>
          )}
          {journey.is_completed && (
            <span className="inline-flex items-center gap-1 text-[12.5px] font-extrabold text-emerald-200">
              ✓ Concluída
              <span className="ml-2 text-white/80 underline decoration-white/40">
                Rever
              </span>
            </span>
          )}
          {disabled && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white/85">
              <Lock size={13} /> Termine a Jornada {num - 1}
            </span>
          )}
          {!journey.is_current &&
            !journey.is_completed &&
            !disabled && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 text-spark-ink text-[12.5px] font-extrabold">
                Começar <ChevronRight size={13} strokeWidth={2.8} />
              </span>
            )}
          {isAdmin && journey.is_admin_only && (
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-400/90 text-spark-ink">
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const a11yLabel = `Jornada ${num}: ${journey.title} — ${statusLabel}`;

  if (disabled) {
    return (
      <div
        role="button"
        aria-disabled="true"
        aria-label={a11yLabel}
        className="cursor-not-allowed select-none"
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/jornadas/${journey.slug}`}
      aria-label={a11yLabel}
      className="block"
    >
      {inner}
    </Link>
  );
}
