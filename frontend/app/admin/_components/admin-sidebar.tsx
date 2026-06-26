"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Newspaper,
  GraduationCap,
  Radio,
  MessageSquareWarning,
  Sparkles,
  Gift,
  ShoppingBag,
  ArrowLeft,
  Menu,
  X,
  MessageCircle,
  Hourglass,
  Users,
  TrendingUp,
  UserX,
  Link2,
  Gamepad2,
} from "lucide-react";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { cn } from "@/lib/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  exact?: boolean;
};

type Section = {
  label: string;
  items: Item[];
};

const SECTIONS: Section[] = [
  {
    label: "Visão geral",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/financeiro", label: "Financeiro", icon: BarChart3 },
      { href: "/admin/trials", label: "Trials", icon: Hourglass },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/news", label: "News", icon: Newspaper },
      { href: "/admin/educacao", label: "Aulas", icon: GraduationCap },
      { href: "/admin/jornadas", label: "Jornadas", icon: Gamepad2 },
      { href: "/admin/ao-vivo", label: "Ao vivo", icon: Radio },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/admin/grupo", label: "Redirect /grupo", icon: Link2 },
      { href: "/admin/group-removals", label: "Saídas do grupo", icon: UserX },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquareWarning },
      { href: "/crm-metodotts", label: "CRM (leads)", icon: Sparkles },
      { href: "/admin/crm-stats", label: "CRM (métricas)", icon: TrendingUp },
    ],
  },
  {
    label: "Operações",
    items: [
      { href: "/admin/grant", label: "Liberar acesso", icon: Gift },
      { href: "/admin/processar-compra", label: "Processar compra", icon: ShoppingBag },
      { href: "/admin/team", label: "Time", icon: Users },
    ],
  },
];

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Fecha drawer ao trocar de rota
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ESC fecha drawer
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      {/* Botao hamburguer mobile — fixed top-left */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu admin"
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-full bg-spark-surface border border-spark-hairline shadow-rest flex items-center justify-center text-spark-ink hover:bg-spark-surface-sunken transition-colors"
      >
        <Menu size={18} strokeWidth={2.2} />
      </button>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-spark-ink/40 backdrop-blur-sm"
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-dvh lg:h-dvh w-[260px] shrink-0",
          "bg-spark-surface border-r border-spark-hairline flex flex-col",
          "transition-transform duration-300 ease-premium",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header sidebar */}
        <div className="px-5 py-5 border-b border-spark-hairline flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2.5">
            <SparkWordmark size={28} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-spark-brand-deep px-1.5 py-0.5 rounded bg-spark-brand-soft border border-spark-brand/15">
              admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="lg:hidden w-8 h-8 rounded-full hover:bg-spark-surface-sunken flex items-center justify-center text-spark-ink-70"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-spark-ink-35">
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, pathname, item.exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2.5 rounded-spark-lg text-[13.5px] font-extrabold tracking-tight transition-all duration-200 ease-premium",
                          active
                            ? "bg-brand-grad text-white shadow-lift-brand"
                            : "text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken",
                        )}
                      >
                        <Icon
                          size={16}
                          strokeWidth={active ? 2.5 : 2.1}
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            !active && "group-hover:scale-110 group-hover:text-spark-brand-deep",
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-spark-hairline">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-spark-lg text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken transition-all duration-200"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            Voltar para o app
          </Link>
        </div>
      </aside>
    </>
  );
}

export { SECTIONS as ADMIN_SECTIONS };
export type { Item as AdminNavItem };
