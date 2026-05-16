import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  Icon?: React.ElementType;
  emoji?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  iconBg?: string;
  iconFg?: string;
};

export function EmptyState({
  Icon,
  emoji,
  title,
  description,
  actions,
  className,
  iconBg = "oklch(0.96 0.04 350)",
  iconFg = "oklch(0.60 0.22 350)",
}: Props) {
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center px-7 text-center", className)}>
      {emoji ? (
        <div className="text-[56px] mb-4">{emoji}</div>
      ) : Icon ? (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: iconBg, color: iconFg }}
        >
          <Icon size={28} strokeWidth={1.7} />
        </div>
      ) : null}
      <h2 className="text-[22px] font-bold text-spark-ink leading-tight tracking-[-0.02em] mb-2">{title}</h2>
      {description && (
        <p className="text-[14px] text-spark-ink-70 leading-snug max-w-[300px] mb-6">{description}</p>
      )}
      {actions && <div className="flex flex-col gap-2 w-full max-w-[280px]">{actions}</div>}
    </div>
  );
}
