"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Header mobile com 4 variantes:
 *  - `solid`: fundo branco com border-bottom. Texto escuro.
 *  - `gradient` (default): fundo gradient rose-pink + curve. Texto branco.
 *  - `soft`: fundo blush claro com glow rose + curve. Texto escuro.
 *  - `editorial`: NOVO — header limpo com eyebrow + título fluido grande
 *    em vez do gradient pesado. Pra páginas-cara (home, agentes, rotina).
 *
 * Padding top é aditivo: env(safe-area-inset-top) + base.
 *
 * Uso:
 *   <MobileHeader title="Produtos 📦" />                          // gradient
 *   <MobileHeader title="Sua evolução" variant="editorial"
 *                 eyebrow="✨ ROTINA TTS" />                       // editorial
 *   <MobileHeader center={<Logo />} variant="soft" />             // home
 *   <MobileHeader title="Login" variant="solid" />                // sem identidade
 */

type BackProp = {
  href: string;
  /** Texto do link, padrão usa só a seta. */
  label?: string;
  /** Aria-label customizado, padrão "Voltar". */
  ariaLabel?: string;
};

type Variant = "solid" | "gradient" | "soft" | "editorial";

type Props = {
  title?: string | null;
  subtitle?: string | null;
  /** Eyebrow uppercase pequeno acima do título (variante editorial). */
  eyebrow?: string | null;
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
  eyebrow,
  back,
  trailing,
  center,
  variant = "gradient",
  className,
}: Props) {
  const tCommon = useTranslations("common.actions");
  const hasCenter = Boolean(center);
  const isGradient = variant === "gradient";
  const isSoft = variant === "soft";
  const isEditorial = variant === "editorial";
  const basePt = hasCenter ? 60 : isEditorial ? 60 : 52;
  const basePb = hasCenter ? 24 : isEditorial ? 28 : 22;

  // Text colors: branco no gradient (contraste alto), escuro nos demais.
  const textCls = isGradient ? "text-white" : "text-spark-ink";
  const subtitleCls = isGradient ? "text-white/75" : "text-spark-ink-50";
  const hitCls = cn(
    HIT_BASE,
    isGradient
      ? "text-white hover:bg-white/10"
      : "text-spark-ink hover:bg-spark-surface-sunken",
  );

  // Background por variant
  let bgClass = "bg-white shadow-[0_8px_24px_-16px_rgba(20,20,40,0.12)]"; // solid
  if (isGradient) {
    bgClass = "bg-brand-grad shadow-[0_12px_30px_-18px_oklch(0.55_0.24_340/0.55)]";
  } else if (isSoft) {
    bgClass = "shadow-[0_12px_30px_-18px_oklch(0.55_0.24_340/0.25)]";
  } else if (isEditorial) {
    // Editorial — branco limpo, sem curva forte. Border bottom hairline sutil.
    bgClass = "bg-spark-bg";
  }

  // Variante editorial usa layout vertical: linha pequena com back/trailing,
  // depois eyebrow + título fluido grande embaixo.
  if (isEditorial) {
    return (
      <div
        className={cn("relative px-4", bgClass, className)}
        style={{
          paddingTop: `calc(env(safe-area-inset-top) + 16px)`,
          paddingBottom: `28px`,
        }}
      >
        {/* Linha de controle: back + trailing */}
        <div className="flex items-center gap-1.5 h-10 -mx-2">
          {back ? (
            <Link
              href={back.href}
              aria-label={back.ariaLabel ?? tCommon("back")}
              className={cn(hitCls, back.label && "w-auto px-2.5 gap-1.5")}
            >
              <ArrowLeft size={22} strokeWidth={2.2} />
              {back.label && (
                <span className="text-[13px] font-semibold text-spark-ink-70">
                  {back.label}
                </span>
              )}
            </Link>
          ) : (
            <div className="w-2" />
          )}
          <div className="flex-1" />
          {trailing ?? <div className="w-2" />}
        </div>

        {/* Bloco editorial: eyebrow + título fluido */}
        <div className="mt-5">
          {eyebrow && (
            <div className="text-eyebrow text-spark-brand mb-2.5">{eyebrow}</div>
          )}
          {title && (
            <h1 className="text-fluid-headline font-extrabold text-spark-ink leading-[1.05]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-fluid-body text-spark-ink-50 leading-snug max-w-[520px]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative px-2 flex items-center gap-1.5 rounded-b-[28px]",
        bgClass,
        hasCenter && "min-h-[112px]",
        className,
      )}
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${basePt}px)`,
        paddingBottom: `${basePb}px`,
        ...(isSoft && {
          background:
            "linear-gradient(180deg, oklch(0.98 0.02 350) 0%, oklch(0.96 0.04 350) 100%)",
        }),
      }}
    >
      {/* Glow no gradient pra profundidade */}
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
      {/* Blobs decorativos rose no soft pra dar identidade sem ser plano */}
      {isSoft && (
        <>
          <div
            aria-hidden
            className="absolute -top-6 -left-8 w-32 h-32 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "oklch(0.65 0.20 350)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-10 -right-4 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "oklch(0.62 0.22 20)" }}
          />
        </>
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
