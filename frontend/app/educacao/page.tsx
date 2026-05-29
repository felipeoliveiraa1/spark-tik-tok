"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  PlayCircle,
  CheckCircle2,
  GraduationCap,
  Radio,
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
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";

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

type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  youtube_id: string;
  starts_at: string;
  ends_at: string | null;
  duration_minutes: number | null;
};

function fmtDuration(s: number | null): string | null {
  if (!s || s <= 0) return null;
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function fmtLiveDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =================================================================
// DATA
// =================================================================

function useEducacao() {
  const [videos, setVideos] = React.useState<EducationVideo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressRow>>({});
  const [lives, setLives] = React.useState<LiveEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [vRes, pRes, lRes] = await Promise.all([
        fetch("/api/educacao", { cache: "no-store" }),
        fetch("/api/educacao/progress", { cache: "no-store" }),
        fetch("/api/ao-vivo", { cache: "no-store" }),
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
      if (lRes.ok) {
        const data = (await lRes.json()) as { events: LiveEvent[] };
        setLives(data.events);
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

  // Lives em destaque pro hub: ao vivo agora + próximas (sem replays)
  const featuredLives = React.useMemo(() => {
    const now = new Date();
    const live: LiveEvent[] = [];
    const upcoming: LiveEvent[] = [];
    for (const e of lives) {
      const status = getLiveStatus(e, now);
      if (status === "live") live.push(e);
      else if (status === "upcoming") upcoming.push(e);
    }
    upcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    // Ao vivo primeiro, depois próximos. Limita a 3 cards no hub.
    return [...live, ...upcoming].slice(0, 3);
  }, [lives]);

  const replaysCount = React.useMemo(() => {
    const now = new Date();
    return lives.filter((e) => getLiveStatus(e, now) === "replay").length;
  }, [lives]);

  return {
    videos,
    grouped,
    progress,
    featuredLives,
    totalLives: lives.length,
    replaysCount,
    loading,
  };
}

// =================================================================
// HERO
// =================================================================

function HeroSection({
  totalAulas,
  completed,
  hasLiveNow,
  desktop,
}: {
  totalAulas: number;
  completed: number;
  hasLiveNow: boolean;
  desktop: boolean;
}) {
  const pct = totalAulas > 0 ? Math.round((completed / totalAulas) * 100) : 0;
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
            <div className="text-eyebrow text-spark-brand-deep flex items-center gap-2">
              {hasLiveNow && (
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-bad animate-pulse-soft" />
                  <span className="relative w-2 h-2 rounded-full bg-bad" />
                </span>
              )}
              ✦ educação tts
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[36ch] font-semibold">
              Aulas em vídeo e lives ao vivo com a Yara — tudo num lugar só.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="EDUCAÇÃO · TTS · 2026 · " emoji="🎓" size={128} />
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

        {totalAulas > 0 && (
          <SectionReveal direction="up" delay={700}>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-[480px]">
              <div className="rounded-spark-2xl glass border border-spark-hairline p-4">
                <div className="text-eyebrow text-spark-ink-50 mb-1.5">aulas</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-ink text-[28px]">
                  <CountUp value={totalAulas} durationMs={900} />
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
// LIVE CARD (compacto, pro hub)
// =================================================================

function LiveHubCard({
  event,
  status,
  index,
}: {
  event: LiveEvent;
  status: "live" | "upcoming";
  index: number;
}) {
  const countdown =
    status === "upcoming" ? formatCountdown(minutesUntil(event.starts_at)) : null;

  return (
    <SectionReveal delay={Math.min(index * 70, 260)}>
      <Link
        href={`/ao-vivo/${event.slug}`}
        className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
      >
        <div className="relative aspect-video bg-spark-surface-sunken overflow-hidden">
          {event.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-200 via-pink-100 to-amber-100 flex items-center justify-center">
              <Radio size={64} strokeWidth={1.4} className="text-spark-brand-deep opacity-50" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

          {/* Play / Live ring center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "w-16 h-16 rounded-full glass flex items-center justify-center shadow-lift transition-all duration-300 ease-premium",
                "group-hover:scale-110",
              )}
            >
              {status === "live" ? (
                <Radio size={28} strokeWidth={2.2} className="text-bad animate-pulse" />
              ) : (
                <PlayCircle size={30} strokeWidth={1.8} className="text-spark-ink" />
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            {status === "live" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bad text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift">
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-white animate-pulse" />
                  <span className="relative w-2 h-2 rounded-full bg-white" />
                </span>
                AO VIVO
              </span>
            )}
            {status === "upcoming" && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-grad text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift-brand">
                {countdown}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-2">
            {event.title}
          </h3>
          <div className="mt-3 text-[10.5px] text-spark-ink-50 font-mono first-letter:capitalize">
            {fmtLiveDate(event.starts_at)}
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// LIVES — SEÇÃO DESTAQUE
// =================================================================

function LivesHubSection({
  featured,
  replaysCount,
  desktop,
}: {
  featured: LiveEvent[];
  replaysCount: number;
  desktop: boolean;
}) {
  if (featured.length === 0 && replaysCount === 0) return null;

  const now = new Date();
  const hasLiveNow = featured.some((e) => getLiveStatus(e, now) === "live");

  return (
    <SectionReveal>
      <section
        className={cn(
          "relative rounded-spark-3xl border overflow-hidden shadow-rest",
          hasLiveNow
            ? "bg-spark-surface border-spark-brand/20"
            : "bg-spark-surface border-spark-hairline",
        )}
      >
        {/* Mini blob decor */}
        <HeroBlob color="rose" variant={1} className="-top-20 -right-20 w-[240px] h-[240px] opacity-50" />
        <SparkleField count={6} seed={2024} className="opacity-40" />

        <div className="relative p-5 lg:p-7">
          <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
            <div>
              <div className="text-eyebrow text-spark-brand flex items-center gap-2">
                {hasLiveNow && (
                  <span className="relative inline-flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-bad animate-pulse-soft" />
                    <span className="relative w-2 h-2 rounded-full bg-bad" />
                  </span>
                )}
                ✦ {hasLiveNow ? "rolando agora" : "próximos encontros"}
              </div>
              <h2
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                {hasLiveNow ? (
                  <>
                    a yara <span className="text-grad-brand">tá no ar.</span>
                  </>
                ) : featured.length > 0 ? (
                  <>
                    próxima live <span className="text-grad-brand">com a yara.</span>
                  </>
                ) : (
                  <>
                    sem live agora — <span className="text-grad-brand">tem replay.</span>
                  </>
                )}
              </h2>
            </div>

            <Link
              href="/ao-vivo"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink text-[12px] font-extrabold hover:bg-spark-brand-soft hover:text-spark-brand-deep hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-rest"
            >
              Ver todas as lives
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div
              className={cn(
                "grid gap-4",
                featured.length === 1
                  ? "grid-cols-1"
                  : featured.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : desktop
                      ? "grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {featured.map((e, i) => {
                const status = getLiveStatus(e, new Date());
                if (status !== "live" && status !== "upcoming") return null;
                return (
                  <LiveHubCard key={e.id} event={e} status={status} index={i} />
                );
              })}
            </div>
          ) : (
            <Link
              href="/ao-vivo"
              className="group block p-5 rounded-spark-2xl bg-spark-surface-sunken/40 border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-spark-surface text-spark-ink flex items-center justify-center shadow-rest">
                  <PlayCircle size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-extrabold text-spark-ink">
                    {replaysCount} {replaysCount === 1 ? "replay disponível" : "replays disponíveis"}
                  </div>
                  <div className="text-[12.5px] text-spark-ink-50 mt-0.5">
                    Reveja os encontros anteriores da Yara
                  </div>
                </div>
                <ArrowUpRight
                  size={16}
                  strokeWidth={2.5}
                  className="text-spark-ink-50 group-hover:text-spark-brand-deep group-hover:translate-x-0.5 transition-all duration-300"
                />
              </div>
            </Link>
          )}
        </div>
      </section>
    </SectionReveal>
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center shadow-lift transition-all duration-300 ease-premium group-hover:scale-110">
              <PlayCircle size={30} strokeWidth={1.8} className="text-spark-ink" />
            </div>
          </div>

          {watched && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-good text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                Assistida
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>

          {duration && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-white text-[10.5px] font-extrabold font-mono">
              {duration}
            </div>
          )}

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
// EMPTY (sem aulas E sem lives)
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
            sem conteúdo<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <p className="mt-6 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch] mx-auto">
            A Yara está preparando aulas e lives. Em breve você tem tudo aqui ✨
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
  const {
    videos,
    grouped,
    progress,
    featuredLives,
    totalLives,
    replaysCount,
    loading,
  } = useEducacao();
  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const hasLiveNow = featuredLives.some(
    (e) => getLiveStatus(e, new Date()) === "live",
  );
  const isEmpty = videos.length === 0 && totalLives === 0;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection
        totalAulas={videos.length}
        completed={completedCount}
        hasLiveNow={hasLiveNow}
        desktop={desktop}
      />

      {loading ? (
        <section className="py-24 flex justify-center">
          <LoadingSplash message="Carregando educação" />
        </section>
      ) : isEmpty ? (
        <EmptyEducation desktop={desktop} />
      ) : (
        <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
          <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
            <div className="space-y-14">
              {/* Lives em destaque (sempre primeiro, se houver) */}
              {totalLives > 0 && (
                <LivesHubSection
                  featured={featuredLives}
                  replaysCount={replaysCount}
                  desktop={desktop}
                />
              )}

              {/* Trilha de aulas, agrupada por categoria */}
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
