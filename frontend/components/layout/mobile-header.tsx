"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Header mobile unificado. Substitui os 3 padrões inline (pt-12/pt-14/etc)
 * que existiam espalhados pelas páginas. Padding top é aditivo: soma o
 * safe-area (notch) com o padding base — antes a class `safe-top` zerava
 * o pt-12 em devices sem notch.
 *
 * Uso comum:
 *   <MobileHeader title="Produto" back={{ href: "/produtos" }} />
 *   <MobileHeader center={<Logo />} />
 *   <MobileHeader title="Conta" trailing={<Avatar />} />
 */

type BackProp = {
  href: string;
  /** Texto do link, padrão usa só a seta. */
  label?: string;
  /** Aria-label customizado, padrão "Voltar". */
  ariaLabel?: string;
};

type Props = {
  title?: string | null;
  subtitle?: string | null;
  back?: BackProp;
  trailing?: React.ReactNode;
  /** Conteúdo central custom (ex: logo). Quando passado, ignora title/subtitle. */
  center?: React.ReactNode;
  className?: string;
  /** Sem borda inferior. Default: sem borda. */
  bordered?: boolean;
};

const HIT_CLS =
  "w-10 h-10 rounded-full flex items-center justify-center text-spark-ink active:scale-95 transition-transform";

export function MobileHeader({
  title,
  subtitle,
  back,
  trailing,
  center,
  className,
  bordered = false,
}: Props) {
  const hasCenter = Boolean(center);
  // Aditivo: 48px base (ou 60px se houver logo grande) + safe-area do notch.
  const basePt = hasCenter ? 60 : 48;
  const basePb = hasCenter ? 16 : 12;
  return (
    <div
      className={cn(
        "px-2 flex items-center gap-1.5 relative bg-white/95",
        hasCenter && "min-h-[100px]",
        bordered && "border-b border-spark-hairline",
        className,
      )}
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${basePt}px)`,
        paddingBottom: `${basePb}px`,
      }}
    >
      {back ? (
        <Link
          href={back.href}
          aria-label={back.ariaLabel ?? "Voltar"}
          className={cn(HIT_CLS, back.label && "w-auto px-2.5 gap-1.5")}
        >
          <ArrowLeft size={22} strokeWidth={2} />
          {back.label && (
            <span className="text-[13px] font-semibold text-spark-ink-70">
              {back.label}
            </span>
          )}
        </Link>
      ) : (
        <div className="w-2" />
      )}

      {hasCenter ? (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="pointer-events-auto">{center}</div>
          </div>
          <div className="flex-1" />
        </>
      ) : (
        <div className="flex-1 min-w-0 px-1">
          {title && (
            <div className="text-[17px] font-extrabold text-spark-ink tracking-tight truncate leading-tight">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-[11.5px] text-spark-ink-50 font-mono truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {trailing ?? <div className="w-2" />}
    </div>
  );
}
