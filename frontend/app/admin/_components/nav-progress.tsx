"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Barra fina de progresso no topo do admin enquanto a rota muda.
 * Como o App Router do Next.js ja faz navegacao client-side (SPA), o
 * "refresh" e instantaneo — mas em paginas com server fetch demorado
 * o usuario fica sem feedback visual. Essa barra sobe rapido ate 90%
 * quando o pathname muda e completa quando o novo conteudo renderiza.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setVisible(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(45), 80);
    const t2 = setTimeout(() => setProgress(75), 200);
    const t3 = setTimeout(() => setProgress(92), 420);
    const finish = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220);
    }, 620);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(finish);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 240ms ease" }}
    >
      <div
        className="h-full bg-brand-grad shadow-[0_0_12px_rgba(236,72,153,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
