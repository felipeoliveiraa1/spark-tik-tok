import { cn } from "@/lib/cn";

type Props = {
  ratio?: number; // aspect ratio number (w/h)
  label?: string;
  radius?: number;
  height?: number | string;
  className?: string;
};

export function PhotoPlaceholder({ ratio = 1, label = "product photo", radius = 16, height, className }: Props) {
  const style: React.CSSProperties = {
    aspectRatio: height ? undefined : `${ratio}`,
    height,
    borderRadius: radius,
    background: `repeating-linear-gradient(45deg, oklch(0.965 0.005 290) 0 12px, oklch(0.93 0.006 285) 12px 14px)`,
  };
  return (
    <div
      className={cn(
        "w-full flex items-center justify-center overflow-hidden font-mono text-[11px] font-semibold tracking-[0.04em] text-spark-ink-50",
        className,
      )}
      style={style}
    >
      {label}
    </div>
  );
}
