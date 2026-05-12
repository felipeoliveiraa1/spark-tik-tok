import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function SectionHead({ children, action, className }: Props) {
  return (
    <div className={cn("flex items-baseline justify-between px-4 mb-2.5", className)}>
      <span className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">{children}</span>
      {action && <span className="text-[13px] text-spark-brand font-semibold">{action}</span>}
    </div>
  );
}
