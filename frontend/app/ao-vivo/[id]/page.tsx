"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Radio } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";
import { cn } from "@/lib/cn";

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
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useLive(idOrSlug: string) {
  const [event, setEvent] = React.useState<LiveEvent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/ao-vivo/${idOrSlug}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.status === 404) setError("Live não encontrada.");
      else if (!res.ok) setError("Não consegui carregar.");
      else {
        const data = (await res.json()) as { event: LiveEvent };
        setEvent(data.event);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { event, loading, error };
}

function markAttendance(liveId: string, watchedLive: boolean) {
  void fetch("/api/educacao/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ live_id: liveId, watched_live: watchedLive }),
  }).catch(() => {});
}

// =================================================================
// COUNTDOWN COVER (quando upcoming)
// =================================================================

function CountdownCover({ event }: { event: LiveEvent }) {
  const [min, setMin] = React.useState(() => minutesUntil(event.starts_at));
  React.useEffect(() => {
    const i = setInterval(() => setMin(minutesUntil(event.starts_at)), 30_000);
    return () => clearInterval(i);
  }, [event.starts_at]);

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {event.cover_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        </>
      )}
      <SparkleField count={10} seed={808} color="rgba(255,255,255,0.5)" className="opacity-60" />
      <div className="relative">
        <div className="text-eyebrow text-white/90 flex items-center justify-center gap-2 mb-3">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-white animate-pulse-soft" />
            <span className="relative w-2 h-2 rounded-full bg-white" />
          </span>
          live agendada
        </div>
        <div
          className="font-display lowercase leading-none tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          {formatCountdown(min).toLowerCase()}
        </div>
        <div className="mt-4 text-fluid-body opacity-90">
          Volte aqui na hora pra assistir 💕
        </div>
      </div>
    </div>
  );
}

// =================================================================
// BODY
// =================================================================

function LiveBody({ idOrSlug, desktop = false }: { idOrSlug: string; desktop?: boolean }) {
  const { event, loading, error } = useLive(idOrSlug);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  if (loading) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Abrindo live" />
      </div>
    );
  }

  if (error || !event) {
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
            href="/ao-vivo"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra lives
          </Link>
        </div>
      </div>
    );
  }

  const status = getLiveStatus(event);
  void tick;

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
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
        <SparkleField count={10} seed={616} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/ao-vivo"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pra lives
            </Link>
          </SectionReveal>
        </div>
      </section>

      {/* Player + chat */}
      <section className={`relative ${desktop ? "px-12" : "px-5"} pb-12`}>
        <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
          <SectionReveal direction="up">
            <div className={cn("grid gap-4", desktop && status === "live" ? "lg:grid-cols-[1.4fr_1fr]" : "")}>
              {/* Player / cover */}
              <div className="aspect-video rounded-spark-3xl overflow-hidden bg-black shadow-hero">
                {status === "upcoming" ? (
                  <CountdownCover event={event} />
                ) : (
                  <iframe
                    src={youtubeEmbedUrl(event.youtube_id, { autoplay: status === "live" })}
                    title={event.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                    onLoad={() => markAttendance(event.id, status === "live")}
                  />
                )}
              </div>

              {/* Chat YouTube (só durante a live) */}
              {status === "live" && desktop && (
                <div className="hidden lg:block aspect-video rounded-spark-3xl overflow-hidden border border-spark-hairline shadow-hero">
                  <iframe
                    src={`https://www.youtube.com/live_chat?v=${event.youtube_id}&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
                    className="w-full h-full"
                    title="Chat ao vivo"
                  />
                </div>
              )}
            </div>
          </SectionReveal>

          {/* Metadata */}
          <SectionReveal direction="up" delay={150}>
            <div className="mt-8 flex items-center gap-2 flex-wrap">
              {status === "live" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bad text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lift">
                  <span className="relative inline-flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-white animate-pulse" />
                    <span className="relative w-2 h-2 rounded-full bg-white" />
                  </span>
                  AO VIVO
                </span>
              )}
              {status === "upcoming" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-grad text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lift-brand">
                  {formatCountdown(minutesUntil(event.starts_at))}
                </span>
              )}
              {status === "replay" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full glass border border-spark-hairline text-spark-ink text-[11px] font-extrabold uppercase tracking-widest">
                  ◉ replay disponível
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline text-[11px] font-extrabold text-spark-ink-70 tracking-tight first-letter:capitalize">
                <Calendar size={11} strokeWidth={2.5} />
                {fmtDate(event.starts_at)}
              </span>
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <h1
              className="mt-6 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{
                fontSize: desktop ? "clamp(2.25rem, 4vw, 3.75rem)" : "clamp(1.75rem, 7vw, 2.5rem)",
              }}
            >
              {event.title.toLowerCase()}
            </h1>
          </SectionReveal>

          {event.description && (
            <SectionReveal direction="up" delay={400}>
              <div className="mt-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 sm:p-8 shadow-rest">
                <div className="flex items-center gap-2 mb-4">
                  <Radio size={16} strokeWidth={2.4} className="text-spark-brand-deep" />
                  <span className="text-eyebrow text-spark-brand">sobre o encontro</span>
                </div>
                <p className="text-fluid-body text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function LiveMobile({ idOrSlug }: { idOrSlug: string }) {
  return <LiveBody idOrSlug={idOrSlug} />;
}

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<LiveMobile idOrSlug={idOrSlug} />}
        desktop={<LiveBody idOrSlug={idOrSlug} desktop />}
        active="ao-vivo"
        customSidebar
      />
      <FloatingMainNav active="ao-vivo" />
    </>
  );
}
