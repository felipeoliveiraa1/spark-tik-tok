import * as React from "react";
import { MobileFrame } from "./mobile-frame";
import { DesktopSidebar, type SidebarActive } from "./desktop-sidebar";
import { PreviewBanner } from "./preview-banner";

type Props = {
  /** Content used in mobile/tablet (<1024px). Falls back to `children` if omitted. */
  mobile?: React.ReactNode;
  /** Content used in desktop (≥1024px). Falls back to `children` wrapped in a centered column. */
  desktop?: React.ReactNode;
  /** Default content when neither mobile/desktop are explicitly provided. */
  children?: React.ReactNode;
  /** Highlighted sidebar item in desktop view. */
  active?: SidebarActive;
  /** If true, desktop renders without the sidebar (e.g. login, onboarding). */
  fullBleed?: boolean;
  /** If true, hides the "preview/mock data" banner. */
  hideBanner?: boolean;
};

/**
 * ResponsiveShell — picks the right chrome per breakpoint.
 *
 * - <lg: MobileFrame (constrained 402px column on tablet, full-bleed on phone).
 * - ≥lg: Optional DesktopSidebar + main flowing area.
 *
 * Also stamps a preview banner at the top while the app runs on mock data,
 * unless `hideBanner` is set (landing page handles its own messaging).
 */
export function ResponsiveShell({ mobile, desktop, children, active, fullBleed, hideBanner }: Props) {
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
          {!fullBleed && <DesktopSidebar active={active} />}
          <main className="flex-1 min-w-0 flex flex-col">{desktopNode}</main>
        </div>
      </div>
    </>
  );
}
