"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Package,
  PenLine,
  Activity,
  GraduationCap,
  Newspaper,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavId } from "./bottom-nav";

type IconComp = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

/**
 * FloatingMainNav — navegação principal premium, glass morphism.
 *
 * Responsiva por viewport:
 *   - Mobile (< lg):  pill HORIZONTAL flutuante, centered no bottom,
 *                     safe-area aware. Substitui o BottomNav antigo.
 *   - Desktop (>= lg): pill VERTICAL flutuante, fixa na esquerda
 *                      centered vertical. Substitui a DesktopSidebar
 *                      antiga. Expande no hover mostrando labels ao
 *                      lado dos ícones.
 *
 * Visual:
 *   - Glass morphism (backdrop-blur 16px + saturate 180%)
 *   - rounded-full
 *   - shadow-lift premium
 *   - Item ativo: pill gradient brand
 *   - Item inativo: hover bg sutil
 *   - Transition ease-premium em tudo
 */

type Item = {
  id: NavId;
  label: string;
  href: string;
  Icon: IconComp;
};

const ITEMS: Item[] = [
  { id: "home", label: "Início", href: "/", Icon: Home },
  { id: "chat", label: "Agentes", href: "/agentes", Icon: Sparkles },
  { id: "produtos", label: "Produtos", href: "/produtos", Icon: Package },
  { id: "scripts", label: "Scripts", href: "/scripts", Icon: PenLine },
  { id: "rotina", label: "Rotina", href: "/rotina/hoje", Icon: Activity },
  { id: "educacao", label: "Educação", href: "/educacao", Icon: GraduationCap },
  { id: "news", label: "News", href: "/news", Icon: Newspaper },
  { id: "conta", label: "Conta", href: "/conta", Icon: User },
];

function deriveActive(pathname: string | null): NavId | undefined {
  if (!pathname) return undefined;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/agentes") || pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/produtos")) return "produtos";
  if (pathname.startsWith("/scripts")) return "scripts";
  if (pathname.startsWith("/rotina")) return "rotina";
  // /ao-vivo agora vive sob o guarda-chuva "Educação" no menu
  if (pathname.startsWith("/educacao") || pathname.startsWith("/ao-vivo")) return "educacao";
  if (pathname.startsWith("/news")) return "news";
  if (pathname.startsWith("/conta")) return "conta";
  return undefined;
}

type Props = {
  /** Override do estado ativo. Se omitido, deriva do pathname. */
  active?: NavId;
};

export function FloatingMainNav({ active }: Props) {
  const pathname = usePathname();
  const derived = active ?? deriveActive(pathname);
  return (
    <>
      <DesktopFloatingNav active={derived} />
      <MobileFloatingNav active={derived} />
    </>
  );
}

// =================================================================
// DESKTOP — vertical pill lateral esquerda
// =================================================================

function DesktopFloatingNav({ active }: { active?: NavId }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Navegação principal"
      className={cn(
        "hidden lg:flex fixed left-5 z-40",
        "flex-col gap-1 p-2.5 rounded-spark-3xl glass shadow-lift",
        "transition-[transform] duration-500 ease-premium",
      )}
      style={{
        // Centralização vertical robusta: top 50% + translate -50%.
        // Definido só via inline pra evitar conflito com Tailwind classes.
        top: "50%",
        transform: hovered
          ? "translate(2px, -50%)"
          : "translate(0, -50%)",
      }}
    >
      {ITEMS.map((it) => {
        const isActive = active === it.id;
        return (
          <Link
            key={it.id}
            href={it.href}
            aria-label={it.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 h-12 rounded-full transition-all duration-300 ease-premium overflow-hidden",
              isActive
                ? "bg-brand-grad text-white shadow-lift-brand"
                : "text-spark-ink-70 hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
            )}
            style={{
              width: hovered ? 168 : 48,
              paddingLeft: 14,
              paddingRight: hovered ? 18 : 14,
            }}
          >
            <it.Icon
              size={20}
              strokeWidth={isActive ? 2.4 : 2.1}
              className={cn(
                "shrink-0 transition-transform duration-300",
                isActive ? "scale-110" : "group-hover:scale-110",
              )}
            />
            <span
              className={cn(
                "text-[13px] font-extrabold tracking-tight whitespace-nowrap transition-opacity duration-300",
                hovered ? "opacity-100" : "opacity-0",
              )}
            >
              {it.label}
            </span>

            {/* Indicador ativo: dot no canto direito quando colapsado */}
            {isActive && !hovered && (
              <span
                aria-hidden
                className="absolute right-2.5 w-1 h-1 rounded-full bg-white"
              />
            )}
          </Link>
        );
      })}
    </aside>
  );
}

// =================================================================
// MOBILE — pill horizontal centered bottom
// =================================================================

function MobileFloatingNav({ active }: { active?: NavId }) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "lg:hidden fixed left-1/2 -translate-x-1/2 z-40",
        "px-1.5 py-1.5 rounded-full glass shadow-lift",
        "flex items-center gap-0.5 overflow-x-auto no-scrollbar",
      )}
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 12px)",
        maxWidth: "calc(100vw - 16px)",
      }}
    >
      {ITEMS.map((it) => {
        const isActive = active === it.id;
        return (
          <Link
            key={it.id}
            href={it.href}
            aria-label={it.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ease-premium shrink-0",
              "min-w-[42px] h-12 px-1.5",
              isActive
                ? "bg-brand-grad text-white shadow-lift-brand"
                : "text-spark-ink-70 hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
            )}
          >
            <it.Icon
              size={17}
              strokeWidth={isActive ? 2.4 : 2.1}
              className={cn(
                "transition-transform duration-300",
                isActive ? "scale-110" : "opacity-85",
              )}
            />
            <span
              className={cn(
                "text-[8.5px] leading-none tracking-tight",
                isActive ? "font-extrabold" : "font-semibold opacity-90",
              )}
            >
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
