type Props = {
  size?: number;
  mono?: boolean;
  white?: boolean;
  className?: string;
};

export function SparkMark({ size = 28, mono = false, white = false, className }: Props) {
  const gradId = "spark-grad-mark";
  const fill = white ? "#fff" : mono ? "oklch(0.18 0.02 285)" : `url(#${gradId})`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.5 0.22 290)" />
          <stop offset="1" stopColor="oklch(0.62 0.22 340)" />
        </linearGradient>
      </defs>
      <path d="M5 16 L16 4 L19 13 L28 16 L16 28 L13 19 Z" fill={fill} />
    </svg>
  );
}
