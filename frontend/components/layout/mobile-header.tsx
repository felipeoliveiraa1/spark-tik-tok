"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Header mobile unificado. Substitui os 3 padrões inline (pt-12/pt-14/etc)
 * que existiam espalhados pelas páginas. Sempre safe-top + altura consistente.
 *
 * Uso comum:
 *   <MobileHeader title="Produto" back={{ href: "/produtos" }} />
 *   <MobileHeader title="Início" trailing={<Avatar />} />
 *   <MobileHeader title={null} back={{ href: "/produtos", label: "Produtos" }} />
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
  // Quando passa `center` (ex: logo), usa layout com center absolute pra
  // garantir centralização verdadeira independente das larguras de back/trailing.
  const hasCenter = Boolean(center);
  return (
    <div
      className={cn(
        "pt-12 pb-2.5 px-2 safe-top flex items-center gap-1.5 relative",
        hasCenter && "pt-16 pb-4 min-h-[96px]",
        bordered && "border-b border-spark-hairline",
        className,
      )}
    >
      {back ? (
        <Link
          href={back.href}
          aria-label={back.ariaLabel ?? "Voltar"}
          className={cn(HIT_CLS, back.label && "w-auto px-2.5 gap-1.5")}
        >
          <ArrowLeft size={20} strokeWidth={1.7} />
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
          {/* Center absolute pra ficar perfeitamente centralizado independente
              do back/trailing terem larguras diferentes. */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="pointer-events-auto">{center}</div>
          </div>
          <div className="flex-1" />
        </>
      ) : (
        <div className="flex-1 min-w-0 px-1">
          {title && (
            <div className="text-[14px] font-bold text-spark-ink truncate">
              {title}
            </div>
          )}
          {subtitle && (
            <div className="text-[11px] text-spark-ink-50 font-mono truncate">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {trailing ?? <div className="w-2" />}
    </div>
  );
}
