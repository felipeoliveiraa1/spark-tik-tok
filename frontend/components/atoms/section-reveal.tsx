"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * SectionReveal — wrapper que faz fade-in + slide-up quando entra no
 * viewport. Suporta delay e direção. One-way (uma vez visto, fica).
 *
 * Use pra cada bloco de uma página magazine pra criar ritmo cinemático.
 *
 * Exemplo:
 *   <SectionReveal>
 *     <h2>Seção</h2>
 *     <p>Conteúdo</p>
 *   </SectionReveal>
 *
 *   <SectionReveal delay={150} direction="left">
 *     <Card />
 *   </SectionReveal>
 */

type Direction = "up" | "down" | "left" | "right" | "scale" | "none";

type Props = {
  children: React.ReactNode;
  /** Delay em ms antes da animação iniciar. Default 0. */
  delay?: number;
  /** Direção da entrada. Default "up". */
  direction?: Direction;
  /** Duração da transição em ms. Default 800. */
  durationMs?: number;
  /** Tag HTML. Default "div". */
  as?: keyof React.JSX.IntrinsicElements;
  /** Distância da translação. Default 28px. */
  distance?: number;
  className?: string;
};

function getInitialTransform(direction: Direction, distance: number): string {
  switch (direction) {
    case "up": return `translateY(${distance}px)`;
    case "down": return `translateY(-${distance}px)`;
    case "left": return `translateX(${distance}px)`;
    case "right": return `translateX(-${distance}px)`;
    case "scale": return `scale(0.94)`;
    case "none": return "none";
  }
}

export function SectionReveal({
  children,
  delay = 0,
  direction = "up",
  durationMs = 800,
  as = "div",
  distance = 28,
  className,
}: Props) {
  const Tag = as as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : getInitialTransform(direction, distance),
        transition: `opacity ${durationMs}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms, transform ${durationMs}ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms`,
        willChange: visible ? "auto" : "transform, opacity",
      }}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
