"use client";

import { Copy, Pencil, Star, Flame } from "lucide-react";
import { SBadge } from "@/components/atoms/s-badge";
import { cn } from "@/lib/cn";

export type HookCardData = {
  number: number;
  text: string;
  emotion: string;
  trigger: string;
  reason: string;
  fire: 1 | 2 | 3;
};

type Props = {
  hook: HookCardData;
  className?: string;
};

export function HookCard({ hook, className }: Props) {
  return (
    <div className={cn("bg-spark-surface border border-spark-hairline rounded-[18px] p-3.5", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] font-bold text-spark-ink-50 uppercase tracking-[0.1em] font-mono">
          Hook {String(hook.number).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: hook.fire }).map((_, i) => (
            <Flame key={i} size={13} strokeWidth={1.7} className="text-agent-viral-fg" fill="currentColor" />
          ))}
          {Array.from({ length: 3 - hook.fire }).map((_, i) => (
            <Flame key={`o${i}`} size={13} strokeWidth={1.7} className="text-spark-ink-20" />
          ))}
        </div>
      </div>

      <p className="text-[15px] font-semibold text-spark-ink leading-snug tracking-[-0.01em]">
        “{hook.text}”
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <SBadge tone="brand">{hook.emotion}</SBadge>
        <SBadge tone="neutral">{hook.trigger}</SBadge>
      </div>

      <p className="mt-2.5 text-[12px] text-spark-ink-70 leading-snug">{hook.reason}</p>

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken text-spark-ink-70 text-[11.5px] font-semibold hover:bg-spark-ink-20 transition-colors"
        >
          <Copy size={12} strokeWidth={2} /> Copiar
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken text-spark-ink-70 text-[11.5px] font-semibold hover:bg-spark-ink-20 transition-colors"
        >
          <Pencil size={12} strokeWidth={2} /> Editar
        </button>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken text-spark-ink-70 text-[11.5px] font-semibold hover:bg-spark-ink-20 transition-colors"
        >
          <Star size={12} strokeWidth={2} /> Usei
        </button>
      </div>
    </div>
  );
}
