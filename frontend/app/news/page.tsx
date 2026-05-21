"use client";

import * as React from "react";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type NewsRow = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  reading_minutes: number;
  is_new: boolean;
  published_at: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function useNews() {
  const [news, setNews] = React.useState<NewsRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/news", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { news: [] }))
      .then((data: { news: NewsRow[] }) => {
        if (!cancelled) setNews(data.news);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { news, loading };
}

function NewsBody({ desktop = false }: { desktop?: boolean }) {
  const { news, loading } = useNews();
  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          📰 Jornal da Yara
        </div>
        <h1 className={`mt-1 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[36px]" : "text-[26px]"}`}>
          News ✨
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Atualizações, dicas e novidades publicadas pela Yara pra você ficar à frente. 💕
        </p>
      </div>

      <div className={`mt-6 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando o jornal" />
        ) : news.length === 0 ? (
          <EmptyNews />
        ) : (
          <>
            {featured && <FeaturedCard item={featured} />}
            <div className={`mt-3.5 grid gap-2.5 ${desktop ? "grid-cols-2 max-w-[920px]" : "grid-cols-1"}`}>
              {rest.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ item }: { item: NewsRow }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="block rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover:border-spark-ink/30 transition-colors max-w-[920px]"
    >
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt="" className="w-full h-[180px] object-cover" />
      ) : (
        <div className="w-full h-[120px] bg-brand-grad-soft" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <SBadge tone="brand">{item.category}</SBadge>
          {item.is_new && <SBadge tone="good">NOVO</SBadge>}
        </div>
        <div className="text-[18px] font-extrabold leading-snug">{item.title}</div>
        {item.excerpt && (
          <div className="mt-1.5 text-[13.5px] text-spark-ink-70 line-clamp-2 leading-snug">
            {item.excerpt}
          </div>
        )}
        <div className="mt-2.5 text-[11.5px] text-spark-ink-50 font-mono">
          {fmtDate(item.published_at)} · {item.reading_minutes}min de leitura
        </div>
      </div>
    </Link>
  );
}

function NewsCard({ item }: { item: NewsRow }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="rounded-2xl bg-spark-surface border border-spark-hairline p-3.5 hover:border-spark-ink/30 transition-colors flex gap-3"
    >
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-brand-grad-soft shrink-0 flex items-center justify-center text-spark-brand-deep">
          <Newspaper size={20} strokeWidth={1.7} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-spark-brand">
            {item.category}
          </span>
          {item.is_new && (
            <span className="text-[9px] uppercase font-bold px-1.5 rounded-md bg-good text-white">
              Novo
            </span>
          )}
        </div>
        <div className="text-[14px] font-bold line-clamp-2 leading-snug">{item.title}</div>
        <div className="mt-1.5 text-[11px] text-spark-ink-50 font-mono">
          {fmtDate(item.published_at)} · {item.reading_minutes}min
        </div>
      </div>
    </Link>
  );
}

function EmptyNews() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        📰
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem novidades ainda 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        Quando a Yara publicar uma nota, ela aparece aqui. Bora trazer a primeira em breve. ✨
      </p>
    </div>
  );
}

function NewsMobile() {
  return (
    <>
      <MobileHeader title="News 📰" trailing={<HomeShortcut />} />
      <NewsBody />
      <BottomNav active="news" />
    </>
  );
}

function HomeShortcut() {
  return (
    <Link
      href="/"
      aria-label="Início"
      className="w-10 h-10 rounded-full flex items-center justify-center text-spark-ink active:scale-95 transition-transform"
    >
      <span className="text-[18px]">🏠</span>
    </Link>
  );
}

function NewsDesktop() {
  return <NewsBody desktop />;
}

export default function NewsPage() {
  return <ResponsiveShell mobile={<NewsMobile />} desktop={<NewsDesktop />} active="news" />;
}
