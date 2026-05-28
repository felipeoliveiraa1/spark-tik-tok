"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * FloatingNav — pill horizontal flutuante glass morphism que aparece
 * no scroll. Funciona em mobile (centered bottom) e desktop (centered top).
 *
 * Comportamento:
 *   - Aparece após scrollar 200px
 *   - Esconde quando scrolla pra baixo > 80px (hide on scroll down)
 *   - Reaparece quando scrolla pra cima
 *   - Indica seção ativa via IntersectionObserver dos targets passados
 *
 * Cada item é um link com emoji + label compacto. Glass morphism
 * com backdrop-blur + borda sutil.
 */

export type NavItem = {
  href: string;
  label: string;
  emoji: string;
  /** ID do elemento alvo no DOM pra detectar seção ativa (opcional). */
  targetId?: string;
};

type Props = {
  items: NavItem[];
  /** Posição: bottom (mobile-friendly) ou top (desktop). Default "auto" responsivo. */
  position?: "bottom" | "top" | "auto";
  className?: string;
};

export function FloatingNav({ items, position = "auto", className }: Props) {
  const [visible, setVisible] = React.useState(false);
  const [activeHref, setActiveHref] = React.useState<string>(items[0]?.href ?? "");
  const lastScrollY = React.useRef(0);

  // Visibility on scroll
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const goingDown = y > lastScrollY.current;
      const delta = Math.abs(y - lastScrollY.current);

      if (y < 200) {
        setVisible(false);
      } else if (goingDown && delta > 8) {
        setVisible(false);
      } else if (!goingDown && delta > 4) {
        setVisible(true);
      }

      lastScrollY.current = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section via IntersectionObserver
  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const targets = items
      .filter((i) => i.targetId)
      .map((i) => ({ href: i.href, el: document.getElementById(i.targetId!) }))
      .filter((t): t is { href: string; el: HTMLElement } => t.el !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const t = targets.find((tt) => tt.el === visible.target);
          if (t) setActiveHref(t.href);
        }
      },
      { threshold: [0.3, 0.5, 0.7], rootMargin: "-20% 0px -40% 0px" },
    );

    targets.forEach((t) => observer.observe(t.el));
    return () => observer.disconnect();
  }, [items]);

  const positionClass =
    position === "top"
      ? "top-4 sm:top-6"
      : position === "bottom"
        ? "bottom-[calc(env(safe-area-inset-bottom)+16px)]"
        : // auto: bottom em mobile, top em desktop
          "bottom-[calc(env(safe-area-inset-bottom)+16px)] sm:bottom-auto sm:top-6";

  return (
    <nav
      aria-label="Navegação rápida"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-premium",
        positionClass,
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 pointer-events-none translate-y-3",
        className,
      )}
    >
      <div className="glass rounded-full shadow-lift px-1.5 py-1.5 flex items-center gap-0.5">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          const isInternal = item.href.startsWith("/") || item.href.startsWith("#");
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "text-[15px] leading-none transition-transform duration-300",
                  isActive ? "scale-110" : "opacity-80",
                )}
              >
                {item.emoji}
              </span>
              <span
                className={cn(
                  "hidden sm:inline text-[12px] font-extrabold tracking-tight whitespace-nowrap",
                  isActive ? "text-spark-ink" : "text-spark-ink-70",
                )}
              >
                {item.label}
              </span>
            </>
          );
          const classes = cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors duration-300",
            isActive
              ? "bg-brand-grad text-white"
              : "hover:bg-spark-surface-sunken/60",
          );

          if (isInternal) {
            return (
              <Link key={item.href} href={item.href} className={classes} aria-current={isActive ? "page" : undefined}>
                {content}
              </Link>
            );
          }
          return (
            <a key={item.href} href={item.href} className={classes}>
              {content}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
