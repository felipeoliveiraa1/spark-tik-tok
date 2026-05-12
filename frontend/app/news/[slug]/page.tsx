import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Share2, Bookmark, ArrowRight, MessageCircle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";
import { SBadge } from "@/components/atoms/s-badge";
import { SButton } from "@/components/atoms/s-button";
import { NewsCard } from "@/components/molecules/news-card";
import { NEWS, NEWS_CATEGORIES, getNewsBySlug, type NewsBlock, type NewsPost } from "@/lib/mock";

function Block({ block }: { block: NewsBlock }) {
  if (block.kind === "p") {
    return <p className="text-[15px] leading-[1.6] text-spark-ink mt-3.5">{block.text}</p>;
  }
  if (block.kind === "h") {
    return (
      <h2 className="text-[20px] lg:text-[22px] font-extrabold tracking-[-0.02em] mt-7 leading-[1.2]">
        {block.text}
      </h2>
    );
  }
  if (block.kind === "list") {
    return (
      <ul className="mt-3.5 flex flex-col gap-1.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2 text-[15px] leading-[1.55] text-spark-ink">
            <span className="text-spark-brand font-bold">·</span>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote className="mt-4 pl-4 border-l-[3px] border-spark-brand">
        <div className="text-[16px] leading-[1.5] text-spark-ink italic font-semibold">
          &ldquo;{block.text}&rdquo;
        </div>
        {block.by && <div className="mt-1.5 text-[12px] text-spark-ink-50 font-mono">— {block.by}</div>}
      </blockquote>
    );
  }
  // callout
  const toneStyles = {
    brand: { bg: "bg-brand-grad-soft", fg: "text-spark-brand-deep" },
    warn: { bg: "bg-[oklch(0.96_0.05_80)]", fg: "text-[oklch(0.45_0.16_75)]" },
    good: { bg: "bg-[oklch(0.95_0.04_150)]", fg: "text-good" },
  }[block.tone];
  return (
    <div className={`mt-4 p-4 rounded-[14px] ${toneStyles.bg}`}>
      <div className={`text-[12px] font-extrabold uppercase tracking-[0.06em] ${toneStyles.fg}`}>
        {block.title}
      </div>
      <div className="mt-1.5 text-[14.5px] leading-[1.55] text-spark-ink">{block.text}</div>
    </div>
  );
}

function ArticleBody({ post }: { post: NewsPost }) {
  const cat = NEWS_CATEGORIES[post.category];
  return (
    <article>
      <div className="flex flex-wrap items-center gap-1.5">
        <SBadge tone="brand">
          {cat.emoji} {cat.label}
        </SBadge>
        {post.isNew && <SBadge tone="good">NOVO</SBadge>}
        {post.tags.map((t) => (
          <SBadge key={t}>{t}</SBadge>
        ))}
      </div>

      <h1 className="mt-3.5 text-[28px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
        {post.title}
      </h1>
      <p className="mt-3 text-[16px] lg:text-[18px] text-spark-ink-70 leading-[1.5]">{post.subtitle}</p>

      <div className="mt-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold">
          {post.author.initial}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold">{post.author.name}</div>
          <div className="text-[11.5px] text-spark-ink-50 font-mono">{post.author.role}</div>
        </div>
        <div className="text-[11.5px] text-spark-ink-50 font-mono text-right">
          <div>{post.publishedDisplay}</div>
          <div className="inline-flex items-center gap-1 mt-0.5">
            <Clock size={10} strokeWidth={2} /> {post.readingMinutes}min
          </div>
        </div>
      </div>

      <div className="mt-6">
        <PhotoPlaceholder label={post.cover} radius={20} ratio={16 / 9} />
      </div>

      <div className="mt-4">
        {post.body.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>

      <div className="mt-8 pt-5 border-t border-spark-hairline flex items-center gap-2">
        <SButton size="sm" variant="ghost" Icon={Bookmark}>
          Salvar
        </SButton>
        <SButton size="sm" variant="ghost" Icon={Share2}>
          Compartilhar
        </SButton>
        <div className="flex-1" />
        <Link href="/chat?agent=help">
          <SButton size="sm" variant="primary" Icon={MessageCircle} IconRight={ArrowRight}>
            Tirar dúvida
          </SButton>
        </Link>
      </div>
    </article>
  );
}

function NewsDetailMobile({ post }: { post: NewsPost }) {
  const others = NEWS.filter((n) => n.slug !== post.slug).slice(0, 3);
  return (
    <>
      <div className="pt-14 px-3 pb-2 flex items-center justify-between border-b border-spark-hairline">
        <Link
          href="/news"
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">News</div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <Share2 size={18} strokeWidth={1.7} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-5">
        <ArticleBody post={post} />

        <div className="mt-10">
          <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
            Continua lendo
          </div>
          <div className="flex flex-col gap-3">
            {others.map((p) => (
              <NewsCard key={p.slug} post={p} variant="row" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function NewsDetailDesktop({ post }: { post: NewsPost }) {
  const others = NEWS.filter((n) => n.slug !== post.slug).slice(0, 4);
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pras news
      </Link>

      <div className="mt-5 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <div className="max-w-[720px]">
          <ArticleBody post={post} />
        </div>

        <aside className="sticky top-8 flex flex-col gap-3">
          <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
            Mais do jornal
          </div>
          {others.map((p) => (
            <NewsCard key={p.slug} post={p} variant="row" />
          ))}
        </aside>
      </div>
    </div>
  );
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getNewsBySlug(slug);
  if (!post) notFound();
  return (
    <ResponsiveShell
      mobile={<NewsDetailMobile post={post} />}
      desktop={<NewsDetailDesktop post={post} />}
      active="news"
    />
  );
}
