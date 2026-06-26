"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Lesson = {
  id: string;
  completed: boolean;
  locked: boolean;
};

/**
 * Barra de progresso segmentada estilo IG/TikTok stories.
 * - Cada segmento = 1 aula. Ultimo = prova final (estrela)
 * - Status colors: completed verde, current rosa, locked branco/30
 * - >8 segmentos: ainda mostra todos mas fininhos (flex-1, max 6px wide)
 * - Tap em segmento = onJump(idx)
 */
export function StoryProgressDots({
  lessons,
  activeIdx,
  onJump,
  proofStatus,
}: {
  lessons: Lesson[];
  activeIdx: number;
  onJump: (idx: number) => void;
  proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready";
}) {
  const total = lessons.length + 1; // +1 pra prova
  const proofIdx = lessons.length;

  return (
    <div
      role="tablist"
      aria-label="Progresso da jornada"
      className="flex items-center gap-1 w-full"
    >
      {lessons.map((l, i) => {
        const isActive = i === activeIdx;
        const isPast = l.completed || (i < activeIdx && !l.locked);
        return (
          <button
            key={l.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`Aula ${i + 1}${l.completed ? " concluída" : l.locked ? " bloqueada" : ""}`}
            onClick={() => onJump(i)}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300 min-w-[8px]",
              l.completed
                ? "bg-emerald-400"
                : isActive
                  ? "bg-spark-brand h-1.5"
                  : isPast
                    ? "bg-white/60"
                    : l.locked
                      ? "bg-white/25"
                      : "bg-white/45",
            )}
            style={{
              maxWidth: total > 8 ? "40px" : "60px",
            }}
          />
        );
      })}

      {/* Star: prova final */}
      <button
        role="tab"
        aria-selected={activeIdx === proofIdx}
        aria-label={`Prova final ${proofStatus === "approved" ? "aprovada" : proofStatus === "pending" ? "em análise" : proofStatus === "rejected" ? "rejeitada" : proofStatus === "ready" ? "liberada" : "bloqueada"}`}
        onClick={() => onJump(proofIdx)}
        className={cn(
          "shrink-0 transition-all duration-300 flex items-center justify-center",
          activeIdx === proofIdx ? "scale-125" : "scale-100",
        )}
        style={{ width: "14px", height: "14px" }}
      >
        <span
          className={cn(
            "text-[12px] leading-none",
            proofStatus === "approved"
              ? "text-emerald-400"
              : proofStatus === "ready" || proofStatus === "pending"
                ? "text-amber-300"
                : proofStatus === "rejected"
                  ? "text-red-400"
                  : "text-white/40",
          )}
        >
          ★
        </span>
      </button>
    </div>
  );
}
