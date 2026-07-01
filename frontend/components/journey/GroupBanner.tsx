"use client";

import Link from "next/link";
import { MessageCircle, ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Banner do grupo WhatsApp da jornada. Aparece no topo do hub
 * /jornadas/[slug] antes dos modulos.
 *
 * Dois estados:
 * - hasLink=true (ex: Jornada 1): card verde WhatsApp com CTA "Entrar no grupo".
 *   O href aponta pra /jornadas/[slug]/grupo que faz a detecçao de in-app browser
 *   (Insta/TikTok) e mostra interstitial pra "abrir no navegador externo".
 * - hasLink=false (ex: J2/J3): card cinza "Em breve — te avisamos quando abrir".
 */
export function GroupBanner({
  journeySlug,
  journeyLabel,
  hasLink,
}: {
  journeySlug: string;
  journeyLabel: string;
  hasLink: boolean;
}) {
  if (hasLink) {
    return (
      <Link
        href={`/jornadas/${journeySlug}/grupo`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "block rounded-spark-xl border-2 shadow-lift overflow-hidden",
          "border-emerald-400/50 active:scale-[0.99] hover:shadow-lift-brand transition-all",
        )}
        style={{
          background:
            "linear-gradient(135deg, oklch(0.68 0.18 145) 0%, oklch(0.55 0.18 155) 100%)",
        }}
      >
        <div className="relative p-4 md:p-5 flex items-center gap-3 text-white">
          <div className="shrink-0 w-11 h-11 rounded-full bg-white/20 border border-white/35 flex items-center justify-center backdrop-blur-sm">
            <MessageCircle size={20} strokeWidth={2.4} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/85">
              Grupo · {journeyLabel}
            </div>
            <div className="font-display text-[16px] leading-tight mt-0.5">
              Entrar no grupo do WhatsApp
            </div>
            <div className="text-[11.5px] text-white/85 leading-snug mt-1">
              Comunidade da turma pra dividir resultado e tirar dúvida
            </div>
          </div>
          <ArrowUpRight size={18} strokeWidth={2.4} className="text-white/90 shrink-0" />
        </div>
      </Link>
    );
  }

  // Em breve — sem link ainda
  return (
    <div
      className="block rounded-spark-xl border-2 border-spark-hairline bg-spark-surface shadow-rest overflow-hidden cursor-not-allowed select-none"
      aria-disabled="true"
    >
      <div className="p-4 md:p-5 flex items-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-full bg-spark-ink/8 border border-spark-hairline flex items-center justify-center">
          <Lock size={18} strokeWidth={2.4} className="text-spark-ink-50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-spark-ink-50">
            Grupo · {journeyLabel}
          </div>
          <div className="font-display text-[16px] text-spark-ink-70 leading-tight mt-0.5">
            Em breve
          </div>
          <div className="text-[11.5px] text-spark-ink-50 leading-snug mt-1">
            Cada jornada tem seu próprio grupo — te avisamos quando abrir 💕
          </div>
        </div>
      </div>
    </div>
  );
}
