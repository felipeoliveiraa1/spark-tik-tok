import Link from "next/link";
import { Clock } from "lucide-react";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { SBadge } from "@/components/atoms/s-badge";
import { NEWS_CATEGORIES, type NewsPost } from "@/lib/mock";
import { cn } from "@/lib/cn";

type Props = {
  post: NewsPost;
  variant?: "row" | "card";
  className?: string;
};

export function NewsCard({ post, variant = "row", className }: Props) {
  const cat = NEWS_CATEGORIES[post.category];

  if (variant === "card") {
    return (
      <Link
        href={`/news/${post.slug}`}
        className={cn(
          "block rounded-[18px] overflow-hidden bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors",
          className,
        )}
      >
        <PhotoPlaceholder label={post.cover} radius={0} ratio={16 / 9} />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <SBadge tone="brand">
              {cat.emoji} {cat.label}
            </SBadge>
            {post.isNew && <SBadge tone="good">NOVO</SBadge>}
          </div>
          <div className="mt-2.5 text-[15px] font-extrabold leading-[1.25] line-clamp-2">{post.title}</div>
          <div className="mt-1.5 text-[12.5px] text-spark-ink-70 leading-[1.45] line-clamp-2">
            {post.subtitle}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-spark-ink-50">
            <div className="w-5 h-5 rounded-full bg-brand-grad text-white text-[10px] font-extrabold flex items-center justify-center">
              {post.author.initial}
            </div>
            <span className="font-semibold">{post.author.name}</span>
            <span>·</span>
            <span className="font-mono">{post.publishedDisplay}</span>
            <span className="flex-1" />
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock size={10} strokeWidth={2} /> {post.readingMinutes}min
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/news/${post.slug}`}
      className={cn(
        "rounded-2xl bg-spark-surface border border-spark-hairline flex gap-3 p-3 hover:border-spark-ink/30 transition-colors",
        className,
      )}
    >
      <div className="relative w-[88px] shrink-0">
        <PhotoPlaceholder label="" radius={12} height={88} />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[10px] font-bold">
          {cat.emoji}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <SBadge tone="brand">{cat.label}</SBadge>
          {post.isNew && <SBadge tone="good">NOVO</SBadge>}
        </div>
        <div className="mt-1.5 text-[14px] font-bold leading-[1.25] line-clamp-2">{post.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-spark-ink-50">
          <span className="font-mono">{post.publishedDisplay}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-0.5 font-mono">
            <Clock size={10} strokeWidth={2} /> {post.readingMinutes}min
          </span>
        </div>
      </div>
    </Link>
  );
}
