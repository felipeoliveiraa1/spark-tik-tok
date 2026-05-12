import * as React from "react";
import { cn } from "@/lib/cn";

type IconComp = React.ComponentType<{ size?: number; strokeWidth?: number }>;

type Props = {
  children?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  Icon?: IconComp;
  className?: string;
  as?: "button" | "div";
};

export function SChip({ children, active, onClick, Icon, className, as = "button" }: Props) {
  const cls = cn(
    "inline-flex items-center gap-1.5 px-3 py-[7px] rounded-full font-semibold text-[13px] whitespace-nowrap transition-colors border",
    active
      ? "bg-spark-ink text-white border-spark-ink"
      : "bg-spark-surface text-spark-ink-70 border-spark-hairline hover:border-spark-ink/30",
    className,
  );

  if (as === "div") {
    return (
      <span className={cls}>
        {Icon && <Icon size={13} strokeWidth={1.7} />}
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {Icon && <Icon size={13} strokeWidth={1.7} />}
      {children}
    </button>
  );
}
