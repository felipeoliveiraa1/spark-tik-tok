"use client";

import Link from "next/link";
import { Trophy, Camera, Lock, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type ProofStatus =
  | "locked"
  | "pending"
  | "approved"
  | "rejected"
  | "ready"
  | "coming_soon";

/**
 * Card "Prova final" no hub da jornada — mostrado APOS os ModuleCards.
 * Versao em-pagina do antigo ProofStoryCard (que era fullscreen story).
 * Estados:
 * - locked: termine todos os modulos primeiro
 * - ready: pode enviar print agora
 * - pending: em analise
 * - approved: aprovada (mostra emoji + link pra rever)
 * - rejected: precisa enviar de novo
 */
export function ProofFinalCard({
  journeySlug,
  proofStatus,
  modulesCompleted,
  totalModules,
}: {
  journeySlug: string;
  proofStatus: ProofStatus;
  modulesCompleted: number;
  totalModules: number;
}) {
  const cfg = {
    coming_soon: {
      title: "Em breve · Prova final",
      subtitle:
        "A prova vai abrir em breve. Enquanto isso, aproveita as aulas 💕",
      Icon: Lock,
      bg: "linear-gradient(135deg, oklch(0.62 0.08 280) 0%, oklch(0.45 0.08 280) 100%)",
      cta: null as null | { label: string; href: string; Icon: typeof Camera },
    },
    locked: {
      title: "Prova final bloqueada",
      subtitle: `Termine os ${totalModules} módulos pra desbloquear.`,
      Icon: Lock,
      bg: "linear-gradient(135deg, oklch(0.55 0.05 280) 0%, oklch(0.38 0.05 280) 100%)",
      cta: null as null | { label: string; href: string; Icon: typeof Camera },
    },
    ready: {
      title: "Hora da prova!",
      subtitle:
        "Você terminou todos os módulos. Envia um print do TikTok Shop mostrando suas vendas.",
      Icon: Trophy,
      bg: "linear-gradient(135deg, oklch(0.78 0.18 70) 0%, oklch(0.58 0.18 50) 100%)",
      cta: { label: "Enviar print", href: `/jornadas/${journeySlug}/prova`, Icon: Camera },
    },
    pending: {
      title: "Em análise",
      subtitle: "Sua prova foi enviada. Revisamos em até 24h.",
      Icon: Clock,
      bg: "linear-gradient(135deg, oklch(0.78 0.18 70) 0%, oklch(0.55 0.18 60) 100%)",
      cta: null,
    },
    approved: {
      title: "Aprovada! 🎉",
      subtitle: "Você completou a jornada. Bora pra próxima.",
      Icon: CheckCircle2,
      bg: "linear-gradient(135deg, oklch(0.72 0.18 145) 0%, oklch(0.52 0.18 155) 100%)",
      cta: { label: "Ver Jornadas", href: "/jornadas", Icon: ChevronRight },
    },
    rejected: {
      title: "Precisa tentar de novo",
      subtitle: "Sua prova foi rejeitada. Manda outro print mais nítido.",
      Icon: AlertCircle,
      bg: "linear-gradient(135deg, oklch(0.65 0.22 30) 0%, oklch(0.45 0.22 25) 100%)",
      cta: { label: "Reenviar", href: `/jornadas/${journeySlug}/prova`, Icon: Camera },
    },
  }[proofStatus];

  const { Icon } = cfg;

  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full rounded-spark-xl overflow-hidden shadow-lift border-2",
        proofStatus === "approved"
          ? "border-emerald-400"
          : proofStatus === "rejected"
            ? "border-red-400"
            : proofStatus === "locked"
              ? "border-spark-ink/15"
              : "border-amber-400",
      )}
      style={{ background: cfg.bg }}
    >
      {/* Glow circle atras do icone */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center shrink-0">
        <Icon size={42} strokeWidth={2.3} className="text-white" />
      </div>

      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between pr-28">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">
          Prova final · Jornada
        </div>
        <div>
          <h2
            className="font-display text-[19px] md:text-[22px] leading-tight text-white"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          >
            {cfg.title}
          </h2>
          <p className="text-[12.5px] text-white/90 mt-1 leading-snug">
            {cfg.subtitle}
          </p>
        </div>

        {cfg.cta && (
          <Link
            href={cfg.cta.href}
            className="self-start inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-spark-ink text-[12.5px] font-extrabold shadow-lift active:scale-95 transition-transform"
          >
            <cfg.cta.Icon size={13} strokeWidth={2.6} />
            {cfg.cta.label}
          </Link>
        )}
        {!cfg.cta && proofStatus === "locked" && (
          <div className="text-[11.5px] font-extrabold text-white/80 inline-flex items-center gap-1.5">
            <Lock size={12} />
            {modulesCompleted}/{totalModules} módulos completos
          </div>
        )}
      </div>
    </div>
  );
}
