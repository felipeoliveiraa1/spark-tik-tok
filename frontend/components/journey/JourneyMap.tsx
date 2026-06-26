"use client";

import * as React from "react";
import Link from "next/link";
import { CharacterSprite } from "@/components/journey/CharacterSprite";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { cn } from "@/lib/cn";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  map_x: number | null;
  map_y: number | null;
  completed: boolean;
  locked: boolean;
};

/**
 * Mini-mapa SVG do joguinho. Conecta os pontos (map_x, map_y) das aulas
 * em ordem com um path tracejado. Personagem fica posicionado no
 * currentLessonId (ou na primeira nao-completed). Backgrond opcional.
 *
 * Se uma aula nao tiver map_x/map_y, eh distribuida em zigzag automatico
 * pra nao quebrar a visualizacao.
 */
export function JourneyMap({
  lessons,
  currentLessonId,
  stage,
  backgroundUrl,
  journeySlug,
}: {
  lessons: Lesson[];
  currentLessonId: string | null;
  stage: CharacterStage;
  backgroundUrl?: string | null;
  journeySlug: string;
}) {
  // Distribui em zigzag pras aulas sem map_x/map_y definido
  const positioned = React.useMemo(() => {
    return lessons.map((l, i) => {
      const fallbackX = 12 + ((i % 5) * 18); // 12, 30, 48, 66, 84
      const fallbackY = 25 + Math.floor(i / 5) * 25 + (i % 2 === 0 ? -8 : 8);
      return {
        ...l,
        x: l.map_x ?? fallbackX,
        y: l.map_y ?? fallbackY,
      };
    });
  }, [lessons]);

  // Personagem fica na aula "current": primeira nao completed E nao locked
  const characterLesson =
    positioned.find((l) => l.id === currentLessonId) ??
    positioned.find((l) => !l.completed && !l.locked) ??
    positioned[positioned.length - 1] ?? null;

  // Path SVG conectando pontos em ordem
  const pathD = positioned.reduce((acc, l, i) => {
    const cmd = i === 0 ? "M" : " L";
    return `${acc}${cmd} ${l.x} ${l.y}`;
  }, "");

  return (
    <div
      className="relative w-full aspect-[16/10] rounded-spark-xl border-2 border-spark-hairline overflow-hidden"
      style={{
        backgroundColor: "#fdf2f4",
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: backgroundUrl ? "pixelated" : "auto",
      }}
    >
      {/* SVG layer: path tracejado + checkpoints */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Background gradient suave atras dos checkpoints (caso nao tenha bg) */}
        {!backgroundUrl && (
          <>
            <defs>
              <linearGradient id="journey-bg-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fdb4c2" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#ffd6a8" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#journey-bg-grad)" />
          </>
        )}

        {/* Path tracejado conectando pontos */}
        <path
          d={pathD}
          stroke="#ff7a9c"
          strokeWidth="0.6"
          strokeDasharray="1.5 1"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />

        {/* Checkpoints */}
        {positioned.map((l, idx) => (
          <g key={l.id}>
            {/* Circle background */}
            <circle
              cx={l.x}
              cy={l.y}
              r={l.completed ? 3.2 : 2.6}
              fill={
                l.completed
                  ? "#10b981"
                  : l.locked
                    ? "#9ca3af"
                    : l.id === characterLesson?.id
                      ? "#ff5f8d"
                      : "#fff"
              }
              stroke={l.locked ? "#6b7280" : "#ff5f8d"}
              strokeWidth={l.id === characterLesson?.id ? 0.7 : 0.4}
              opacity={l.locked ? 0.5 : 1}
            />
            {/* Number */}
            <text
              x={l.x}
              y={l.y + 1}
              textAnchor="middle"
              fontSize="2"
              fontWeight="800"
              fill={l.completed ? "#fff" : l.locked ? "#fff" : l.id === characterLesson?.id ? "#fff" : "#ff5f8d"}
              style={{ pointerEvents: "none", fontFamily: "system-ui, sans-serif" }}
            >
              {idx + 1}
            </text>
          </g>
        ))}
      </svg>

      {/* Layer de clicks (links transparentes em cima de cada checkpoint) */}
      {positioned.map((l) => (
        <Link
          key={`link-${l.id}`}
          href={l.locked ? "#" : `/jornadas/${journeySlug}/aula/${l.slug}`}
          aria-label={`Aula ${l.order_index}: ${l.title}${l.locked ? " (bloqueada)" : l.completed ? " (concluída)" : ""}`}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full",
            l.locked
              ? "cursor-not-allowed"
              : "hover:bg-white/20 transition-colors",
          )}
          style={{ left: `${l.x}%`, top: `${l.y}%` }}
          tabIndex={l.locked ? -1 : 0}
        />
      ))}

      {/* Personagem posicionado */}
      {characterLesson && (
        <div
          className="absolute pointer-events-none transition-all duration-700 ease-out"
          style={{
            left: `${characterLesson.x}%`,
            top: `${characterLesson.y}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <CharacterSprite stage={stage} anim="idle" scale={2} />
        </div>
      )}

      {/* Tooltip flutuante com o nome da aula atual */}
      {characterLesson && (
        <div
          className="absolute pointer-events-none bg-white/95 backdrop-blur px-2.5 py-1 rounded-full border border-spark-hairline shadow-rest text-[11px] font-extrabold text-spark-ink whitespace-nowrap"
          style={{
            left: `${characterLesson.x}%`,
            top: `${characterLesson.y}%`,
            transform: "translate(-50%, -260%)",
          }}
        >
          {characterLesson.title}
        </div>
      )}
    </div>
  );
}
