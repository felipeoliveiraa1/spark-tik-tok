import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "good" | "warn" | "brand";

type Props = {
  children?: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  neutral: "bg-spark-surface-sunken text-spark-ink-70",
  good: "text-good",
  warn: "text-warn",
  brand: "bg-spark-brand-soft text-spark-brand",
};

const toneStyle: Record<Tone, React.CSSProperties> = {
  neutral: {},
  good: { background: "oklch(0.95 0.04 150)" },
  warn: { background: "oklch(0.96 0.05 80)" },
  brand: {},
};

export function SBadge({ children, tone = "neutral", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-bold uppercase tracking-[0.02em]",
        toneClasses[tone],
        className,
      )}
      style={toneStyle[tone]}
    >
      {children}
    </span>
  );
}
