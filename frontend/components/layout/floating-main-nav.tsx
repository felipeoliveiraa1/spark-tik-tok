"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  Sparkles,
  Package,
  PenLine,
  Activity,
  GraduationCap,
  Gamepad2,
  Newspaper,
  Trophy,
  User,
  X,
  Check,
  LayoutGrid,
} from "lucide-react";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { cn } from "@/lib/cn";
import type { NavId } from "./bottom-nav";

type IconComp = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

type LabelKey =
  | "home"
  | "chat"
  | "products"
  | "scripts"
  | "routine"
  | "education"
  | "jornadas"
  | "ranking"
  | "news"
  | "account";

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
  labelKey: LabelKey;
  href: string;
  Icon: IconComp;
  /** Se true, so admin ve no menu. Filtrado client-side apos fetch /api/me. */
  adminOnly?: boolean;
};

const ITEMS: Item[] = [
  { id: "home", labelKey: "home", href: "/", Icon: Home },
  { id: "jornadas", labelKey: "jornadas", href: "/jornadas", Icon: Gamepad2 },
  { id: "chat", labelKey: "chat", href: "/agentes", Icon: Sparkles },
  { id: "produtos", labelKey: "products", href: "/produtos", Icon: Package },
  { id: "scripts", labelKey: "scripts", href: "/scripts", Icon: PenLine },
  { id: "rotina", labelKey: "routine", href: "/rotina/hoje", Icon: Activity },
  { id: "educacao", labelKey: "education", href: "/educacao", Icon: GraduationCap, adminOnly: true },
  { id: "ranking", labelKey: "ranking", href: "/ranking", Icon: Trophy },
  { id: "news", labelKey: "news", href: "/news", Icon: Newspaper, adminOnly: true },
  { id: "conta", labelKey: "account", href: "/conta", Icon: User },
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
  if (pathname.startsWith("/jornadas")) return "jornadas";
  if (pathname.startsWith("/ranking")) return "ranking";
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
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Fetch role uma vez pra filtrar entradas adminOnly (ex: Jornadas em beta).
  // /api/me retorna { profile: { ..., role } } — role vem aninhada em profile.
  // Falha silenciosa = user default nao-admin.
  React.useEffect(() => {
    void fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.profile?.role === "admin") setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const items = React.useMemo(
    () => ITEMS.filter((it) => !it.adminOnly || isAdmin),
    [isAdmin],
  );

  return (
    <>
      <DesktopFloatingNav active={derived} items={items} />
      <MobileFloatingNav active={derived} items={items} />
    </>
  );
}

// =================================================================
// DESKTOP — vertical pill lateral esquerda
// =================================================================

function DesktopFloatingNav({ active, items }: { active?: NavId; items: Item[] }) {
  const [hovered, setHovered] = React.useState(false);
  const t = useTranslations("nav");
  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={t("menu.mainNav")}
      data-tutorial-id="desktop-nav"
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
      {items.map((it) => {
        const isActive = active === it.id;
        const label = t(`labels.${it.labelKey}`);
        return (
          <Link
            key={it.id}
            href={it.href}
            aria-label={label}
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
              {label}
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
// MOBILE — bottom bar com 4 atalhos rápidos + botão "Mais" → overlay grid 3x3
// =================================================================

// Os 4 que a aluna usa todo dia. Restantes ficam no overlay.
const QUICK_IDS: NavId[] = ["home", "chat", "scripts", "rotina"];

function MobileFloatingNav({ active, items }: { active?: NavId; items: Item[] }) {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("nav");

  // Fecha em ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Trava scroll do body quando overlay aberto
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const quickItems = QUICK_IDS.map((id) => items.find((it) => it.id === id)!).filter(
    Boolean,
  );

  return (
    <>
      {/* Bottom bar fixa: 4 atalhos + botão "Mais" */}
      <nav
        aria-label={t("menu.mainNav")}
        data-tutorial-id="mobile-nav"
        className={cn(
          "lg:hidden fixed left-1/2 -translate-x-1/2 z-40",
          "px-2 py-2 rounded-full glass shadow-lift",
          "flex items-center gap-1",
        )}
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 12px)",
        }}
      >
        {quickItems.map((it) => {
          const isActive = active === it.id;
          const label = t(`labels.${it.labelKey}`);
          return (
            <Link
              key={it.id}
              href={it.href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ease-premium",
                "min-w-[52px] h-12 px-2",
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
                  isActive ? "scale-110" : "opacity-90",
                )}
              />
              <span
                className={cn(
                  "text-[9px] leading-none tracking-tight",
                  isActive ? "font-extrabold" : "font-extrabold opacity-90",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Separador sutil */}
        <span aria-hidden className="w-px h-7 bg-spark-hairline mx-0.5" />

        {/* Botão "Mais" — abre overlay com todos */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("menu.moreOptions")}
          aria-expanded={open}
          aria-controls="mobile-nav-overlay"
          className={cn(
            "relative inline-flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ease-premium",
            "min-w-[52px] h-12 px-2",
            "bg-brand-grad-soft text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5",
            // Destaca se a rota atual NÃO está nos atalhos
            active && !QUICK_IDS.includes(active)
              ? "ring-2 ring-spark-brand shadow-lift-brand"
              : "",
          )}
        >
          <LayoutGrid size={17} strokeWidth={2.4} />
          <span className="text-[9px] leading-none tracking-tight font-extrabold">
            {t("bottomBar.more")}
          </span>
        </button>
      </nav>

      {/* Overlay com grid 3x3 */}
      {open && (
        <div
          id="mobile-nav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu.navMenu")}
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          style={{ animation: "nav-fade-in 240ms ease-premium both" }}
        >
          {/* Backdrop tap-to-close */}
          <button
            type="button"
            aria-label={t("menu.closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-spark-ink/30 backdrop-blur-md"
          />

          {/* Conteúdo (clique aqui NÃO fecha) */}
          <div
            className="relative flex-1 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkles textura */}
            <SparkleField
              count={14}
              seed={2026}
              color="rgba(255,255,255,0.55)"
              className="opacity-60"
            />

            {/* Painel principal sliding from bottom */}
            <div
              className="relative mt-auto bg-spark-surface rounded-t-spark-3xl shadow-hero p-5 lg:p-7"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
                animation: "nav-slide-up 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="text-eyebrow text-spark-brand">
                  ✦ {t("menu.whereTo")}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("menu.closeMenu")}
                  className="w-9 h-9 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-ink hover:bg-spark-brand-soft flex items-center justify-center transition-all duration-300 ease-premium active:scale-95"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Grid 3x3 (9 itens) */}
              <div className="grid grid-cols-3 gap-3">
                {items.map((it, i) => {
                  const isActive = active === it.id;
                  const label = t(`labels.${it.labelKey}`);
                  return (
                    <Link
                      key={it.id}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-spark-2xl transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95",
                        isActive
                          ? "bg-brand-grad text-white shadow-lift-brand scale-105"
                          : "bg-spark-surface-sunken text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep shadow-rest hover:shadow-lift",
                      )}
                      style={{
                        animation: `nav-card-in 420ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 35}ms both`,
                      }}
                    >
                      {/* Badge "aqui" no item ativo */}
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-spark-brand-deep shadow-sm"
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}

                      <it.Icon
                        size={24}
                        strokeWidth={isActive ? 2.4 : 2.1}
                        className={cn(
                          "transition-transform duration-300",
                          isActive ? "scale-110" : "group-hover:scale-110",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[11px] leading-tight tracking-tight text-center",
                          isActive ? "font-extrabold" : "font-extrabold",
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Keyframes inline pra animações */}
          <style jsx>{`
            @keyframes nav-fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes nav-slide-up {
              from {
                transform: translateY(40px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes nav-card-in {
              from {
                opacity: 0;
                transform: translateY(12px) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
