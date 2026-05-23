"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Header mobile com 2 variantes:
 *  - `solid` (default): fundo branco translúcido, texto escuro.
 *  - `gradient`: fundo gradient rose-pink com curve na base, texto branco.
 *    Usado nas listagens e páginas detalhe pra dar identidade visual.
 *
 * Padding top é aditivo: env(safe-area-inset-top) + base. Antes a class
 * `safe-top` sobrescrevia o pt em devices sem notch.
 *
 * Uso:
 *   <MobileHeader title="Produtos 📦" variant="gradient" />
 *   <MobileHeader title="Produto" back={{ href: "/produtos" }} variant="gradient" />
 *   <MobileHeader center={<Logo />} variant="gradient" />
 */

type BackProp = {
  href: string;
  /** Texto do link, padrão usa só a seta. */
  label?: string;
  /** Aria-label customizado, padrão "Voltar". */
  ariaLabel?: string;
};

type Variant = "solid" | "gradient";

type Props = {
  title?: string | null;
  subtitle?: string | null;
  back?: BackProp;
  trailing?: React.ReactNode;
  /** Conteúdo central custom (ex: logo). Quando passado, ignora title/subtitle. */
  center?: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const HIT_BASE = "w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform";

export function MobileHeader({
  title,
  subtitle,
  back,
  trailing,
  center,
  variant = "gradient",
  className,
}: Props) {
  const hasCenter = Boolean(center);
  const isGradient = variant === "gradient";
  const basePt = hasCenter ? 60 : 52;
  const basePb = hasCenter ? 24 : 22;

  const textCls = isGradient ? "text-white" : "text-spark-ink";
  const subtitleCls = isGradient ? "text-white/75" : "text-spark-ink-50";
  const hitCls = cn(HIT_BASE, isGradient ? "text-white hover:bg-white/10" : "text-spark-ink hover:bg-spark-surface-sunken");

  return (
    <div
      className={cn(
        "relative px-2 flex items-center gap-1.5 rounded-b-[28px]",
        isGradient
          ? "bg-brand-grad shadow-[0_12px_30px_-18px_oklch(0.55_0.24_340/0.55)]"
          : "bg-white/95 border-b border-spark-hairline",
        hasCenter && "min-h-[112px]",
        className,
      )}
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${basePt}px)`,
        paddingBottom: `${basePb}px`,
      }}
    >
      {/* Highlight diagonal sutil pro gradient ganhar profundidade */}
      {isGradient && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-b-[28px] pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
      )}

      <div className="relative flex items-center gap-1.5 w-full">
        {back ? (
          <Link
            href={back.href}
            aria-label={back.ariaLabel ?? "Voltar"}
            className={cn(hitCls, back.label && "w-auto px-2.5 gap-1.5")}
          >
            <ArrowLeft size={22} strokeWidth={2.2} />
            {back.label && (
              <span className={cn("text-[13px] font-semibold", isGradient ? "text-white/90" : "text-spark-ink-70")}>
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
              <div className={cn("text-[18px] font-extrabold tracking-tight truncate leading-tight", textCls)}>
                {title}
              </div>
            )}
            {subtitle && (
              <div className={cn("text-[11.5px] font-mono truncate mt-0.5", subtitleCls)}>
                {subtitle}
              </div>
            )}
          </div>
        )}

        {trailing ?? <div className="w-2" />}
      </div>
    </div>
  );
}
