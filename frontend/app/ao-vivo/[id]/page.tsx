"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Radio,
  MessageSquare,
  X,
  MicOff,
  VideoOff,
  MonitorUp,
  Hand,
  Settings,
  Send,
  Calendar,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useToast } from "@/components/molecules/dialog-provider";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";
import { cn } from "@/lib/cn";

// =================================================================
// TYPES
// =================================================================

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

type LiveStatus = "live" | "upcoming" | "replay";

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isProf?: boolean;
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function nowHHmm(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =================================================================
// HOOK
// =================================================================

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
// STAGE PLACEHOLDER (upcoming countdown)
// =================================================================

function StagePlaceholder({
  event,
  onExit,
}: {
  event: LiveEvent;
  onExit: () => void;
}) {
  const [min, setMin] = React.useState(() => minutesUntil(event.starts_at));
  React.useEffect(() => {
    const i = setInterval(() => setMin(minutesUntil(event.starts_at)), 30_000);
    return () => clearInterval(i);
  }, [event.starts_at]);

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white">
      {event.cover_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-spark-ink/40 to-spark-ink/80" />
        </>
      )}
      <SparkleField
        count={14}
        seed={808}
        color="rgba(255,255,255,0.55)"
        className="opacity-60"
      />

      <div className="relative text-center px-6 max-w-[520px]">
        <div className="inline-flex items-center gap-2 mb-5 text-[11px] font-extrabold uppercase tracking-widest opacity-90">
          <Radio size={14} strokeWidth={2.4} />
          live agendada
        </div>
        <div
          className="font-display lowercase leading-none tracking-tight"
          style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
        >
          {event.title.toLowerCase()}
        </div>
        <div
          className="mt-6 font-display lowercase leading-none tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          {formatCountdown(min).toLowerCase()}
        </div>
        <p className="mt-5 text-[14px] opacity-85 leading-relaxed font-semibold">
          A aula tá prestes a começar. Volte aqui na hora ou descansa em outra parte
          do app 💕
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-full glass border border-white/20 text-white text-[13px] font-extrabold hover:bg-white/15 transition-all duration-300 ease-premium"
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          Voltar pras lives
        </button>
      </div>
    </div>
  );
}

// =================================================================
// DOCK (controles de participação)
// =================================================================

function Dock({
  handRaised,
  onToggleHand,
  onExit,
}: {
  handRaised: boolean;
  onToggleHand: () => void;
  onExit: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Controles de participação na aula"
      className="inline-flex items-center gap-1.5 px-2 py-2 rounded-full glass-dark border border-white/15 shadow-hero"
    >
      {/* Grupo 1: AV (placeholder, disabled — aluna só assiste) */}
      <div className="flex items-center gap-1.5">
        <DockBtn label="Microfone bloqueado" disabled Icon={MicOff} />
        <DockBtn label="Câmera bloqueada" disabled Icon={VideoOff} />
        <DockBtn label="Compartilhar tela" disabled Icon={MonitorUp} />
      </div>

      <DockSep />

      {/* Grupo 2: Levantar mão (real, com toggle) */}
      <button
        type="button"
        onClick={onToggleHand}
        aria-pressed={handRaised}
        aria-label="Levantar a mão pra falar"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-extrabold transition-all duration-300 ease-premium",
          handRaised
            ? "bg-brand-grad text-white shadow-lift-brand"
            : "text-white hover:bg-white/10",
        )}
      >
        <Hand
          size={14}
          strokeWidth={2.4}
          className={cn("transition-transform", handRaised ? "rotate-12 scale-110" : "")}
        />
        {handRaised ? "Mão levantada" : "Levantar mão"}
      </button>

      <DockSep />

      {/* Grupo 3: settings (disabled) + sair */}
      <div className="flex items-center gap-1.5">
        <DockBtn label="Configurações" disabled Icon={Settings} />
        <button
          type="button"
          onClick={onExit}
          aria-label="Sair da aula"
          className="w-10 h-10 rounded-full bg-bad/80 hover:bg-bad text-white flex items-center justify-center shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function DockBtn({
  Icon,
  label,
  disabled,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={false}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
        disabled
          ? "text-white/30 cursor-not-allowed"
          : "text-white hover:bg-white/10",
      )}
    >
      <Icon size={16} strokeWidth={2.4} />
    </button>
  );
}

function DockSep() {
  return <div aria-hidden className="w-px h-6 bg-white/15" />;
}

// =================================================================
// CHAT ASIDE (slide-in)
// =================================================================

function ChatAside({
  open,
  onClose,
  status,
  event,
  desktop,
}: {
  open: boolean;
  onClose: () => void;
  status: LiveStatus;
  event: LiveEvent;
  desktop: boolean;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop só no mobile */}
      <div
        aria-hidden
        onClick={onClose}
        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-label="Chat ao vivo da aula"
        className={cn(
          "fixed z-50 bg-spark-surface border border-spark-hairline shadow-hero flex flex-col overflow-hidden",
          desktop
            ? "top-20 right-6 bottom-6 w-[380px] rounded-spark-3xl"
            : "inset-x-3 bottom-3 top-20 rounded-spark-3xl",
        )}
        style={{ animation: "slide-in-right 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
      >
        <header className="px-5 py-4 border-b border-spark-hairline flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} strokeWidth={2.5} className="text-spark-brand-deep" />
            <span className="text-[13.5px] font-extrabold text-spark-ink">Chat</span>
            <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-spark-surface-sunken text-[10px] font-extrabold uppercase tracking-wider text-spark-ink-70">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status === "live" ? "bg-bad animate-pulse" : "bg-spark-ink-50",
                )}
              />
              {status === "live"
                ? "ao vivo"
                : status === "upcoming"
                  ? "aguardando"
                  : "replay"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar chat"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 relative">
          {status === "live" ? (
            // YouTube live chat embed
            <iframe
              src={`https://www.youtube.com/live_chat?v=${event.youtube_id}&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`}
              className="absolute inset-0 w-full h-full"
              title="Chat ao vivo"
            />
          ) : (
            // Preview/demo do que será o chat (upcoming ou replay)
            <ChatPreview status={status} />
          )}
        </div>

        {/* Input/footer */}
        {status !== "live" && (
          <div className="border-t border-spark-hairline p-4 bg-spark-surface-sunken/30 shrink-0">
            <div className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-full bg-spark-surface border border-spark-hairline text-[12px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              <Send size={11} strokeWidth={2.5} />
              {status === "upcoming"
                ? "Chat libera quando a aula começar"
                : "Chat encerrado · veja replay"}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function ChatSystemRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span aria-hidden className="flex-1 h-px bg-spark-hairline" />
      <span className="text-[10.5px] text-spark-ink-50 font-extrabold uppercase tracking-widest px-2">
        {text}
      </span>
      <span aria-hidden className="flex-1 h-px bg-spark-hairline" />
    </div>
  );
}

function ChatMsgRow({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-2.5 py-2">
      <span
        aria-hidden
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold",
          msg.isProf
            ? "bg-brand-grad text-white shadow-lift-brand"
            : "bg-spark-surface-sunken text-spark-ink-70",
        )}
      >
        {getInitials(msg.author)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[12.5px] font-extrabold text-spark-ink truncate">
            {msg.author}
          </span>
          {msg.isProf && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[9px] font-extrabold uppercase tracking-widest">
              PROF
            </span>
          )}
          <span className="text-[10.5px] text-spark-ink-50 font-mono">{msg.timestamp}</span>
        </div>
        <div className="text-[13px] text-spark-ink leading-snug">{msg.text}</div>
      </div>
    </div>
  );
}

function ChatPreview({ status }: { status: LiveStatus }) {
  const demos: ChatMessage[] = [
    {
      id: "1",
      author: "Yara",
      text: "Oi linda, sejam bem-vindas! Comecem mandando seu nome no chat 👋",
      timestamp: "18:56",
      isProf: true,
    },
    {
      id: "2",
      author: "Mariana C.",
      text: "Boa noite! Animada pra aula de hoje 💕",
      timestamp: "18:57",
    },
    {
      id: "3",
      author: "Bia M.",
      text: "Cheguei!",
      timestamp: "18:57",
    },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <ChatSystemRow
        text={status === "upcoming" ? "Pré-aula · prévia do chat" : "Encerrado"}
      />
      {demos.map((m) => (
        <ChatMsgRow key={m.id} msg={m} />
      ))}
      {status === "upcoming" && (
        <div className="mt-4 p-4 rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/15">
          <p className="text-[12.5px] text-spark-ink-70 font-semibold leading-relaxed">
            ✨ Quando a Yara começar a transmitir, o chat liberar e suas mensagens
            aparecem aqui em tempo real.
          </p>
        </div>
      )}
    </div>
  );
}

// =================================================================
// BODY — SALA DE AULA
// =================================================================

function ClassroomBody({
  idOrSlug,
  desktop = false,
}: {
  idOrSlug: string;
  desktop?: boolean;
}) {
  const { event, loading, error } = useLive(idOrSlug);
  const [tick, setTick] = React.useState(0);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [handRaised, setHandRaised] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);
  void tick;

  // Lock scroll do body quando chat aberto no mobile
  React.useEffect(() => {
    if (!desktop && chatOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [chatOpen, desktop]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] hero-radial">
        <LoadingSplash message="Abrindo a sala" />
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
            Voltar pras lives
          </Link>
        </div>
      </div>
    );
  }

  const status: LiveStatus = getLiveStatus(event);
  const exitHref = "/ao-vivo";
  const toggleHand = () => {
    setHandRaised((v) => {
      const next = !v;
      toast.success(next ? "Mão levantada 🙋‍♀️" : "Mão abaixada");
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-spark-ink relative overflow-hidden">
      {/* ============== STAGE ============== */}
      <section
        className="relative shrink-0 bg-spark-ink overflow-hidden"
        style={{
          height: desktop ? "calc(100vh - 0px)" : "calc(100dvh - 0px)",
          minHeight: desktop ? "640px" : "100dvh",
        }}
      >
        {/* Blob sutil de ambiente */}
        <HeroBlob
          color="deep"
          variant={1}
          className="-top-32 -left-32 w-[420px] h-[420px] opacity-40"
        />
        <HeroBlob
          color="lilac"
          variant={2}
          className="-bottom-32 -right-32 w-[420px] h-[420px] opacity-40"
        />

        {/* Player ou placeholder */}
        <div className="absolute inset-0 flex items-center justify-center p-6 lg:p-12">
          {status === "upcoming" ? (
            <div className="relative w-full h-full max-w-[1400px] rounded-spark-3xl overflow-hidden bg-spark-ink border border-white/10 shadow-hero">
              <StagePlaceholder
                event={event}
                onExit={() => (window.location.href = exitHref)}
              />
            </div>
          ) : (
            <div className="relative w-full max-w-[1400px] aspect-video rounded-spark-3xl overflow-hidden bg-black border border-white/10 shadow-hero">
              <iframe
                src={youtubeEmbedUrl(event.youtube_id, { autoplay: status === "live" })}
                title={event.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                onLoad={() => markAttendance(event.id, status === "live")}
              />
              {/* Mask sutil canto inferior direito pra disfarçar logo YT */}
              <div
                aria-hidden
                className="absolute bottom-0 right-0 w-14 h-7 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 0%, transparent 30%, oklch(0.18 0.02 340 / 0.5) 100%)",
                }}
              />
            </div>
          )}
        </div>

        {/* TOP-LEFT: Sair da aula */}
        <Link
          href={exitHref}
          className="group absolute z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-dark border border-white/15 text-white text-[12.5px] font-extrabold shadow-lift hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 ease-premium"
          style={{
            top: desktop ? "24px" : "calc(env(safe-area-inset-top) + 12px)",
            left: desktop ? "24px" : "12px",
          }}
        >
          <ArrowLeft
            size={14}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          Sair da aula
        </Link>

        {/* TOP-CENTER: Pill com info */}
        <div
          className="absolute z-30 left-1/2 -translate-x-1/2 max-w-[min(72vw,480px)]"
          style={{
            top: desktop ? "24px" : "calc(env(safe-area-inset-top) + 12px)",
          }}
        >
          <div className="px-4 py-2.5 rounded-full glass-dark border border-white/15 shadow-lift">
            <div className="flex items-center gap-2.5 min-w-0">
              {status === "live" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bad text-white text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                  <span className="relative inline-flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-white animate-pulse" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  AO VIVO
                </span>
              )}
              {status === "replay" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-white text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                  ◉ REPLAY
                </span>
              )}
              <div className="min-w-0">
                <div className="text-[12.5px] font-extrabold text-white truncate leading-tight">
                  {event.title}
                </div>
                <div className="text-[10px] text-white/70 font-semibold truncate">
                  com Yara
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Chat FAB */}
        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Abrir chat"
            className="absolute z-30 right-4 lg:right-6 inline-flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-brand-grad text-white shadow-hero hover:-translate-y-0.5 transition-all duration-300 ease-premium"
            style={{
              top: desktop ? "calc(50% - 28px)" : "auto",
              bottom: desktop ? "auto" : "calc(env(safe-area-inset-bottom) + 120px)",
            }}
          >
            <MessageSquare size={20} strokeWidth={2.4} />
          </button>
        )}

        {/* BOTTOM-CENTER: Dock */}
        <div
          className="absolute z-30 left-1/2 -translate-x-1/2"
          style={{
            bottom: desktop ? "24px" : "calc(env(safe-area-inset-bottom) + 20px)",
          }}
        >
          <Dock
            handRaised={handRaised}
            onToggleHand={toggleHand}
            onExit={() => (window.location.href = exitHref)}
          />
        </div>
      </section>

      {/* ============== METADADOS abaixo do stage (rola pra ver) ============== */}
      <section
        className={cn(
          "relative bg-spark-bg",
          desktop ? "px-12 py-12" : "px-5 py-10",
        )}
      >
        <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline text-[11px] font-extrabold text-spark-ink-70 tracking-tight first-letter:capitalize">
              <Calendar size={11} strokeWidth={2.5} />
              {fmtDate(event.starts_at)}
            </span>
          </div>

          <h1
            className="font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
            style={{
              fontSize: desktop ? "clamp(2.25rem, 4vw, 3.75rem)" : "clamp(1.75rem, 7vw, 2.5rem)",
            }}
          >
            {event.title.toLowerCase()}
          </h1>

          {event.description && (
            <div className="mt-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 sm:p-8 shadow-rest">
              <div className="flex items-center gap-2 mb-4">
                <Radio size={16} strokeWidth={2.4} className="text-spark-brand-deep" />
                <span className="text-eyebrow text-spark-brand">sobre o encontro</span>
              </div>
              <p className="text-fluid-body text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============== CHAT ASIDE ============== */}
      <ChatAside
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        status={status}
        event={event}
        desktop={desktop}
      />

      {/* Keyframes inline pro slide-in */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function LiveMobile({ idOrSlug }: { idOrSlug: string }) {
  return <ClassroomBody idOrSlug={idOrSlug} />;
}

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<LiveMobile idOrSlug={idOrSlug} />}
      desktop={<ClassroomBody idOrSlug={idOrSlug} desktop />}
      active="educacao"
      customSidebar
      fullBleed
    />
  );
}
