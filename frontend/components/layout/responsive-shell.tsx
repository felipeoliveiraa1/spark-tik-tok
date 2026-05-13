import * as React from "react";
import { MobileFrame } from "./mobile-frame";
import { PreviewBanner } from "./preview-banner";

type Props = {
  /** Content used in mobile/tablet (<1024px). Falls back to `children` if omitted. */
  mobile?: React.ReactNode;
  /** Content used in desktop (≥1024px). Falls back to `children`. */
  desktop?: React.ReactNode;
  children?: React.ReactNode;
  /** Highlighted nav item — kept for future use, currently unused. */
  active?: string;
  /** If true, hides the "preview/mock data" banner. */
  hideBanner?: boolean;
  /** Kept for backward compat — no longer changes layout. */
  fullBleed?: boolean;
};

export function ResponsiveShell({ mobile, desktop, children, hideBanner }: Props) {
  const mobileNode = mobile ?? children;
  const desktopNode = desktop ?? children;

  return (
    <>
      <div className="lg:hidden">
        {!hideBanner && <PreviewBanner />}
        <MobileFrame>{mobileNode}</MobileFrame>
      </div>
      <div className="hidden lg:flex flex-col min-h-dvh w-full bg-spark-bg">
        {!hideBanner && <PreviewBanner />}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 min-w-0 flex flex-col">{desktopNode}</main>
        </div>
      </div>
    </>
  );
}
