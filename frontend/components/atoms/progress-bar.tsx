import { cn } from "@/lib/cn";

type Tone = "brand" | "warn" | "ink";

type Props = {
  value: number;
  max: number;
  tone?: Tone;
  className?: string;
};

const fillBackground: Record<Tone, string> = {
  brand: "linear-gradient(135deg, oklch(0.5 0.22 290), oklch(0.62 0.22 340))",
  warn: "linear-gradient(90deg, oklch(0.7 0.18 70), oklch(0.65 0.2 30))",
  ink: "oklch(0.18 0.02 285)",
};

export function ProgressBar({ value, max, tone = "brand", className }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full h-2 rounded-full bg-spark-surface-sunken overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: fillBackground[tone] }}
      />
    </div>
  );
}
