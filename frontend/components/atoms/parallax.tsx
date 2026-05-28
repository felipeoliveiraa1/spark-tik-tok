"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Parallax — wrapper que aplica leve translação vertical baseado no
 * scroll do viewport. Inspirado no padrão data-speed do TastyBasics.
 *
 * Usar em imagens hero, blobs decorativos, badges flutuantes. NÃO usar
 * em conteúdo crítico (acessibilidade + leitura sofrem).
 *
 * Performance: usa rAF + transform (GPU), nunca recalcula layout.
 * Respeita prefers-reduced-motion (vira no-op).
 *
 * Exemplo:
 *   <Parallax speed={-0.15} className="block w-full">
 *     <img src="/hero.png" alt="" />
 *   </Parallax>
 */

type Props = {
  children: React.ReactNode;
  /** Velocidade do parallax. Negativo move pra cima quando scrolla pra
   *  baixo (acompanha mais devagar). Range típico: -0.3 a 0.3. */
  speed?: number;
  /** Atributo opcional pra elemento renderizado. */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
};

export function Parallax({
  children,
  speed = -0.15,
  as = "div",
  className,
}: Props) {
  const Tag = as as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Centro do elemento relativo ao centro do viewport.
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      // Translação proporcional. Suavidade vem do speed pequeno (-0.15).
      const translateY = centerOffset * speed;
      el.style.transform = `translate3d(0, ${translateY}px, 0)`;
      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (el) el.style.transform = "";
    };
  }, [enabled, speed]);

  return (
    <Tag ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </Tag>
  );
}
