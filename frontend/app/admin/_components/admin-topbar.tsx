"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ADMIN_SECTIONS } from "./admin-sidebar";

/**
 * Top bar do admin: mostra breadcrumb + titulo da pagina atual baseado
 * no pathname. Atualiza em tempo real ao trocar de rota (sem refresh).
 */

function resolveCurrent(pathname: string): {
  section: string | null;
  title: string;
} {
  // Caso especial: /admin (dashboard)
  if (pathname === "/admin") {
    return { section: null, title: "Dashboard" };
  }

  // Procura nos items conhecidos
  for (const section of ADMIN_SECTIONS) {
    for (const item of section.items) {
      if (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { section: section.label, title: item.label };
      }
    }
  }

  // Fallback: usa segmento da URL
  const last = pathname.split("/").filter(Boolean).pop() ?? "Admin";
  return { section: null, title: last.charAt(0).toUpperCase() + last.slice(1) };
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { section, title } = resolveCurrent(pathname);

  return (
    <header className="sticky top-0 z-30 bg-spark-bg/85 backdrop-blur-md border-b border-spark-hairline">
      <div className="px-4 lg:px-10 h-[64px] flex items-center justify-between">
        {/* Espaco pro botao hamburguer no mobile */}
        <div className="flex items-center gap-2 min-w-0 pl-12 lg:pl-0">
          <Link
            href="/admin"
            className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-spark-ink-50 hover:text-spark-brand-deep transition-colors"
          >
            Admin
          </Link>
          {section && (
            <>
              <ChevronRight size={12} strokeWidth={2.4} className="text-spark-ink-35" />
              <span className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-spark-ink-50 truncate">
                {section}
              </span>
            </>
          )}
          <ChevronRight size={12} strokeWidth={2.4} className="text-spark-ink-35 shrink-0" />
          <span className="text-[13.5px] font-extrabold tracking-tight text-spark-ink truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface border border-spark-hairline text-[11.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken transition-all"
          >
            Ver app →
          </Link>
        </div>
      </div>
    </header>
  );
}
