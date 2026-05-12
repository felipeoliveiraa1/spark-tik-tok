import Link from "next/link";
import { Eye, Play, DollarSign } from "lucide-react";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { cn } from "@/lib/cn";

export type ViralCardData = {
  id: string;
  thumbnailLabel: string;
  views: string;
  revenue: string;
  quote: string;
  creator: string;
  country?: "BR" | "US";
};

type Props = {
  viral: ViralCardData;
  className?: string;
  variant?: "list" | "carousel";
};

export function ViralCard({ viral, className, variant = "list" }: Props) {
  const isCarousel = variant === "carousel";
  return (
    <Link
      href={`/virais/${viral.id}`}
      className={cn(
        "block bg-spark-surface border border-spark-hairline rounded-[18px] overflow-hidden transition-transform active:scale-[0.99]",
        isCarousel ? "min-w-[200px] max-w-[200px]" : "w-full",
        className,
      )}
    >
      <div className="relative">
        <PhotoPlaceholder label={viral.thumbnailLabel} radius={0} ratio={isCarousel ? 9 / 16 : 16 / 10} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm">
            <Play size={16} strokeWidth={1.7} fill="currentColor" />
          </div>
        </div>
        {viral.country && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/55 text-white">
            {viral.country}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[13px] font-semibold text-spark-ink line-clamp-2 leading-snug">
          “{viral.quote}”
        </div>
        <div className="mt-2 flex items-center gap-2.5 text-[11px] font-semibold text-spark-ink-70">
          <span className="inline-flex items-center gap-1">
            <Eye size={11} strokeWidth={2} /> {viral.views}
          </span>
          <span className="inline-flex items-center gap-1 text-good">
            <DollarSign size={11} strokeWidth={2} /> {viral.revenue}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-spark-ink-50 font-mono">{viral.creator}</div>
      </div>
    </Link>
  );
}
