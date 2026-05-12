import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  children?: React.ReactNode;
  padding?: number | string;
  onClick?: () => void;
  className?: string;
  as?: "div" | "button" | "a";
  href?: string;
};

export function SCard({ children, padding = 16, onClick, className, as = "div", href }: Props) {
  const cls = cn(
    "bg-spark-surface border border-spark-hairline rounded-[18px] text-left block",
    onClick && "cursor-pointer transition-transform active:scale-[0.99]",
    className,
  );
  const style = { padding } as React.CSSProperties;

  if (as === "a" || href) {
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );
  }
  if (as === "button" || onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
