"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Newspaper } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
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
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

// =================================================================
// MARKDOWN RENDERER (editorial)
// =================================================================

function MarkdownBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={i}
          className="font-display lowercase leading-tight tracking-tight text-spark-ink mt-12 mb-4"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          {line.slice(3).toLowerCase()}
        </h2>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={i}
          className="font-display lowercase leading-tight tracking-tight text-spark-ink mt-14 mb-5"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
        >
          {line.slice(2).toLowerCase()}
        </h1>,
      );
      return;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push(
        <div key={i} className="flex items-start gap-2.5 text-spark-ink-70 mb-2 leading-relaxed">
          <span
            aria-hidden
            className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-spark-brand"
          />
          <span style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)" }}>{line.slice(2)}</span>
        </div>,
      );
      return;
    }
    if (line.trim() === "") {
      blocks.push(<div key={i} className="h-3" />);
      return;
    }
    blocks.push(
      <p
        key={i}
        className="text-spark-ink-70 leading-relaxed mb-4"
        style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)" }}
      >
        {line}
      </p>,
    );
  });

  return <div className="prose-tts">{blocks}</div>;
}

// =================================================================
// BODY
// =================================================================

function NewsBody({ slug, desktop = false }: { slug: string; desktop?: boolean }) {
  const { item, loading, error } = useNewsItem(slug);

  if (loading) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Abrindo a nota" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        <SparkleField count={8} seed={42} className="opacity-50" />
        <div className="px-6 py-32 text-center max-w-[480px] mx-auto relative">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            opa, sumiu.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug">
            {error ?? "Erro desconhecido."}
          </p>
          <Link
            href="/news"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro jornal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero compacto */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
          paddingBottom: desktop ? "40px" : "24px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
        <SparkleField count={10} seed={919} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[840px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pro jornal
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100}>
            <div className="mt-7 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[11px] font-extrabold uppercase tracking-widest">
                {item.category}
              </span>
              {item.is_new && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-good text-white text-[11px] font-extrabold uppercase tracking-widest shadow-sm">
                  novo
                </span>
              )}
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={200} durationMs={800}>
            <h1
              className="mt-6 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{
                fontSize: desktop ? "clamp(2.5rem, 5vw, 4.5rem)" : "clamp(2rem, 8vw, 3.25rem)",
              }}
            >
              {item.title.toLowerCase()}
            </h1>
          </SectionReveal>

          {item.excerpt && (
            <SectionReveal direction="up" delay={350}>
              <p className="mt-6 text-fluid-lead text-spark-ink-70 leading-snug max-w-[58ch] font-semibold">
                {item.excerpt}
              </p>
            </SectionReveal>
          )}

          <SectionReveal direction="up" delay={500}>
            <div className="mt-7 flex items-center gap-4 text-[12.5px] text-spark-ink-50 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock size={11} strokeWidth={2.5} />
                {item.reading_minutes} min de leitura
              </span>
              <span>·</span>
              <span className="first-letter:capitalize">{fmtDate(item.published_at)}</span>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Cover image */}
      {item.cover_url && (
        <section className={`relative ${desktop ? "px-12" : "px-5"} mb-10`}>
          <div className={desktop ? "max-w-[840px] mx-auto" : ""}>
            <SectionReveal direction="up">
              <div className="rounded-spark-3xl overflow-hidden shadow-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cover_url}
                  alt=""
                  className="w-full aspect-video object-cover"
                />
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Body */}
      <section className={`relative ${desktop ? "px-12" : "px-5"} pb-16`}>
        <div className={desktop ? "max-w-[760px] mx-auto" : ""}>
          <SectionReveal direction="up">
            <article className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-7 sm:p-10 shadow-rest">
              <MarkdownBody body={item.body_md} />
            </article>
          </SectionReveal>

          {/* Footer com link de volta */}
          <SectionReveal direction="up" delay={150}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-spark-2xl glass border border-spark-hairline">
              <div className="flex items-center gap-3">
                <Newspaper size={20} strokeWidth={2.2} className="text-spark-brand-deep" />
                <div className="text-[13px] text-spark-ink-70 font-semibold">
                  Curtiu? Tem mais no jornal 💕
                </div>
              </div>
              <Link
                href="/news"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep"
              >
                Ver outras matérias
                <ArrowLeft
                  size={14}
                  strokeWidth={2.5}
                  className="transition-transform duration-300 group-hover:-translate-x-0.5 rotate-180"
                />
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function MobileWrap({ slug }: { slug: string }) {
  return <NewsBody slug={slug} />;
}

export default function NewsDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<MobileWrap slug={slug} />}
        desktop={<NewsBody slug={slug} desktop />}
        active="news"
        customSidebar
      />
      <FloatingMainNav active="news" />
    </>
  );
}
