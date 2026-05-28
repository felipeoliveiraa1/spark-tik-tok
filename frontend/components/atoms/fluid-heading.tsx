import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * FluidHeading — título com tipografia fluida (clamp) que cresce com o viewport.
 *
 * Variantes (escala definida em globals.css):
 *   - eyebrow:  11px fixo, uppercase, tracking-widest (label/categoria)
 *   - title:    20-28px (h3 de seção)
 *   - headline: 28-56px (h1/h2 de página)
 *   - display:  40-96px (hero sections)
 *   - hero:     48-144px (landing/wow moments)
 *
 * Por default usa Cabinet Grotesk (sans). Variante display+ alterna pra
 * Tanker via prop `tone="display"`.
 */

type Variant = "eyebrow" | "title" | "headline" | "display" | "hero";
type Tone = "default" | "display" | "brand";

const VARIANT_CLASSES: Record<Variant, string> = {
  eyebrow: "text-eyebrow text-spark-brand",
  title: "text-fluid-title font-extrabold",
  headline: "text-fluid-headline font-extrabold",
  display: "text-fluid-display font-extrabold",
  hero: "text-fluid-hero font-extrabold",
};

const TONE_CLASSES: Record<Tone, string> = {
  default: "text-spark-ink",
  display: "font-display lowercase tracking-tight",
  brand: "text-spark-brand-deep",
};

type Props = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  variant?: Variant;
  tone?: Tone;
  className?: string;
};

export function FluidHeading({
  children,
  as = "h2",
  variant = "headline",
  tone = "default",
  className,
}: Props) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={cn(
        VARIANT_CLASSES[variant],
        tone !== "default" ? TONE_CLASSES[tone] : TONE_CLASSES.default,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
