"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type NewsDetail = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  body_md: string;
  reading_minutes: number;
  is_new: boolean;
  published_at: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function useNewsItem(slug: string) {
  const [item, setItem] = React.useState<NewsDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/news/${slug}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setError("Nota não encontrada.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Falhou ao carregar.");
          return;
        }
        const data = (await res.json()) as NewsDetail;
        if (!cancelled) setItem(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { item, loading, error };
}

function NewsBody({ slug, desktop = false }: { slug: string; desktop?: boolean }) {
  const { item, loading, error } = useNewsItem(slug);
  if (loading) return <LoadingSplash message="Abrindo a nota" />;
  if (error || !item) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro."}
        <div className="mt-3">
          <Link href="/news" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <article className={desktop ? "max-w-[720px]" : "px-4 pt-4"}>
        {!desktop && (
          <Link href="/news" className="inline-flex items-center gap-1.5 text-[13px] text-spark-ink-50">
            <ArrowLeft size={14} strokeWidth={1.7} />
            News
          </Link>
        )}

        {item.cover_url && (
          <div className="mt-3 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.cover_url} alt="" className="w-full h-[200px] md:h-[280px] object-cover" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-1.5">
          <SBadge tone="brand">{item.category}</SBadge>
          {item.is_new && <SBadge tone="good">NOVO</SBadge>}
        </div>

        <h1 className={`mt-2 font-extrabold tracking-[-0.025em] leading-tight ${desktop ? "text-[32px]" : "text-[24px]"}`}>
          {item.title}
        </h1>

        {item.excerpt && (
          <p className="mt-2 text-[15px] text-spark-ink-70 leading-relaxed">{item.excerpt}</p>
        )}

        <div className="mt-2 text-[12px] text-spark-ink-50 font-mono">
          {fmtDate(item.published_at)} · {item.reading_minutes}min de leitura
        </div>

        <div className="mt-6 prose prose-sm md:prose-base text-spark-ink leading-relaxed">
          {item.body_md.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h2 key={i} className="text-[20px] font-extrabold mt-6 mb-2">
                  {line.slice(3)}
                </h2>
              );
            }
            if (line.startsWith("# ")) {
              return (
                <h1 key={i} className="text-[24px] font-extrabold mt-6 mb-2">
                  {line.slice(2)}
                </h1>
              );
            }
            if (line.trim() === "") return <div key={i} className="h-3" />;
            return (
              <p key={i} className="text-[15px] leading-relaxed mb-3">
                {line}
              </p>
            );
          })}
        </div>

        {!item.cover_url && (
          <div className="mt-8 text-center text-spark-ink-35">
            <Newspaper size={20} strokeWidth={1.7} className="inline" />
          </div>
        )}
      </article>
    </div>
  );
}

function MobileWrap({ slug }: { slug: string }) {
  return (
    <>
      <div className="pt-12 px-4 pb-2 flex items-center gap-2">
        <Link href="/news" className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">News</div>
      </div>
      <NewsBody slug={slug} />
      <BottomNav active="home" />
    </>
  );
}

export default function NewsDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  return (
    <ResponsiveShell
      mobile={<MobileWrap slug={slug} />}
      desktop={<NewsBody slug={slug} desktop />}
      active="news"
    />
  );
}
