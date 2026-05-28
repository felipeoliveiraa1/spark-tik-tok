import * as React from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "dark" | "ghost" | "soft" | "quiet";
type IconComp = React.ComponentType<{ size?: number; strokeWidth?: number }>;

type Props = {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  Icon?: IconComp;
  IconRight?: IconComp;
  full?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

const sizeClasses: Record<Size, string> = {
  sm: "h-[34px] px-3.5 text-[13px] gap-1.5",
  md: "h-[46px] px-[18px] text-[15px] gap-2",
  lg: "h-[56px] px-5 text-base gap-2",
};

const iconSizes: Record<Size, number> = { sm: 15, md: 17, lg: 18 };

const variantClasses: Record<Variant, string> = {
  primary:
    "text-white border-none shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_6px_18px_-8px_oklch(0.55_0.24_340/0.55)] bg-brand-grad",
  dark: "bg-spark-ink text-white border-none",
  ghost: "bg-transparent text-spark-ink border border-spark-border",
  soft: "bg-spark-surface-sunken text-spark-ink border-none",
  quiet: "bg-transparent text-spark-ink-70 border-none",
};

export function SButton({
  children,
  variant = "primary",
  size = "md",
  Icon,
  IconRight,
  full,
  className,
  type = "button",
  disabled,
  onClick,
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em] cursor-pointer",
    "transition-all duration-300 ease-premium",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
    sizeClasses[size],
    variantClasses[variant],
    full && "w-full",
    className,
  );

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {Icon && <Icon size={iconSizes[size]} strokeWidth={1.7} />}
      {children}
      {IconRight && <IconRight size={iconSizes[size]} strokeWidth={1.7} />}
    </button>
  );
}
