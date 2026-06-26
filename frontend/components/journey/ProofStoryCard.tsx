"use client";

import Link from "next/link";
import { Trophy, Camera, Lock, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Card especial pra prova final no fim do deck.
 * Boss-fight visual: gradient dourado + trofeu pulsante + raios SVG.
 */
export function ProofStoryCard({
  journey,
  proofStatus,
  isActive,
  totalLessons,
}: {
  journey: { slug: string; title: string };
  proofStatus: "locked" | "pending" | "approved" | "rejected" | "ready";
  isActive: boolean;
  totalLessons: number;
}) {
  const isLocked = proofStatus === "locked";

  const statusConfig = {
    locked: {
      title: "Complete as aulas",
      subtitle: `Termine as ${totalLessons} aulas pra desbloquear a prova.`,
      cta: null,
      icon: Lock,
      iconColor: "text-white",
      ctaClass: "",
    },
    ready: {
      title: "Tesouro liberado!",
      subtitle: "Envia um print do TikTok Shop mostrando suas vendas.",
      cta: { label: "Enviar print", href: `/jornadas/${journey.slug}/prova`, icon: Camera },
      icon: Trophy,
      iconColor: "text-amber-200",
      ctaClass: "bg-white text-amber-700",
    },
    pending: {
      title: "Em análise",
      subtitle: "Sua prova foi enviada. Revisamos em até 24h.",
      cta: null,
      icon: Clock,
      iconColor: "text-amber-100",
      ctaClass: "",
    },
    approved: {
      title: "Aprovada! 🎉",
      subtitle: "Você completou a jornada. Volta pro mapa pra continuar.",
      cta: { label: "Voltar pras Jornadas", href: "/jornadas", icon: CheckCircle2 },
      icon: CheckCircle2,
      iconColor: "text-white",
      ctaClass: "bg-white text-emerald-700",
    },
    rejected: {
      title: "Precisa tentar de novo",
      subtitle: "Sua prova foi rejeitada. Manda outro print mais nítido.",
      cta: { label: "Reenviar prova", href: `/jornadas/${journey.slug}/prova`, icon: Camera },
      icon: AlertCircle,
      iconColor: "text-white",
      ctaClass: "bg-white text-red-700",
    },
  }[proofStatus];

  const Icon = statusConfig.icon;

  return (
    <article
      className={cn(
        "snap-center shrink-0 relative overflow-hidden",
        "w-screen md:w-[440px]",
        "h-[100dvh] md:h-[88dvh] md:rounded-spark-xl md:shadow-2xl",
      )}
      style={{
        scrollSnapStop: "always",
        background:
          proofStatus === "approved"
            ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
            : proofStatus === "rejected"
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)"
              : isLocked
                ? "linear-gradient(135deg, #57534e 0%, #44403c 50%, #292524 100%)"
                : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)",
      }}
      aria-label={`Prova final — ${statusConfig.title}`}
    >
      {/* Raios SVG rotacionando atras do trofeu (so se nao locked e ativo) */}
      {!isLocked && isActive && (
        <svg
          viewBox="0 0 100 100"
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: "min(120vw, 700px)",
            height: "min(120vw, 700px)",
            transform: "translate(-50%, -50%)",
            animation: "trophy-rays 18s linear infinite",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient id="ray-grad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.18" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="49"
              y="0"
              width="2"
              height="100"
              fill="url(#ray-grad)"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>
      )}

      {/* Sparkles (so se ativo e nao locked) */}
      {!isLocked && isActive && (
        <div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden>
          {[
            { l: "12%", t: "20%", d: "0s" },
            { l: "82%", t: "18%", d: "0.5s" },
            { l: "20%", t: "65%", d: "1s" },
            { l: "78%", t: "70%", d: "1.4s" },
            { l: "50%", t: "12%", d: "1.8s" },
            { l: "45%", t: "78%", d: "2.2s" },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute text-white text-xl"
              style={{
                left: s.l,
                top: s.t,
                animation: `story-twinkle 2.8s ease-in-out ${s.d} infinite`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      {/* Trofeu central */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[10]"
        style={{ top: "30%" }}
      >
        <div
          className="relative w-32 h-32 rounded-full bg-white/20 backdrop-blur border-4 border-white/40 flex items-center justify-center shadow-2xl"
          style={{
            animation:
              isLocked || !isActive
                ? undefined
                : "trophy-pulse 2.4s ease-in-out infinite",
          }}
        >
          <Icon size={64} strokeWidth={2.5} className={statusConfig.iconColor} />
        </div>
      </div>

      {/* Footer com titulo + CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[20] px-5 pt-16 pb-[max(env(safe-area-inset-bottom),20px)] text-center"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)",
        }}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80 mb-1.5">
          Prova final · Jornada
        </div>
        <h2
          className="font-display text-white text-[28px] md:text-[34px] leading-tight"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          {statusConfig.title}
        </h2>
        <p className="text-white/90 text-[14px] mt-2 leading-snug max-w-[36ch] mx-auto">
          {statusConfig.subtitle}
        </p>

        {statusConfig.cta && (
          <div className="mt-5">
            <Link
              href={statusConfig.cta.href}
              className={cn(
                "block w-full py-3.5 rounded-full text-[15px] font-extrabold shadow-2xl active:scale-95 transition-transform inline-flex items-center justify-center gap-2",
                statusConfig.ctaClass,
              )}
            >
              <statusConfig.cta.icon size={16} strokeWidth={2.6} />
              {statusConfig.cta.label}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
