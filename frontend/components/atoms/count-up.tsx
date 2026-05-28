"use client";

import * as React from "react";

/**
 * CountUp — número anima de 0 (ou `from`) até `value` quando entra no
 * viewport. Usa rAF + easeOutQuart pra transição suave.
 *
 * Suporta:
 *   - prefixo (ex: "R$ ")
 *   - sufixo (ex: "%")
 *   - format pt-BR (Intl.NumberFormat com 0-2 casas)
 *   - delay inicial
 *
 * Respeita prefers-reduced-motion (mostra final direto).
 */

type Props = {
  value: number;
  /** Valor inicial. Default 0. */
  from?: number;
  /** Duração da animação em ms. Default 1200. */
  durationMs?: number;
  /** Delay antes de começar. Default 0. */
  delayMs?: number;
  /** Casas decimais. Default 0. */
  decimals?: number;
  /** Sufixo (ex: "%", "K"). */
  suffix?: string;
  /** Prefixo (ex: "R$ "). */
  prefix?: string;
  /** Formatter custom — sobrescreve o default Intl. */
  formatter?: (n: number) => string;
  className?: string;
};

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function CountUp({
  value,
  from = 0,
  durationMs = 1200,
  delayMs = 0,
  decimals = 0,
  suffix = "",
  prefix = "",
  formatter,
  className,
}: Props) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState<number>(from);
  const [started, setStarted] = React.useState(false);
  const rafRef = React.useRef<number | undefined>(undefined);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fmt = React.useCallback(
    (n: number): string => {
      if (formatter) return formatter(n);
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(n);
    },
    [formatter, decimals],
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setDisplay(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, started]);

  React.useEffect(() => {
    if (!started) return;

    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      const range = value - from;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutQuart(progress);
        const current = from + range * eased;
        setDisplay(current);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [started, value, from, durationMs, delayMs]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${fmt(value)}${suffix}`}>
      {prefix}
      {fmt(display)}
      {suffix}
    </span>
  );
}
