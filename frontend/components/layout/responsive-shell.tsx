import * as React from "react";
import { MobileFrame } from "./mobile-frame";
import { PreviewBanner } from "./preview-banner";
import { DesktopSidebar, type SidebarActive } from "./desktop-sidebar";

type Props = {
  mobile?: React.ReactNode;
  desktop?: React.ReactNode;
  children?: React.ReactNode;
  active?: SidebarActive;
  hideBanner?: boolean;
  /** If true, desktop renders without the global sidebar (login, onboarding). */
  fullBleed?: boolean;
  /** If true, this page renders its own sidebar (chat). Hides the global one. */
  customSidebar?: boolean;
};

export function ResponsiveShell({
  mobile,
  desktop,
  children,
  active,
  hideBanner,
  fullBleed,
  customSidebar,
}: Props) {
  const mobileNode = mobile ?? children;
  const desktopNode = desktop ?? children;
  const showSidebar = !fullBleed && !customSidebar;

  return (
    <>
      <div className="lg:hidden">
        {!hideBanner && <PreviewBanner />}
        <MobileFrame>{mobileNode}</MobileFrame>
      </div>
      <div className="hidden lg:flex flex-col min-h-dvh w-full bg-spark-bg">
        {!hideBanner && <PreviewBanner />}
        <div className="flex flex-1 min-h-0">
          {showSidebar && <DesktopSidebar active={active} />}
          <main className="flex-1 min-w-0 flex flex-col">{desktopNode}</main>
        </div>
      </div>
    </>
  );
}
