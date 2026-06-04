"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Radio, PlayCircle, CheckCircle2 } from "lucide-react";
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

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useLives() {
  const [events, setEvents] = React.useState<LiveEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [watched, setWatched] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [evRes, prRes] = await Promise.all([
        fetch("/api/ao-vivo", { cache: "no-store" }),
        fetch("/api/ao-vivo/progress", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (evRes.ok) {
        const data = (await evRes.json()) as { events: LiveEvent[] };
        setEvents(data.events);
      }
      if (prRes.ok) {
        const data = (await prRes.json()) as {
          progress: { live_id: string; completed: boolean }[];
        };
        setWatched(new Set(data.progress.filter((p) => p.completed).map((p) => p.live_id)));
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const groups = React.useMemo(() => {
    const live: LiveEvent[] = [];
    const upcoming: LiveEvent[] = [];
    const replays: LiveEvent[] = [];
    for (const e of events) {
      const status = getLiveStatus(e, now);
      if (status === "live") live.push(e);
      else if (status === "upcoming") upcoming.push(e);
      else replays.push(e);
    }
    upcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    return { live, upcoming, replays };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return { events, groups, loading, watched };
}

// =================================================================
// HERO
// =================================================================

function HeroSection({ liveCount, totalCount, desktop }: { liveCount: number; totalCount: number; desktop: boolean }) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "80px" : "56px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="deep" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
      <SparkleField count={14} seed={808} className="opacity-70" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/educacao"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra Educação
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep flex items-center gap-2">
              {liveCount > 0 && (
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-bad animate-pulse-soft" />
                  <span className="relative w-2 h-2 rounded-full bg-bad" />
                </span>
              )}
              ✦ encontros com a yara
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              Lives, plantões e Q&amp;As. Assiste tudo dentro do app.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="AO VIVO · 2026 · LIVE · " emoji="🔴" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[16ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <span className="block text-spark-ink">{liveCount > 0 ? "rolando" : "ao vivo"}</span>
            <span className="block text-grad-brand">
              {liveCount > 0 ? "agora." : "com a yara."}
            </span>
          </h1>
        </SectionReveal>

        {totalCount > 0 && (
          <SectionReveal direction="up" delay={700}>
            <div className="mt-8 inline-flex items-center gap-2 text-[13px] text-spark-ink-70 font-semibold">
              <span className="font-extrabold text-fluid-title text-spark-ink leading-none">
                <CountUp value={totalCount} durationMs={900} />
              </span>
              {totalCount === 1 ? "encontro disponível" : "encontros disponíveis"}
            </div>
          </SectionReveal>
        )}
      </div>
    </section>
  );
}

// =================================================================
// LIVE CARD
// =================================================================

function LiveCard({
  event,
  status,
  index,
  watched = false,
}: {
  event: LiveEvent;
  status: "live" | "upcoming" | "replay";
  index: number;
  watched?: boolean;
}) {
  const countdown =
    status === "upcoming" ? formatCountdown(minutesUntil(event.starts_at)) : null;

  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
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

          {/* Overlay gradient pra legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* Play button center */}
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

          {/* Badge "assistida" top-right */}
          {watched && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-good text-white text-[10.5px] font-extrabold uppercase tracking-widest shadow-lift">
                <CheckCircle2 size={11} strokeWidth={2.5} />
                Assistida
              </span>
            </div>
          )}

          {/* Badge top-left */}
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
              <span className="inline-flex items-center px-3 py-1.5 rounded-full glass text-spark-ink text-[10.5px] font-extrabold uppercase tracking-widest">
                ◉ replay
              </span>
            )}
          </div>

          {/* Arrow top-right */}
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-2 text-[12.5px] text-spark-ink-70 leading-snug line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-spark-hairline text-[10.5px] text-spark-ink-50 font-mono first-letter:capitalize">
            {fmtDate(event.starts_at)}
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// SECTIONS
// =================================================================

function GroupSection({
  emoji,
  title,
  tone,
  desktop,
  children,
}: {
  emoji: string;
  title: string;
  tone?: "brand" | "default";
  desktop: boolean;
  children: React.ReactNode;
}) {
  return (
    <SectionReveal>
      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[24px]">{emoji}</span>
          <h2
            className={cn(
              "text-eyebrow tracking-widest",
              tone === "brand" ? "text-spark-brand" : "text-spark-ink-50",
            )}
          >
            {title}
          </h2>
        </div>
        <div className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {children}
        </div>
      </section>
    </SectionReveal>
  );
}

// =================================================================
// EMPTY
// =================================================================

function EmptyLives({ desktop }: { desktop: boolean }) {
  return (
    <section className={cn("relative overflow-hidden", desktop ? "py-24 px-12" : "py-16 px-5")}>
      <HeroBlob color="rose" variant={2} className="-top-10 -left-20 w-[400px] h-[400px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 -right-20 w-[360px] h-[360px]" />
      <SparkleField count={10} seed={111} className="opacity-50" />

      <div className={cn("relative text-center", desktop ? "max-w-[680px] mx-auto" : "")}>
        <SectionReveal direction="scale">
          <div className="mx-auto w-24 h-24 rounded-full bg-brand-grad-soft flex items-center justify-center mb-7 shadow-lift animate-float">
            <span className="text-[48px]">🔴</span>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            sem lives<br />
            <span className="text-grad-brand">agendadas ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <p className="mt-6 text-fluid-body text-spark-ink-70 leading-snug max-w-[42ch] mx-auto">
            Quando a Yara marcar um encontro, você vai ver aqui. Replays anteriores também aparecem
            nesta aba 💕
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY
// =================================================================

function AoVivoBody({ desktop = false }: { desktop?: boolean }) {
  const { events, groups, loading, watched } = useLives();
  const total = events.length;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection liveCount={groups.live.length} totalCount={total} desktop={desktop} />

      {loading ? (
        <section className="py-24 flex justify-center">
          <LoadingSplash message="Carregando lives" />
        </section>
      ) : events.length === 0 ? (
        <EmptyLives desktop={desktop} />
      ) : (
        <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
          <div className={desktop ? "max-w-[1100px] mx-auto" : ""}>
            <div className="space-y-12">
              {groups.live.length > 0 && (
                <GroupSection emoji="🔴" title="ao vivo agora" tone="brand" desktop={desktop}>
                  {groups.live.map((e, i) => (
                    <LiveCard key={e.id} event={e} status="live" index={i} watched={watched.has(e.id)} />
                  ))}
                </GroupSection>
              )}

              {groups.upcoming.length > 0 && (
                <GroupSection emoji="📅" title="próximos encontros" desktop={desktop}>
                  {groups.upcoming.map((e, i) => (
                    <LiveCard key={e.id} event={e} status="upcoming" index={i} watched={watched.has(e.id)} />
                  ))}
                </GroupSection>
              )}

              {groups.replays.length > 0 && (
                <GroupSection emoji="📼" title="replays" desktop={desktop}>
                  {groups.replays.map((e, i) => (
                    <LiveCard key={e.id} event={e} status="replay" index={i} watched={watched.has(e.id)} />
                  ))}
                </GroupSection>
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

function AoVivoMobile() {
  return <AoVivoBody />;
}

function AoVivoDesktop() {
  return <AoVivoBody desktop />;
}

export default function AoVivoPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<AoVivoMobile />}
        desktop={<AoVivoDesktop />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
    </>
  );
}
