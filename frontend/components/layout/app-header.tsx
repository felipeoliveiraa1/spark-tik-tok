import * as React from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  leading?: React.ReactNode;
  leadingHref?: string;
  trailing?: React.ReactNode;
  trailingHref?: string;
  showAvatar?: boolean;
  avatarLetter?: string;
  className?: string;
  /** Optional icon element passed as JSX, e.g. <Menu size={20} />. */
  LeadingIcon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  TrailingIcon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const buttonCls =
  "w-10 h-10 rounded-full bg-spark-surface text-spark-ink flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-95 transition-transform";

export function AppHeader({
  title,
  leading,
  leadingHref = "/",
  trailing,
  trailingHref,
  showAvatar = true,
  avatarLetter = "M",
  className,
  LeadingIcon,
  TrailingIcon,
}: Props) {
  const LeadingComp = LeadingIcon ?? Menu;

  const leadingNode = leading ?? (
    <Link href={leadingHref} className={buttonCls} aria-label="Menu">
      <LeadingComp size={20} strokeWidth={1.7} />
    </Link>
  );

  let trailingNode: React.ReactNode = null;
  if (trailing) {
    trailingNode = trailing;
  } else if (TrailingIcon) {
    trailingNode = trailingHref ? (
      <Link href={trailingHref} className={buttonCls}>
        <TrailingIcon size={20} strokeWidth={1.7} />
      </Link>
    ) : (
      <span className={buttonCls}>
        <TrailingIcon size={20} strokeWidth={1.7} />
      </span>
    );
  } else if (showAvatar) {
    trailingNode = (
      <Link
        href="/conta"
        className="w-10 h-10 rounded-full text-white flex items-center justify-center font-extrabold text-sm bg-brand-grad"
      >
        {avatarLetter}
      </Link>
    );
  } else {
    trailingNode = <div className="w-10 h-10" />;
  }

  return (
    <div className={cn("pt-14 pb-3 px-4 flex items-center justify-between bg-transparent safe-top", className)}>
      {leadingNode}
      {title && <div className="text-[16px] font-bold">{title}</div>}
      {trailingNode}
    </div>
  );
}
