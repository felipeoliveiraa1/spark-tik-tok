"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * CharacterReveal — texto que aparece letra-por-letra com stagger quando
 * entra no viewport. Inspirado no padrão character-by-character do
 * TastyBasics.
 *
 * Usar pra hero copy curto e impactante (até ~80 chars). Acima disso fica
 * lento e cansa.
 *
 * Acessibilidade:
 *   - Mantém o texto íntegro como aria-label
 *   - Spans individuais são aria-hidden
 *   - Respeita prefers-reduced-motion (mostra direto)
 *
 * Exemplo:
 *   <CharacterReveal as="h1" className="text-fluid-hero font-extrabold">
 *     Pronta pra criar algo lindo hoje?
 *   </CharacterReveal>
 */

type Props = {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Stagger entre letras em ms. Default 25ms (rápido pra não cansar). */
  staggerMs?: number;
  /** Atraso inicial antes da primeira letra. Default 0. */
  delayMs?: number;
  /** Se true, anima ao montar. Default false (usa IntersectionObserver). */
  immediate?: boolean;
  className?: string;
};

export function CharacterReveal({
  children,
  as = "span",
  staggerMs = 25,
  delayMs = 0,
  immediate = false,
  className,
}: Props) {
  const Tag = as as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(immediate);

  React.useEffect(() => {
    if (immediate || visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, visible]);

  // Quebra em "palavras" pra evitar quebrar palavra no meio (CSS word-wrap),
  // e cada palavra em chars individuais animados.
  const words = React.useMemo(() => children.split(/(\s+)/), [children]);

  let charIdx = 0;
  return (
    <Tag ref={ref} aria-label={children} className={cn(className)}>
      {words.map((word, wi) => {
        if (/^\s+$/.test(word)) {
          return (
            <span key={`s-${wi}`} aria-hidden>
              {word}
            </span>
          );
        }
        return (
          <span key={`w-${wi}`} className="inline-block whitespace-nowrap">
            {Array.from(word).map((char) => {
              const i = charIdx++;
              return (
                <span
                  key={`c-${i}`}
                  aria-hidden
                  className={cn(
                    "inline-block",
                    visible ? "animate-character" : "opacity-0",
                  )}
                  style={
                    visible
                      ? { animationDelay: `${delayMs + i * staggerMs}ms` }
                      : undefined
                  }
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
