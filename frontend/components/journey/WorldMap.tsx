"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import { type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type JourneyPoi = {
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

const JOURNEY_BG_PATHS = [
  "/sprites/map/journey-1-bg.png",
  "/sprites/map/journey-2-bg.png",
  "/sprites/map/journey-3-bg.png",
];

const JOURNEY_TITLES_FALLBACK = ["Praia da Iniciante", "Vila Adolescente", "Cidade Adulta"];

/**
 * Mapa fullscreen com 3 ILHAS separadas (uma por jornada), conectadas
 * por path tracejado. Cada ilha = um card quadrado com a imagem
 * journey-{n}-bg.png como background.
 *
 * Estados visuais:
 * - locked: grayscale + dim overlay + cadeado gigante centralizado
 * - current: borda rosa + halo pulsante + personagem em cima
 * - completed: borda verde + check + tag "concluida"
 * - locked (admin): admin ve normal (sem grayscale), com badge BETA
 */
export function WorldMap({
  journeys,
  characterStage,
  isAdmin,
}: {
  journeys: JourneyPoi[];
  characterStage: CharacterStage;
  isAdmin: boolean;
}) {
  return (
    <div className="relative w-full">
      {/* SVG do path tracejado conectando os cards (atras) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {journeys.slice(0, -1).map((j, i) => {
          const next = journeys[i + 1]!;
          const isSegmentDone = j.is_completed;
          const isSegmentActive =
            j.is_completed && (next.is_current || (!next.is_completed && !next.is_locked));
          const color = isSegmentDone
            ? "#10b981"
            : isSegmentActive
              ? "#ff5f8d"
              : "#c1c1c1";
          const opacity = isSegmentDone || isSegmentActive ? 0.85 : 0.4;
          // Conecta lado direito do card i ao lado esquerdo do card i+1
          const x1 = ((i + 0.5) / journeys.length) * 100 + (50 / journeys.length) * 0.6;
          const x2 = ((i + 1 + 0.5) / journeys.length) * 100 - (50 / journeys.length) * 0.6;
          return (
            <line
              key={`seg-${i}`}
              x1={x1}
              y1={50}
              x2={x2}
              y2={50}
              stroke={color}
              strokeWidth="0.8"
              strokeDasharray="2 1.2"
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* Grid das 3 ilhas */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 relative" style={{ zIndex: 1 }}>
        {journeys.slice(0, 3).map((poi, idx) => (
          <JourneyIsland
            key={poi.id}
            poi={poi}
            index={idx}
            isAdmin={isAdmin}
            characterStage={characterStage}
          />
        ))}
      </div>
    </div>
  );
}

function JourneyIsland({
  poi,
  index,
  isAdmin,
  characterStage,
}: {
  poi: JourneyPoi;
  index: number;
  isAdmin: boolean;
  characterStage: CharacterStage;
}) {
  const bgPath = JOURNEY_BG_PATHS[index] ?? JOURNEY_BG_PATHS[0]!;
  const fallbackTitle = JOURNEY_TITLES_FALLBACK[index] ?? "";

  // Aluna ve grayscale se locked. Admin ve normal mas com badge BETA.
  const showGrayscale = poi.is_locked && !isAdmin;
  const disabled = poi.is_locked && !isAdmin;
  const num = index + 1;

  const statusLabel = poi.is_completed
    ? "Concluída"
    : poi.is_current
      ? "Em andamento"
      : poi.is_locked
        ? "Bloqueada"
        : "Disponível";

  return (
    <div className="flex flex-col">
      <Link
        href={disabled ? "#" : `/jornadas/${poi.slug}`}
        aria-label={`Jornada ${num}: ${poi.title} — ${statusLabel}`}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group relative block aspect-square rounded-spark-xl overflow-hidden transition-all duration-300",
          "border-[3px] shadow-lift",
          poi.is_completed && "border-emerald-400",
          poi.is_current && "border-spark-brand",
          !poi.is_completed && !poi.is_current && !poi.is_locked && "border-spark-hairline",
          poi.is_locked && "border-spark-ink-35/40",
          disabled
            ? "cursor-not-allowed"
            : "cursor-pointer hover:-translate-y-1 hover:shadow-2xl",
        )}
      >
        {/* Background da jornada */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgPath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            filter: showGrayscale ? "grayscale(100%) brightness(0.6)" : undefined,
            transition: "filter 400ms",
          }}
        />

        {/* Dim overlay extra pra locked */}
        {showGrayscale && (
          <div className="absolute inset-0 bg-black/30" aria-hidden />
        )}

        {/* Halo de pulso pra current */}
        {poi.is_current && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 0 4px rgba(255, 95, 141, 0.45)",
              animation: "island-pulse 2s ease-in-out infinite",
            }}
            aria-hidden
          />
        )}

        {/* Numero do POI no canto superior esquerdo */}
        <div
          className={cn(
            "absolute top-3 left-3 w-9 h-9 rounded-full border-2 flex items-center justify-center font-display text-[16px] shadow-lift",
            poi.is_completed
              ? "bg-emerald-500 border-white text-white"
              : poi.is_current
                ? "bg-white border-spark-brand text-spark-brand-deep"
                : poi.is_locked
                  ? "bg-spark-ink/60 border-white/70 text-white"
                  : "bg-white border-spark-hairline text-spark-ink-70",
          )}
        >
          {poi.is_completed ? <Check size={16} strokeWidth={3} /> : num}
        </div>

        {/* Status badge no canto superior direito */}
        {(poi.is_completed || poi.is_current || (poi.is_admin_only && isAdmin)) && (
          <div
            className={cn(
              "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border-[1.5px] backdrop-blur",
              poi.is_completed && "bg-emerald-50/90 border-emerald-300 text-emerald-700",
              poi.is_current && !poi.is_completed && "bg-spark-brand-soft/90 border-spark-brand text-spark-brand-deep",
              !poi.is_completed && !poi.is_current && poi.is_admin_only && isAdmin && "bg-orange-100/90 border-orange-400 text-orange-800",
            )}
          >
            {poi.is_completed
              ? "Concluída"
              : poi.is_current
                ? "Em andamento"
                : "Beta"}
          </div>
        )}

        {/* Cadeado gigante centralizado (so se locked + nao admin) */}
        {showGrayscale && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-spark-ink/80 backdrop-blur rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-2xl">
              <Lock size={32} strokeWidth={2.5} className="text-white md:hidden" />
              <Lock size={40} strokeWidth={2.5} className="text-white hidden md:block" />
            </div>
          </div>
        )}

        {/* Personagem em cima do card atual */}
        {poi.is_current && (
          <div
            className="absolute pointer-events-none"
            style={{
              right: "8%",
              bottom: "8%",
              animation: "character-float 3s ease-in-out infinite",
            }}
          >
            <CharacterSprite stage={characterStage} anim="idle" scale={1.5} />
          </div>
        )}

        {/* Progress bar embaixo se em progresso */}
        {poi.pct_complete > 0 && !poi.is_completed && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-spark-ink/30">
            <div
              className="h-full bg-spark-brand transition-all duration-500"
              style={{ width: `${poi.pct_complete}%` }}
            />
          </div>
        )}

        {/* Hover gradient sutil */}
        {!disabled && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)",
            }}
            aria-hidden
          />
        )}
      </Link>

      {/* Caption embaixo do card — fora da imagem, sem sobrepor nada */}
      <div className="mt-3 text-center px-1">
        <div className="text-eyebrow text-spark-brand-deep mb-0.5">
          Jornada {num}
        </div>
        <div
          className={cn(
            "font-display text-[15px] md:text-[18px] leading-tight",
            disabled ? "text-spark-ink-50" : "text-spark-ink",
          )}
        >
          {poi.title || fallbackTitle}
        </div>
        {poi.pct_complete > 0 && !poi.is_completed && (
          <div className="text-[11px] text-spark-brand-deep font-extrabold mt-1">
            {poi.pct_complete}% completo
          </div>
        )}
      </div>

      <style>{`
        @keyframes island-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes character-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
