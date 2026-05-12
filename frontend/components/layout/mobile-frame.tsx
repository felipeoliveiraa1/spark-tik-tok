import * as React from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * MobileFrame: container that constrains the app to a 402px-wide column on
 * desktop (so we can preview mobile screens) but flows full-width on phones.
 * Each screen lives inside this — mobile-first.
 */
export function MobileFrame({ children, className }: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-spark-bg">
      <div
        className={cn(
          "flex-1 flex flex-col w-full md:max-w-[402px] md:mx-auto md:my-6 md:rounded-[28px] md:shadow-[0_24px_60px_-30px_rgba(20,20,40,0.25)] md:border md:border-spark-hairline md:overflow-hidden md:min-h-[874px]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
