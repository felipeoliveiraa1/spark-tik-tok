import { SparkMark } from "./spark-mark";

type Props = {
  size?: number;
  white?: boolean;
  className?: string;
};

export function SparkWordmark({ size = 22, white = false, className }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <SparkMark size={size + 4} white={white} />
      <span
        className="font-extrabold tracking-tight"
        style={{
          fontSize: size,
          letterSpacing: "-0.02em",
          color: white ? "#fff" : "oklch(0.18 0.02 285)",
        }}
      >
        spark
      </span>
    </div>
  );
}
