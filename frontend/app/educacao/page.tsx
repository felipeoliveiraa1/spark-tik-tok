"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  PlayCircle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";

type EducationVideo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  duration_seconds: number | null;
};

type ProgressRow = { video_id: string; completed: boolean; progress_seconds: number };

function fmtDuration(s: number | null): string | null {
  if (!s || s <= 0) return null;
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function useEducacao() {
  const [videos, setVideos] = React.useState<EducationVideo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [vRes, pRes] = await Promise.all([
        fetch("/api/educacao", { cache: "no-store" }),
        fetch("/api/educacao/progress", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (vRes.ok) {
        const data = (await vRes.json()) as { videos: EducationVideo[] };
        setVideos(data.videos);
      }
      if (pRes.ok) {
        const data = (await pRes.json()) as { progress: ProgressRow[] };
        const byId: Record<string, ProgressRow> = {};
        for (const p of data.progress) byId[p.video_id] = p;
        setProgress(byId);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = React.useMemo(() => {
    const byCat = new Map<string, EducationVideo[]>();
    for (const v of videos) {
      const cat = v.category?.trim() || "Outras aulas";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(v);
    }
    return Array.from(byCat.entries());
  }, [videos]);

  return { videos, grouped, progress, loading };
}

// =================================================================
// HERO
// =================================================================

function HeroSection({
  total,
  completed,
  desktop,
}: {
  total: number;
  completed: number;
  desktop: boolean;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "80px" : "56px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
      <SparkleField count={14} seed={313} className="opacity-70" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra home
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ educação tts
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              Videoaulas da Yara pra você dominar o TikTok Shop do zero ao avançado.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="AULAS · TTS · 2026 · " emoji="🎓" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <span className="block text-spark-ink">aprenda</span>
            <span className="block text-grad-brand">com a yara.</span>
          </h1>
        </SectionReveal>

        {total > 0 && (
          <SectionReveal direction="up" delay={700}>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-[480px]">
              <div className="rounded-spark-2xl glass border border-spark-hairline p-4">
                <div className="text-eyebrow text-spark-ink-50 mb-1.5">aulas</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-ink text-[28px]">
                  <CountUp value={total} durationMs={900} />
                </div>
              </div>
              <div className="rounded-spark-2xl bg-spark-brand-soft/40 border border-spark-brand/20 p-4">
                <div className="text-eyebrow text-spark-brand-deep mb-1.5">progresso</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-brand-deep text-[28px]">
                  <CountUp value={pct} suffix="%" durationMs={1000} />
                </div>
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}

// =================================================================
// VIDEO CARD
// =================================================================

function VideoCard({
  v,
  progress,
  index,
}: {
  v: EducationVideo;
  progress: ProgressRow | undefined;
  index: number;
}) {
  const duration = fmtDuration(v.duration_seconds);
  const watched = progress?.completed;
  const partialPct =
    !watched && progress && v.duration_seconds && v.duration_seconds > 0
      ? Math.min(100, Math.round((progress.progress_seconds / v.duration_seconds) * 100))
      : 0;

  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
      <Link
        href={`/educacao/${v.slug}`}
        className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
      >
        <div className="relative aspect-video bg-spark-surface-sunken overflow-hidden">
          {v.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.cover_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-200 via-pink-100 to-amber-100 flex items-center justify-center">
              <GraduationCap size={64} strokeWidth={1.4} className="text-spark-brand-deep opacity-50" />
            </div>
          )}

          {/* Overlay pra legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Play button center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center shadow-lift transition-all duration-300 ease-premium group-hover:scale-110">
              <PlayCircle size={30} strokeWidth={1.8} className="text-spark-ink" />
            </div>
          </div>

          {/* Watched badge top-left */}
          {watched && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-good text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                Assistida
              </span>
            </div>
          )}

          {/* Arrow top-right */}
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>

          {/* Duration bottom-right */}
          {duration && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-[10.5px] font-extrabold font-mono">
              {duration}
            </div>
          )}

          {/* Progress bar inferior */}
          {partialPct > 0 && (
            <div className="absolute left-0 right-0 bottom-0 h-1 bg-black/20">
              <div
                className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                style={{ width: `${partialPct}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-2">
            {v.title}
          </h3>
          {v.description && (
            <p className="mt-2 text-[12.5px] text-spark-ink-70 leading-snug line-clamp-2">
              {v.description}
            </p>
          )}
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// EMPTY
// =================================================================

function EmptyEducation({ desktop }: { desktop: boolean }) {
  return (
    <section className={cn("relative overflow-hidden", desktop ? "py-24 px-12" : "py-16 px-5")}>
      <HeroBlob color="rose" variant={2} className="-top-10 -left-20 w-[400px] h-[400px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 -right-20 w-[360px] h-[360px]" />
      <SparkleField count={10} seed={222} className="opacity-50" />

      <div className={cn("relative text-center", desktop ? "max-w-[680px] mx-auto" : "")}>
        <SectionReveal direction="scale">
          <div className="mx-auto w-24 h-24 rounded-full bg-brand-grad-soft flex items-center justify-center mb-7 shadow-lift animate-float">
            <span className="text-[48px]">🎓</span>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            sem aulas<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <p className="mt-6 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch] mx-auto">
            A Yara está preparando o conteúdo. Em breve você terá videoaulas exclusivas aqui ✨
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY
// =================================================================

function EducacaoBody({ desktop = false }: { desktop?: boolean }) {
  const { videos, grouped, progress, loading } = useEducacao();
  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection total={videos.length} completed={completedCount} desktop={desktop} />

      {loading ? (
        <section className="py-24 flex justify-center">
          <LoadingSplash message="Carregando aulas" />
        </section>
      ) : videos.length === 0 ? (
        <EmptyEducation desktop={desktop} />
      ) : (
        <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
          <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
            <div className="space-y-14">
              {grouped.map(([cat, items], gi) => (
                <SectionReveal key={cat} delay={gi * 60}>
                  <section>
                    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-eyebrow text-spark-brand mb-2">
                          ✦ {items.length} {items.length === 1 ? "aula" : "aulas"}
                        </div>
                        <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight">
                          {cat.toLowerCase()}
                        </h2>
                      </div>
                    </div>
                    <div className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
                      {items.map((v, i) => (
                        <VideoCard key={v.id} v={v} progress={progress[v.id]} index={i} />
                      ))}
                    </div>
                  </section>
                </SectionReveal>
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

function EducacaoMobile() {
  return <EducacaoBody />;
}

function EducacaoDesktop() {
  return <EducacaoBody desktop />;
}

export default function EducacaoPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<EducacaoMobile />}
        desktop={<EducacaoDesktop />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
    </>
  );
}
