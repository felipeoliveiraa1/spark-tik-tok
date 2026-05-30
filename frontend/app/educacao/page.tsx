"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  PlayCircle,
  GraduationCap,
  Radio,
  CheckCircle2,
  ListChecks,
  FileText,
  Sparkles,
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
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { HelpMenu } from "@/components/molecules/help-menu";
import { type TutorialStep } from "@/lib/tutorial";

// =================================================================
// TYPES
// =================================================================

type LessonKind = "video" | "rich" | "checklist";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: LessonKind;
  youtube_id: string | null;
  body_md: string | null;
  checklist_items: { text: string }[] | null;
  cover_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_published: boolean;
  module_id: string | null;
};

type Module = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  accent: string | null;
  order_index: number;
  is_published: boolean;
  lessons: Lesson[];
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

function useHubData() {
  const [modules, setModules] = React.useState<Module[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressRow>>({});
  const [lives, setLives] = React.useState<LiveEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [eduRes, pRes, lRes] = await Promise.all([
        fetch("/api/educacao", { cache: "no-store" }),
        fetch("/api/educacao/progress", { cache: "no-store" }),
        fetch("/api/ao-vivo", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (eduRes.ok) {
        const data = (await eduRes.json()) as { modules: Module[] };
        setModules(data.modules);
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

  // Prioridade: live agora → próximas (sorted) → replays (mais recentes primeiro).
  // Mostra até 3 cards combinados — quando só tem replay, eles preenchem a vitrine.
  const featuredLives = React.useMemo(() => {
    const now = new Date();
    const live: LiveEvent[] = [];
    const upcoming: LiveEvent[] = [];
    const replays: LiveEvent[] = [];
    for (const e of lives) {
      const status = getLiveStatus(e, now);
      if (status === "live") live.push(e);
      else if (status === "upcoming") upcoming.push(e);
      else replays.push(e);
    }
    upcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    replays.sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));
    return [...live, ...upcoming, ...replays].slice(0, 3);
  }, [lives]);

  const replaysCount = React.useMemo(() => {
    const now = new Date();
    return lives.filter((e) => getLiveStatus(e, now) === "replay").length;
  }, [lives]);

  return {
    modules,
    progress,
    featuredLives,
    totalLives: lives.length,
    replaysCount,
    loading,
  };
}

// =================================================================
// ACCENT → tailwind classes
// =================================================================

const ACCENT_CLASSES: Record<string, { gradFrom: string; gradTo: string; ring: string }> = {
  rose: {
    gradFrom: "from-rose-300/60",
    gradTo: "to-pink-200/40",
    ring: "ring-rose-300/50",
  },
  peach: {
    gradFrom: "from-orange-200/60",
    gradTo: "to-rose-200/40",
    ring: "ring-orange-300/50",
  },
  lilac: {
    gradFrom: "from-purple-200/60",
    gradTo: "to-pink-200/40",
    ring: "ring-purple-300/50",
  },
};

function accentClasses(accent: string | null) {
  return ACCENT_CLASSES[accent || "rose"] ?? ACCENT_CLASSES.rose;
}

// =================================================================
// HERO
// =================================================================

function HeroSection({
  totalModules,
  totalLessons,
  completed,
  hasLiveNow,
  desktop,
  onReopenTour,
}: {
  totalModules: number;
  totalLessons: number;
  completed: number;
  hasLiveNow: boolean;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
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

      <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
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
            <div data-tutorial-id="educacao-intro">
              <div className="text-eyebrow text-spark-brand-deep flex items-center gap-2">
                {hasLiveNow && (
                  <span className="relative inline-flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-bad animate-pulse-soft" />
                    <span className="relative w-2 h-2 rounded-full bg-bad" />
                  </span>
                )}
                ✦ educação · método tts
              </div>
              <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[40ch] font-semibold">
                Módulos editoriais, aulas em vídeo, lives ao vivo e checklist interativo — tudo dentro do app.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="TRILHA · MÉTODO TTS · 2026 · " emoji="🎓" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-7 font-display lowercase leading-[0.88] tracking-tight max-w-[16ch]"
            style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
          >
            <span className="block text-spark-ink">a trilha</span>
            <span className="block text-grad-brand">do método.</span>
          </h1>
        </SectionReveal>

        {totalModules > 0 && (
          <SectionReveal direction="up" delay={700}>
            <div data-tutorial-id="educacao-stats" className="mt-10 grid grid-cols-3 gap-3 max-w-[560px]">
              <div className="rounded-spark-2xl glass border border-spark-hairline p-4">
                <div className="text-eyebrow text-spark-ink-50 mb-1.5">módulos</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-ink text-[26px]">
                  <CountUp value={totalModules} durationMs={800} />
                </div>
              </div>
              <div className="rounded-spark-2xl glass border border-spark-hairline p-4">
                <div className="text-eyebrow text-spark-ink-50 mb-1.5">aulas</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-ink text-[26px]">
                  <CountUp value={totalLessons} durationMs={900} />
                </div>
              </div>
              <div className="rounded-spark-2xl bg-spark-brand-soft/40 border border-spark-brand/20 p-4">
                <div className="text-eyebrow text-spark-brand-deep mb-1.5">progresso</div>
                <div className="font-extrabold tracking-tight leading-none text-spark-brand-deep text-[26px]">
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
// MODULE CARD — magazine
// =================================================================

function ModuleCard({
  mod,
  index,
  progress,
}: {
  mod: Module;
  index: number;
  progress: Record<string, ProgressRow>;
}) {
  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => progress[l.id]?.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const acc = accentClasses(mod.accent);

  const kindIcons = mod.lessons.reduce(
    (acc, l) => {
      acc[l.kind] = (acc[l.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<LessonKind, number>,
  );

  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
      <Link
        href={`/educacao/m/${mod.slug}`}
        className="group block rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest hover:shadow-hero transition-all duration-500 ease-premium h-full"
      >
        {/* Cover */}
        <div
          className={cn(
            "relative aspect-[16/10] overflow-hidden bg-gradient-to-br",
            acc.gradFrom,
            acc.gradTo,
          )}
        >
          {mod.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mod.cover_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-display lowercase leading-none tracking-tight text-spark-ink/15 select-none"
                style={{ fontSize: "clamp(5rem, 10vw, 10rem)" }}
              >
                {String(index).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Module number badge */}
          <div className="absolute top-4 left-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/30 text-spark-ink text-[10.5px] font-extrabold uppercase tracking-widest shadow-rest">
              <span className="font-mono">cap. {String(index).padStart(2, "0")}</span>
            </div>
          </div>

          {/* Arrow on hover */}
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={16} strokeWidth={2.5} className="text-spark-ink" />
          </div>

          {/* Lessons count bottom-left */}
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-[11px] text-white font-extrabold uppercase tracking-wider">
            {kindIcons.video > 0 && (
              <span className="inline-flex items-center gap-1">
                <PlayCircle size={11} strokeWidth={2.5} />
                {kindIcons.video}
              </span>
            )}
            {kindIcons.rich > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText size={11} strokeWidth={2.5} />
                {kindIcons.rich}
              </span>
            )}
            {kindIcons.checklist > 0 && (
              <span className="inline-flex items-center gap-1">
                <ListChecks size={11} strokeWidth={2.5} />
                {kindIcons.checklist}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 lg:p-7">
          <div className="text-eyebrow text-spark-brand mb-2">
            {mod.subtitle ?? "Módulo do Método TTS"}
          </div>
          <h3
            className="font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
          >
            {mod.title.toLowerCase()}
          </h3>
          {mod.description && (
            <p className="mt-3 text-[13.5px] text-spark-ink-70 leading-relaxed line-clamp-3">
              {mod.description}
            </p>
          )}

          {/* Progress */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-spark-surface-sunken overflow-hidden">
              <div
                className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[11.5px] text-spark-ink-70 font-extrabold font-mono shrink-0">
              {done}/{total}
            </div>
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// LIVES HUB (mantido do anterior)
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
  if (featured.length === 0) return null;

  const now = new Date();
  const hasLiveNow = featured.some((e) => getLiveStatus(e, now) === "live");
  const hasUpcoming = featured.some((e) => getLiveStatus(e, now) === "upcoming");
  const onlyReplays = !hasLiveNow && !hasUpcoming;
  const moreReplays = Math.max(0, replaysCount - featured.length);

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
                ✦{" "}
                {hasLiveNow
                  ? "rolando agora"
                  : hasUpcoming
                    ? "próximos encontros"
                    : "encontros com a yara"}
              </div>
              <h2
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                {hasLiveNow ? (
                  <>
                    a yara <span className="text-grad-brand">tá no ar.</span>
                  </>
                ) : hasUpcoming ? (
                  <>
                    próxima live <span className="text-grad-brand">com a yara.</span>
                  </>
                ) : (
                  <>
                    reveja as <span className="text-grad-brand">lives.</span>
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
              return <LiveHubCard key={e.id} event={e} status={status} index={i} />;
            })}
          </div>

          {onlyReplays && moreReplays > 0 && (
            <Link
              href="/ao-vivo"
              className="group mt-4 flex items-center justify-between gap-3 p-4 rounded-spark-2xl bg-spark-surface-sunken/40 border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium"
            >
              <div className="text-[13px] text-spark-ink-70 font-extrabold">
                + {moreReplays} {moreReplays === 1 ? "outro replay" : "outros replays"} no acervo
              </div>
              <ArrowUpRight
                size={14}
                strokeWidth={2.5}
                className="text-spark-ink-50 group-hover:text-spark-brand-deep group-hover:translate-x-0.5 transition-all duration-300"
              />
            </Link>
          )}
        </div>
      </section>
    </SectionReveal>
  );
}

function LiveHubCard({
  event,
  status,
  index,
}: {
  event: LiveEvent;
  status: "live" | "upcoming" | "replay";
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

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center shadow-lift transition-all duration-300 ease-premium group-hover:scale-110">
              {status === "live" ? (
                <Radio size={28} strokeWidth={2.2} className="text-bad animate-pulse" />
              ) : (
                <PlayCircle size={30} strokeWidth={1.8} className="text-spark-ink" />
              )}
            </div>
          </div>

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
            {status === "replay" && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full glass text-spark-ink text-[10.5px] font-extrabold uppercase tracking-widest shadow-rest">
                ◉ replay
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
            trilha vazia<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <p className="mt-6 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch] mx-auto">
            A Yara tá organizando os módulos. Em breve você tem tudo aqui ✨
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY
// =================================================================

function HubBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const { modules, progress, featuredLives, totalLives, replaysCount, loading } = useHubData();
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const hasLiveNow = featuredLives.some((e) => getLiveStatus(e, new Date()) === "live");
  const isEmpty = modules.length === 0 && totalLives === 0;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection
        totalModules={modules.length}
        totalLessons={totalLessons}
        completed={completedCount}
        hasLiveNow={hasLiveNow}
        desktop={desktop}
        onReopenTour={onReopenTour}
      />

      {loading ? (
        <section className="py-24 flex justify-center">
          <LoadingSplash message="Carregando trilha" />
        </section>
      ) : isEmpty ? (
        <EmptyEducation desktop={desktop} />
      ) : (
        <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
          <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
            <div className="space-y-14">
              {/* Lives destaque */}
              {totalLives > 0 && (
                <div data-tutorial-id="educacao-lives">
                  <LivesHubSection
                    featured={featuredLives}
                    replaysCount={replaysCount}
                    desktop={desktop}
                  />
                </div>
              )}

              {/* Módulos */}
              {modules.length > 0 && (
                <section data-tutorial-id="educacao-modulos">
                  <SectionReveal direction="up" durationMs={500}>
                    <div className="mb-7 flex items-end justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-eyebrow text-spark-brand mb-2 flex items-center gap-2">
                          <Sparkles size={11} strokeWidth={2.5} />
                          ✦ os módulos
                        </div>
                        <h2
                          className="font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
                          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                        >
                          a trilha completa do <span className="text-grad-brand">método.</span>
                        </h2>
                      </div>
                      <div className="text-[11.5px] text-spark-ink-50 font-mono font-extrabold uppercase tracking-wider">
                        {modules.length} {modules.length === 1 ? "módulo" : "módulos"} ·{" "}
                        {totalLessons} aulas
                      </div>
                    </div>
                  </SectionReveal>

                  <div
                    className={cn(
                      "grid gap-5",
                      desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
                    )}
                  >
                    {modules.map((m, i) => (
                      <ModuleCard key={m.id} mod={m} index={i} progress={progress} />
                    ))}
                  </div>
                </section>
              )}
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

function HubMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <HubBody onReopenTour={onReopenTour} />;
}

function HubDesktop({ onReopenTour }: { onReopenTour: () => void }) {
  return <HubBody desktop onReopenTour={onReopenTour} />;
}

// Steps do tour de Educação (7 steps com variantes mobile/desktop pro nav)
function buildEducacaoSteps(desktop: boolean): TutorialStep[] {
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
      title: "bem-vinda à educação!",
      description:
        "Aqui mora a trilha completa do método: módulos teóricos, aulas em vídeo, lives ao vivo e checklists. Em 30s te mostro como navegar.",
    },
    {
      id: "intro",
      target: "educacao-intro",
      title: "O que tem aqui dentro",
      description:
        "Quatro formatos pra você aprender no seu ritmo: módulos editoriais lendo, vídeos curtos, lives ao vivo e checklist interativo pra colocar em prática.",
    },
    {
      id: "stats",
      target: "educacao-stats",
      title: "Seu progresso visível",
      description:
        "Total de módulos, total de aulas e quantos % você já concluiu. Quanto mais aulas você marca como vista, maior o número da direita.",
    },
    {
      id: "lives",
      target: "educacao-lives",
      title: "Lives ao vivo + replays",
      description:
        "Se tem live acontecendo, aparece com indicador AO VIVO. As próximas e os replays gravados também ficam aqui pra você assistir quando quiser.",
    },
    {
      id: "modulos",
      target: "educacao-modulos",
      title: "Os módulos da trilha",
      description:
        "Cada card é um módulo com várias aulas. Clica num pra abrir, ver as aulas dentro, marcar como vista. Faz na ordem ou pula direto pro que precisa.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é estudar 💕",
      description:
        "Recomendo começar pelo primeiro módulo e ir marcando conforme avança. Pra refazer o tour, clica no ✨ Tour no canto.",
    },
  ];
}

function EducacaoPageContent() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildEducacaoSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <ResponsiveShell
        mobile={<HubMobile onReopenTour={reopenTour} />}
        desktop={<HubDesktop onReopenTour={reopenTour} />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
      <TutorialOverlay
        steps={steps}
        storageKey="educacao"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function EducacaoPage() {
  return <EducacaoPageContent />;
}
