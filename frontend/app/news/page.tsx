"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Newspaper, Clock } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { HelpMenu } from "@/components/molecules/help-menu";
import { type TutorialStep } from "@/lib/tutorial";

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
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

// =================================================================
// HERO
// =================================================================

function HeroSection({
  total,
  desktop,
  onReopenTour,
}: {
  total: number;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "80px" : "56px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="lilac" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
      <SparkleField count={14} seed={606} className="opacity-70" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pra home
            </Link>
            <HelpMenu onReopenTour={onReopenTour} />
          </div>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div data-tutorial-id="news-intro">
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ jornal da yara
              </div>
              <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
                Atualizações, dicas e movimentos do TikTok Shop direto da redação.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="NEWS · TTS · 2026 · " emoji="📰" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <span className="block text-spark-ink">o que tá</span>
            <span className="block text-grad-brand">acontecendo.</span>
          </h1>
        </SectionReveal>

        {total > 0 && (
          <SectionReveal direction="up" delay={700}>
            <div className="mt-10 inline-flex items-center gap-2 text-[13px] text-spark-ink-70 font-semibold">
              <span className="font-extrabold text-fluid-title text-spark-ink leading-none">
                <CountUp value={total} durationMs={900} />
              </span>
              {total === 1 ? "publicação" : "publicações"}
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}

// =================================================================
// FEATURED CARD (primeira publicação em destaque)
// =================================================================

function FeaturedCard({ item }: { item: NewsRow }) {
  return (
    <SectionReveal direction="up">
      <Link
        href={`/news/${item.slug}`}
        className="group block rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
      >
        <div className="grid sm:grid-cols-[1.2fr_1fr]">
          {/* Cover */}
          <div className="relative aspect-video sm:aspect-auto bg-spark-surface-sunken overflow-hidden order-2 sm:order-1">
            {item.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.cover_url}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-rose-300 via-pink-200 to-amber-200 flex items-center justify-center">
                <Newspaper size={64} strokeWidth={1.4} className="text-spark-brand-deep opacity-50" />
              </div>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-spark-ink text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift">
                ✦ destaque
              </span>
              {item.is_new && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-good text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-sm">
                  novo
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-7 sm:p-10 flex flex-col justify-center order-1 sm:order-2">
            <div className="text-eyebrow text-spark-brand mb-4">
              ✦ {item.category}
            </div>
            <h2
              className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)" }}
            >
              {item.title.toLowerCase()}
            </h2>
            {item.excerpt && (
              <p className="mt-5 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch]">
                {item.excerpt}
              </p>
            )}
            <div className="mt-6 flex items-center gap-4 text-[12px] text-spark-ink-50 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock size={11} strokeWidth={2} />
                {item.reading_minutes} min
              </span>
              <span>·</span>
              <span className="first-letter:capitalize">{fmtDate(item.published_at)}</span>
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-spark-brand-deep group-hover:text-spark-brand transition-colors duration-300">
              ler matéria
              <ArrowUpRight
                size={14}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// NEWS CARD
// =================================================================

function NewsCard({ item, index }: { item: NewsRow; index: number }) {
  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
      <Link
        href={`/news/${item.slug}`}
        className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest h-full"
      >
        <div className="relative aspect-video bg-spark-surface-sunken overflow-hidden">
          {item.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-200 via-pink-100 to-amber-100 flex items-center justify-center">
              <Newspaper size={48} strokeWidth={1.4} className="text-spark-brand-deep opacity-50" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full glass text-spark-ink text-[10.5px] font-extrabold uppercase tracking-widest">
              {item.category}
            </span>
            {item.is_new && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-good text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-sm">
                novo
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-3">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="mt-2 text-[12.5px] text-spark-ink-70 leading-snug line-clamp-2">
              {item.excerpt}
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-spark-hairline flex items-center gap-2 text-[10.5px] text-spark-ink-50 font-mono">
            <Clock size={10} strokeWidth={2} />
            {item.reading_minutes}min · {fmtDate(item.published_at)}
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// EMPTY
// =================================================================

function EmptyNews({ desktop }: { desktop: boolean }) {
  return (
    <section className={cn("relative overflow-hidden", desktop ? "py-24 px-12" : "py-16 px-5")}>
      <HeroBlob color="rose" variant={2} className="-top-10 -left-20 w-[400px] h-[400px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 -right-20 w-[360px] h-[360px]" />
      <SparkleField count={10} seed={444} className="opacity-50" />

      <div className={cn("relative text-center", desktop ? "max-w-[680px] mx-auto" : "")}>
        <SectionReveal direction="scale">
          <div className="mx-auto w-24 h-24 rounded-full bg-brand-grad-soft flex items-center justify-center mb-7 shadow-lift animate-float">
            <span className="text-[48px]">📰</span>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            sem novidades<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <p className="mt-6 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch] mx-auto">
            Quando a Yara publicar uma nota, ela aparece aqui. Bora trazer a primeira em breve ✨
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY
// =================================================================

function NewsBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const { news, loading } = useNews();
  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection total={news.length} desktop={desktop} onReopenTour={onReopenTour} />

      {loading ? (
        <section className="py-24 flex justify-center">
          <LoadingSplash message="Carregando o jornal" />
        </section>
      ) : news.length === 0 ? (
        <EmptyNews desktop={desktop} />
      ) : (
        <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
          <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
            {featured && (
              <div data-tutorial-id="news-featured" className="mb-10">
                <FeaturedCard item={featured} />
              </div>
            )}

            {rest.length > 0 && (
              <SectionReveal>
                <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-eyebrow text-spark-brand mb-2">
                      ✦ {rest.length} {rest.length === 1 ? "outra" : "outras"}
                    </div>
                    <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight">
                      mais matérias
                    </h2>
                  </div>
                </div>
              </SectionReveal>
            )}

            <div
              data-tutorial-id="news-grid"
              className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
            >
              {rest.map((n, i) => (
                <NewsCard key={n.id} item={n} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function NewsMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <NewsBody onReopenTour={onReopenTour} />;
}

function NewsDesktop({ onReopenTour }: { onReopenTour: () => void }) {
  return <NewsBody desktop onReopenTour={onReopenTour} />;
}

// Steps do tour de News (6 steps com variantes mobile/desktop pro nav)
function buildNewsSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda às news!",
      description:
        "Aqui ficam as atualizações do TikTok Shop e do método — mudanças de algoritmo, oportunidades de mercado, dicas da Yara. Em 20s te mostro como navegar.",
    },
    {
      id: "intro",
      target: "news-intro",
      title: "O jornal da Yara",
      description:
        "Curadoria pra você ficar a par do que muda na plataforma sem precisar caçar informação por aí. Categoria + tempo de leitura em cada nota.",
    },
    {
      id: "featured",
      target: "news-featured",
      title: "Matéria em destaque",
      description:
        "A publicação mais recente vira card grande no topo. Se for novidade quente, ganha selo NOVO. Clica pra ler a matéria completa.",
    },
    {
      id: "grid",
      target: "news-grid",
      title: "Outras matérias",
      description:
        "Grid com as demais notas. Cada card tem foto, categoria, título, prévia e tempo de leitura. Clica em qualquer uma pra abrir.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é se atualizar 💕",
      description:
        "Confere de tempos em tempos pra não perder mudança importante. Pra refazer o tour, clica no ✨ Tour no canto.",
    },
  ];
}

function NewsPageContent() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildNewsSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <ResponsiveShell
        mobile={<NewsMobile onReopenTour={reopenTour} />}
        desktop={<NewsDesktop onReopenTour={reopenTour} />}
        active="news"
        customSidebar
      />
      <FloatingMainNav active="news" />
      <TutorialOverlay
        steps={steps}
        storageKey="news"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function NewsPage() {
  return <NewsPageContent />;
}
