import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * LiftCard — card editorial com hover lift premium (translateY + shadow)
 * usando ease-premium cubic-bezier do TastyBasics.
 *
 * Variantes:
 *   - default:    bg-spark-surface + hairline border + radius 28px
 *   - elevated:   bg-spark-surface-elev + shadow-rest idle
 *   - branded:    bg-spark-brand-soft + hairline rose
 *   - dark:       bg-spark-ink + texto branco
 *
 * Opcional `href` transforma em <Link>. Senão é <div>.
 */

type Variant = "default" | "elevated" | "branded" | "dark";

const VARIANT_CLASSES: Record<Variant, string> = {
  default:
    "bg-spark-surface border border-spark-hairline",
  elevated:
    "bg-spark-surface-elev border border-spark-hairline shadow-rest",
  branded:
    "bg-spark-brand-soft border border-spark-brand/20",
  dark:
    "bg-spark-ink text-white border border-spark-ink",
};

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  /** Aplica hover-lift (translate + shadow). Default true. */
  hoverable?: boolean;
  /** Padding interno. Default "md" (px-5 py-5). */
  padding?: "sm" | "md" | "lg" | "none";
  className?: string;
};

type Props =
  | (CommonProps & { href: string; onClick?: never })
  | (CommonProps & { href?: undefined; onClick?: () => void });

const PADDING_CLASSES = {
  none: "",
  sm: "p-3.5",
  md: "p-5",
  lg: "p-6 sm:p-7",
};

export function LiftCard({
  children,
  variant = "default",
  hoverable = true,
  padding = "md",
  className,
  href,
  onClick,
}: Props) {
  const classes = cn(
    "rounded-spark-2xl overflow-hidden",
    VARIANT_CLASSES[variant],
    PADDING_CLASSES[padding],
    hoverable && "hover-lift",
    "transition-colors duration-300 ease-premium",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn("block", classes)}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("text-left w-full", classes)}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
