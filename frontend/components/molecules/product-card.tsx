import Link from "next/link";
import { Package, Pen } from "lucide-react";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { SBadge } from "@/components/atoms/s-badge";
import { cn } from "@/lib/cn";

export type ProductCardData = {
  id: string;
  name: string;
  category: string;
  scripts?: number;
  virais?: number;
  priceRange?: string;
};

type Props = {
  product: ProductCardData;
  className?: string;
  compact?: boolean;
};

export function ProductCard({ product, className, compact }: Props) {
  return (
    <Link
      href={`/produtos/${product.id}`}
      className={cn(
        "block bg-spark-surface border border-spark-hairline rounded-[18px] overflow-hidden transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <PhotoPlaceholder label={product.name.toLowerCase()} radius={0} ratio={compact ? 1.2 : 1} />
      <div className="p-3">
        <div className="text-[13px] font-bold text-spark-ink line-clamp-1">{product.name}</div>
        <div className="text-[11.5px] text-spark-ink-50 mt-0.5">{product.category}</div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-spark-ink-70">
          {product.scripts != null && (
            <SBadge tone="neutral">
              <Pen size={10} strokeWidth={2} /> {product.scripts}
            </SBadge>
          )}
          {product.virais != null && (
            <SBadge tone="neutral">
              <Package size={10} strokeWidth={2} /> {product.virais}
            </SBadge>
          )}
        </div>
      </div>
    </Link>
  );
}
