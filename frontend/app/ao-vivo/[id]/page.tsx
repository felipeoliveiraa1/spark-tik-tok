"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { SBadge } from "@/components/atoms/s-badge";
import { youtubeEmbedUrl } from "@/lib/youtube";
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

function LiveBody({ idOrSlug, desktop = false }: { idOrSlug: string; desktop?: boolean }) {
  const { event, loading, error } = useLive(idOrSlug);
  const [tick, setTick] = React.useState(0);

  // Atualiza status a cada 30s pra mudar upcoming → live automaticamente
  React.useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  if (loading) return <LoadingSplash message="Abrindo live" />;
  if (error || !event) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro."}
        <div className="mt-3">
          <Link href="/ao-vivo" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  const status = getLiveStatus(event);
  // ref ao tick pra forçar re-cálculo (eslint reclamava sem usar)
  void tick;

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[1200px]" : "px-4 pt-2"}>
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
          {/* Player / cover */}
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
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
          {status === "live" && (
            <div className="hidden lg:block aspect-video rounded-2xl overflow-hidden border border-spark-hairline">
              <iframe
                src={`https://www.youtube.com/live_chat?v=${event.youtube_id}&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
                className="w-full h-full"
                title="Chat ao vivo"
              />
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2 flex-wrap">
            {status === "live" && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bad text-white text-[11px] font-extrabold uppercase tracking-[0.05em]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AO VIVO
              </span>
            )}
            {status === "upcoming" && (
              <SBadge tone="brand">{formatCountdown(minutesUntil(event.starts_at))}</SBadge>
            )}
            {status === "replay" && <SBadge tone="neutral">📼 Replay disponível</SBadge>}
            <SBadge>{fmtDate(event.starts_at)}</SBadge>
          </div>

          <h1
            className={`mt-2 font-extrabold tracking-tight leading-tight ${desktop ? "text-[28px]" : "text-[22px]"}`}
          >
            {event.title}
          </h1>
          {event.description && (
            <p className="mt-3 text-[14.5px] text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownCover({ event }: { event: LiveEvent }) {
  const [min, setMin] = React.useState(() => minutesUntil(event.starts_at));
  React.useEffect(() => {
    const i = setInterval(() => setMin(minutesUntil(event.starts_at)), 30_000);
    return () => clearInterval(i);
  }, [event.starts_at]);

  return (
    <div className="w-full h-full relative bg-brand-grad-hero text-white flex flex-col items-center justify-center p-8 text-center">
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
      <div className="relative">
        <div className="text-[11px] uppercase font-bold tracking-[0.08em] opacity-90">
          🔴 Live agendada
        </div>
        <div className="mt-3 text-[44px] sm:text-[64px] font-extrabold leading-none">
          {formatCountdown(min)}
        </div>
        <div className="mt-2 text-[13px] opacity-90">
          Volte aqui na hora pra assistir 💕
        </div>
      </div>
    </div>
  );
}

function LiveMobile({ idOrSlug }: { idOrSlug: string }) {
  return (
    <>
      <MobileHeader title="Live" back={{ href: "/ao-vivo" }} />
      <LiveBody idOrSlug={idOrSlug} />
      <BottomNav active="ao-vivo" />
    </>
  );
}

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<LiveMobile idOrSlug={idOrSlug} />}
      desktop={<LiveBody idOrSlug={idOrSlug} desktop />}
      active="ao-vivo"
    />
  );
}
