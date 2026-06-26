"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Check, Sparkles } from "lucide-react";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import { STAGE_EMOJI, type CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type JourneyPoi = {
  id: string;
  slug: string;
  title: string;
  character_stage: CharacterStage;
  is_completed: boolean;
  is_current: boolean;   // jornada em progresso da aluna
  is_locked: boolean;    // sequencia: precisa terminar anterior
  is_admin_only: boolean;
  pct_complete: number;
};

/**
 * Mapa de mundo fullscreen com os 3 POIs das jornadas.
 *
 * Posicionamento em % do container — funciona em qualquer aspect ratio.
 * Background fica sendo /sprites/map/overworld.png (gerado pelo script).
 * Se nao existe ainda, fallback pra gradient pastel + dots SVG.
 *
 * Personagem fica no POI atual (current_journey) ou no primeiro nao-completed.
 * Path tracejado conectando POIs (verde se completo, neon-pink se atual, dim se locked).
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
  // Posicionamento manual dos 3 POIs no mapa (% do container)
  // Ajustar se for trocar o background pra um com layout diferente.
  const POI_POSITIONS = [
    { x: 18, y: 70 },  // Jornada 1 — esquerda baixo (praia)
    { x: 50, y: 45 },  // Jornada 2 — centro (vila)
    { x: 82, y: 30 },  // Jornada 3 — direita topo (cidade)
  ];

  const poisWithPos = journeys.slice(0, 3).map((j, idx) => ({
    ...j,
    x: POI_POSITIONS[idx]?.x ?? 50,
    y: POI_POSITIONS[idx]?.y ?? 50,
  }));

  // Personagem fica em current ou primeiro nao-completed ou no ultimo
  const characterPoi =
    poisWithPos.find((p) => p.is_current) ??
    poisWithPos.find((p) => !p.is_completed && !p.is_locked) ??
    poisWithPos[poisWithPos.length - 1] ??
    null;

  // Path conectando os pontos
  const pathD = poisWithPos.reduce(
    (acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    "",
  );

  const [bgLoaded, setBgLoaded] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.onerror = () => setBgLoaded(false);
    img.src = "/sprites/map/overworld.png";
  }, []);

  return (
    <div
      className="relative w-full aspect-[3/2] md:aspect-[16/10] rounded-spark-xl border-2 border-spark-hairline overflow-hidden shadow-lift"
      style={{
        backgroundColor: "#fff5f7",
        backgroundImage: bgLoaded ? "url(/sprites/map/overworld.png)" : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: bgLoaded ? "pixelated" : "auto",
      }}
    >
      {/* Fallback gradient + decoracoes se bg nao existe ainda */}
      {!bgLoaded && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #ffe0e8 0%, #fff0d6 33%, #f3e0ff 66%, #ffe0e8 100%)",
            }}
          />
          {/* Decorative tiles */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-40">
            <defs>
              <pattern id="tile-pattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="0.4" fill="#ff5f8d" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#tile-pattern)" />
          </svg>
          {/* Mock "areas" labels */}
          <div className="absolute bottom-[18%] left-[12%] text-[8px] md:text-[10px] font-extrabold text-spark-ink-50/60 uppercase tracking-wider">
            🌴 praia
          </div>
          <div className="absolute top-[40%] left-[44%] text-[8px] md:text-[10px] font-extrabold text-spark-ink-50/60 uppercase tracking-wider">
            🏘️ vila
          </div>
          <div className="absolute top-[22%] right-[12%] text-[8px] md:text-[10px] font-extrabold text-spark-ink-50/60 uppercase tracking-wider">
            🏙️ cidade
          </div>
        </div>
      )}

      {/* Path SVG conectando POIs */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Drop shadow do path */}
        <path
          d={pathD}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1.5"
          strokeDasharray="2.4 1.6"
          strokeLinecap="round"
          fill="none"
          transform="translate(0.3, 0.3)"
        />
        {/* Path principal: gradient por segmento (completo verde, atual rosa, locked dim) */}
        {poisWithPos.slice(0, -1).map((p, i) => {
          const next = poisWithPos[i + 1]!;
          const isSegmentDone = p.is_completed;
          const isSegmentActive = p.is_completed && (next.is_current || (!next.is_completed && !next.is_locked));
          const color = isSegmentDone
            ? "#10b981" // verde (done)
            : isSegmentActive
              ? "#ff5f8d" // pink (active path)
              : "#9ca3af"; // gray (future)
          const opacity = isSegmentDone || isSegmentActive ? 0.85 : 0.35;
          return (
            <path
              key={i}
              d={`M ${p.x} ${p.y} L ${next.x} ${next.y}`}
              stroke={color}
              strokeWidth="1.2"
              strokeDasharray="2.4 1.6"
              strokeLinecap="round"
              fill="none"
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* POIs como buttons clicaveis */}
      {poisWithPos.map((poi, idx) => (
        <PoiMarker
          key={poi.id}
          poi={poi}
          index={idx}
          isAdmin={isAdmin}
        />
      ))}

      {/* Personagem na posicao atual */}
      {characterPoi && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-out"
          style={{
            left: `${characterPoi.x}%`,
            top: `${characterPoi.y}%`,
            transform: "translate(-50%, -130%)",
            zIndex: 30,
          }}
        >
          <CharacterSprite
            stage={characterStage}
            anim="idle"
            scale={2}
          />
        </div>
      )}

      {/* Tooltip flutuante com nome da jornada atual */}
      {characterPoi && (
        <div
          className="absolute pointer-events-none bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border-2 border-spark-hairline shadow-lift text-[11px] font-extrabold text-spark-ink whitespace-nowrap z-30"
          style={{
            left: `${characterPoi.x}%`,
            top: `${characterPoi.y}%`,
            transform: "translate(-50%, -280%)",
          }}
        >
          <span className="text-spark-brand-deep mr-1">✦</span>
          {characterPoi.title}
        </div>
      )}
    </div>
  );
}

function PoiMarker({
  poi,
  index,
  isAdmin,
}: {
  poi: JourneyPoi & { x: number; y: number };
  index: number;
  isAdmin: boolean;
}) {
  const disabled = poi.is_locked && !isAdmin;
  const num = index + 1;

  return (
    <Link
      href={disabled ? "#" : `/jornadas/${poi.slug}`}
      aria-label={`Jornada ${num}: ${poi.title}${poi.is_completed ? " (concluída)" : poi.is_locked ? " (bloqueada)" : ""}`}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 group",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
      style={{
        left: `${poi.x}%`,
        top: `${poi.y}%`,
        zIndex: 20,
      }}
    >
      {/* Halo de pulso pra POI atual */}
      {poi.is_current && (
        <div
          className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark-brand"
          style={{
            width: "80px",
            height: "80px",
            left: "50%",
            top: "50%",
            opacity: 0.3,
            animation: "poi-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Body do marker */}
      <div
        className={cn(
          "relative w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center font-display text-[18px] md:text-[22px] shadow-lift transition-all duration-300",
          poi.is_completed
            ? "bg-emerald-500 border-white text-white"
            : poi.is_locked
              ? "bg-spark-ink-35 border-white/60 text-white/60 grayscale"
              : poi.is_current
                ? "bg-white border-spark-brand text-spark-brand-deep group-hover:scale-110"
                : "bg-white border-spark-hairline text-spark-ink-70 group-hover:scale-110 group-hover:border-spark-brand/40",
          disabled && "opacity-50",
        )}
      >
        {poi.is_completed ? (
          <Check size={24} strokeWidth={3} />
        ) : poi.is_locked && !isAdmin ? (
          <Lock size={18} strokeWidth={2.5} />
        ) : (
          num
        )}
      </div>

      {/* Stage emoji no canto */}
      <span
        className="absolute text-[18px] md:text-[22px] -bottom-1 -right-1 rotate-12"
        style={{ lineHeight: 1 }}
      >
        {STAGE_EMOJI[poi.character_stage]}
      </span>

      {/* Tooltip on hover (so se nao for locked) */}
      {!disabled && (
        <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
          <div className="bg-spark-ink text-white px-3 py-1.5 rounded-spark-lg text-[11px] font-extrabold whitespace-nowrap shadow-lift">
            {poi.title}
            {poi.is_admin_only && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-orange-500/80 text-white">
                BETA
              </span>
            )}
            {poi.pct_complete > 0 && !poi.is_completed && (
              <div className="text-[10px] font-mono opacity-80 mt-0.5">
                {poi.pct_complete}% completo
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes poi-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>
    </Link>
  );
}
