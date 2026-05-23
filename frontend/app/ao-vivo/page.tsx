"use client";

import * as React from "react";
import Link from "next/link";
import { Radio, PlayCircle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { SBadge } from "@/components/atoms/s-badge";
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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/ao-vivo", { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = (await res.json()) as { events: LiveEvent[] };
        setEvents(data.events);
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

  return { events, groups, loading };
}

function AoVivoBody({ desktop = false }: { desktop?: boolean }) {
  const { events, groups, loading } = useLives();

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          🔴 Encontros ao vivo
        </div>
        <h1
          className={`mt-1 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[36px]" : "text-[26px]"}`}
        >
          Ao vivo com a Yara ✨
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Lives, plantões e Q&amp;As com a Yara. Você assiste dentro do app — sem precisar abrir
          o YouTube. 💕
        </p>
      </div>

      <div className={`mt-6 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando lives" />
        ) : events.length === 0 ? (
          <EmptyLives />
        ) : (
          <div className="flex flex-col gap-7">
            {groups.live.length > 0 && (
              <Section title="🔴 AO VIVO AGORA" tone="brand">
                <Grid desktop={desktop}>
                  {groups.live.map((e) => (
                    <LiveCard key={e.id} event={e} status="live" />
                  ))}
                </Grid>
              </Section>
            )}

            {groups.upcoming.length > 0 && (
              <Section title="📅 PRÓXIMAS">
                <Grid desktop={desktop}>
                  {groups.upcoming.map((e) => (
                    <LiveCard key={e.id} event={e} status="upcoming" />
                  ))}
                </Grid>
              </Section>
            )}

            {groups.replays.length > 0 && (
              <Section title="📼 REPLAYS">
                <Grid desktop={desktop}>
                  {groups.replays.map((e) => (
                    <LiveCard key={e.id} event={e} status="replay" />
                  ))}
                </Grid>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "brand";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className={`text-[12px] font-bold tracking-[0.08em] uppercase mb-3 ${
          tone === "brand" ? "text-spark-brand" : "text-spark-ink-50"
        }`}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function Grid({ desktop, children }: { desktop: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-3 ${desktop ? "grid-cols-3 max-w-[920px]" : "grid-cols-1"}`}>
      {children}
    </div>
  );
}

function LiveCard({
  event,
  status,
}: {
  event: LiveEvent;
  status: "live" | "upcoming" | "replay";
}) {
  const countdown =
    status === "upcoming" ? formatCountdown(minutesUntil(event.starts_at)) : null;
  return (
    <Link
      href={`/ao-vivo/${event.slug}`}
      className="group rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover:border-spark-ink/30 transition-colors flex flex-col"
    >
      <div className="relative aspect-video bg-spark-surface-sunken overflow-hidden">
        {event.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
            {status === "live" ? (
              <Radio size={22} strokeWidth={1.8} className="text-bad animate-pulse" />
            ) : (
              <PlayCircle size={26} strokeWidth={1.5} />
            )}
          </div>
        </div>

        {status === "live" && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bad text-white text-[10.5px] font-extrabold uppercase tracking-[0.05em]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AO VIVO
            </span>
          </div>
        )}
        {status === "upcoming" && (
          <div className="absolute top-2 left-2">
            <SBadge tone="brand">{countdown}</SBadge>
          </div>
        )}
        {status === "replay" && (
          <div className="absolute top-2 left-2">
            <SBadge tone="neutral">Replay</SBadge>
          </div>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col gap-1">
        <div className="text-[14px] font-extrabold tracking-[-0.01em] line-clamp-2">
          {event.title}
        </div>
        <div className="text-[11px] text-spark-ink-50 font-mono">{fmtDate(event.starts_at)}</div>
        {event.description && (
          <p className="text-[12px] text-spark-ink-50 line-clamp-2 leading-snug mt-0.5">
            {event.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyLives() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        🔴
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem lives agendadas 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        Quando a Yara marcar um encontro, você vai ver aqui. Replays anteriores também aparecem
        nesta aba. ✨
      </p>
    </div>
  );
}

function AoVivoMobile() {
  return (
    <>
      <MobileHeader title="Ao vivo 🔴" />
      <AoVivoBody />
      <BottomNav active="ao-vivo" />
    </>
  );
}

function AoVivoDesktop() {
  return <AoVivoBody desktop />;
}

export default function AoVivoPage() {
  return (
    <ResponsiveShell mobile={<AoVivoMobile />} desktop={<AoVivoDesktop />} active="ao-vivo" />
  );
}
