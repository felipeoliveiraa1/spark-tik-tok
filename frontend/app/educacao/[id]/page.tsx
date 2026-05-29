"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/cn";

type VideoDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  duration_seconds: number | null;
};

function useVideo(idOrSlug: string) {
  const [video, setVideo] = React.useState<VideoDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/educacao/${idOrSlug}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.status === 404) {
        setError("Aula não encontrada.");
      } else if (!res.ok) {
        setError("Não consegui carregar a aula.");
      } else {
        const data = (await res.json()) as { video: VideoDetail };
        setVideo(data.video);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { video, loading, error };
}

function markCompleted(videoId: string) {
  return fetch("/api/educacao/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ video_id: videoId, completed: true }),
  });
}

// =================================================================
// BODY
// =================================================================

function VideoBody({ idOrSlug, desktop = false }: { idOrSlug: string; desktop?: boolean }) {
  const { video, loading, error } = useVideo(idOrSlug);
  const [marking, setMarking] = React.useState(false);
  const [marked, setMarked] = React.useState(false);

  if (loading) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Abrindo aula" />
      </div>
    );
  }

  if (error || !video) {
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
            href="/educacao"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pras aulas
          </Link>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    setMarking(true);
    try {
      const res = await markCompleted(video.id);
      if (res.ok) setMarked(true);
    } finally {
      setMarking(false);
    }
  };

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
          paddingBottom: desktop ? "32px" : "24px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="lilac" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
        <SparkleField count={10} seed={717} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[960px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/educacao"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pras aulas
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* Player + conteúdo */}
      <section className={`relative ${desktop ? "px-12" : "px-5"} pb-12`}>
        <div className={desktop ? "max-w-[960px] mx-auto" : ""}>
          {/* Player */}
          <SectionReveal direction="up">
            <div className="aspect-video rounded-spark-3xl overflow-hidden bg-black shadow-hero">
              <iframe
                src={youtubeEmbedUrl(video.youtube_id, { autoplay: false })}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </SectionReveal>

          {/* Metadata */}
          <SectionReveal direction="up" delay={150}>
            <div className="mt-8 flex items-center gap-2 flex-wrap">
              {video.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[11px] font-extrabold tracking-tight">
                  <GraduationCap size={11} strokeWidth={2.5} />
                  {video.category}
                </span>
              )}
              {marked && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-good text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lift">
                  <Check size={12} strokeWidth={2.5} />
                  assistida
                </span>
              )}
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <h1
              className="mt-6 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{
                fontSize: desktop ? "clamp(2.25rem, 4vw, 3.75rem)" : "clamp(1.75rem, 7vw, 2.5rem)",
              }}
            >
              {video.title.toLowerCase()}
            </h1>
          </SectionReveal>

          {video.description && (
            <SectionReveal direction="up" delay={400}>
              <div className="mt-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 sm:p-8 shadow-rest">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} strokeWidth={2.4} className="text-spark-brand-deep" />
                  <span className="text-eyebrow text-spark-brand">sobre a aula</span>
                </div>
                <p className="text-fluid-body text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            </SectionReveal>
          )}

          {/* Actions */}
          <SectionReveal direction="up" delay={550}>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleComplete}
                disabled={marking || marked}
                className={cn(
                  "group inline-flex items-center gap-2 px-7 py-4 rounded-full text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium",
                  "hover:-translate-y-0.5 active:translate-y-0",
                  "disabled:opacity-70 disabled:hover:translate-y-0",
                  marked
                    ? "bg-good text-white"
                    : "bg-spark-ink text-white hover:bg-spark-brand-deep",
                )}
              >
                <Check
                  size={15}
                  strokeWidth={2.5}
                  className={cn(
                    "transition-transform duration-300",
                    marked ? "scale-110" : "group-hover:scale-110",
                  )}
                />
                {marking
                  ? "Marcando..."
                  : marked
                    ? "Aula assistida"
                    : "Marcar como assistida"}
              </button>
              <Link
                href="/agentes"
                className="group inline-flex items-center gap-2 px-7 py-4 rounded-full glass border border-spark-hairline text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift"
              >
                Aplicar com agentes
                <ArrowUpRight
                  size={15}
                  strokeWidth={2.5}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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

function VideoMobile({ idOrSlug }: { idOrSlug: string }) {
  return <VideoBody idOrSlug={idOrSlug} />;
}

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<VideoMobile idOrSlug={idOrSlug} />}
        desktop={<VideoBody idOrSlug={idOrSlug} desktop />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
    </>
  );
}
