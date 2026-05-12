import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** Constrain main content width on very wide displays. Default: prose-friendly column. */
  maxWidth?: "narrow" | "medium" | "wide" | "full";
  className?: string;
};

const widths: Record<NonNullable<Props["maxWidth"]>, string> = {
  narrow: "max-w-[640px]",
  medium: "max-w-[960px]",
  wide: "max-w-[1200px]",
  full: "max-w-none",
};

/**
 * DesktopPage — standard content wrapper for desktop screens that don't have
 * a custom multi-pane layout. Pairs with DesktopSidebar via ResponsiveShell.
 */
export function DesktopPage({ children, maxWidth = "medium", className }: Props) {
  return (
    <div className={cn("flex-1 overflow-auto py-10 px-12", className)}>
      <div className={cn("mx-auto", widths[maxWidth])}>{children}</div>
    </div>
  );
}
