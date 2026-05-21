"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { cn } from "@/lib/cn";

export type SidebarActive =
  | "home"
  | "chat"
  | "produtos"
  | "virais"
  | "scripts"
  | "ao-vivo"
  | "educacao"
  | "news"
  | "conta"
  | "admin";

type Item = { id: SidebarActive; label: string; href: string; emoji: string };

const items: Item[] = [
  { id: "home", label: "Início", href: "/", emoji: "🏠" },
  { id: "chat", label: "Chat", href: "/chat", emoji: "💬" },
  { id: "produtos", label: "Produtos", href: "/produtos", emoji: "📦" },
  { id: "scripts", label: "Scripts", href: "/scripts", emoji: "✍️" },
  { id: "ao-vivo", label: "Ao vivo", href: "/ao-vivo", emoji: "🔴" },
  { id: "educacao", label: "Educação", href: "/educacao", emoji: "🎓" },
  { id: "news", label: "News", href: "/news", emoji: "📰" },
];

type Profile = { name: string | null; email: string; plan_active: boolean; role?: string };

function useProfile() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: Profile | null } | null) => {
        if (!cancelled && data?.profile) setProfile(data.profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return profile;
}

/**
 * Sidebar com hover-expand:
 *   - Default: rail de 68px (só emoji)
 *   - Hover: expande pra 240px com labels
 *
 * Largura do <aside> externo permanece 68px (não empurra conteúdo).
 * Ao hover, expande absolutamente sobre o conteúdo com shadow pra
 * destacar — UX estilo Discord/Notion.
 */
const RAIL_WIDTH = 68;
const FULL_WIDTH = 240;

export function DesktopSidebar({ active }: { active?: SidebarActive }) {
  const pathname = usePathname();
  const profile = useProfile();
  const [expanded, setExpanded] = React.useState(false);

  const computedActive = active ?? deriveActive(pathname);

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "Você";
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = profile?.plan_active ? "Plano ativo ✨" : "Plano inativo";

  return (
    <>
      {/* Spacer: ocupa o rail no fluxo. Largura fixa, não muda no hover. */}
      <div
        aria-hidden
        className="hidden lg:block shrink-0"
        style={{ width: RAIL_WIDTH }}
      />

      {/* Sidebar real: absolute, expande sobre o conteúdo no hover */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          "hidden lg:flex fixed top-0 left-0 bottom-0 z-30 flex-col",
          "bg-spark-surface-elev border-r border-spark-hairline",
          "transition-[width] duration-200 ease-out overflow-hidden",
          expanded && "shadow-[8px_0_32px_-16px_rgba(20,20,40,0.18)]",
        )}
        style={{ width: expanded ? FULL_WIDTH : RAIL_WIDTH }}
      >
        <div className="px-4 pt-5 pb-2 h-[58px] flex items-center">
          <Link href="/" className="inline-flex items-center">
            {expanded ? <SparkWordmark size={20} /> : <SparkMark size={26} />}
          </Link>
        </div>

        <nav className="flex-1 px-2 pt-3 overflow-y-auto overflow-x-hidden">
          {items.map((it) => {
            const isActive = computedActive === it.id;
            return (
              <Link
                key={it.id}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors mb-0.5",
                  isActive
                    ? "bg-spark-brand-soft text-spark-brand-deep font-extrabold"
                    : "text-spark-ink-70 font-semibold hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
                )}
                title={!expanded ? it.label : undefined}
              >
                <span
                  aria-hidden
                  className={cn(
                    "text-[20px] leading-none w-6 flex items-center justify-center shrink-0",
                    isActive ? "scale-110" : "opacity-80",
                  )}
                >
                  {it.emoji}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-150",
                    expanded ? "opacity-100" : "opacity-0",
                  )}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}

          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors border-t border-spark-hairline/60 pt-4",
                computedActive === "admin"
                  ? "bg-spark-brand-soft text-spark-brand-deep font-extrabold"
                  : "text-spark-ink-70 font-semibold hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
              )}
              title={!expanded ? "Admin" : undefined}
            >
              <span
                aria-hidden
                className="text-[20px] leading-none w-6 flex items-center justify-center shrink-0"
              >
                🛠️
              </span>
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-150",
                  expanded ? "opacity-100" : "opacity-0",
                )}
              >
                Admin
              </span>
            </Link>
          )}
        </nav>

        <Link
          href="/conta"
          className="border-t border-spark-hairline px-3.5 py-3 flex items-center gap-2.5 hover:bg-spark-surface-sunken transition-colors"
          title={!expanded ? displayName : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px] shrink-0">
            {initial}
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-opacity duration-150",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="text-[12.5px] font-bold truncate">{displayName}</div>
            <div className="text-[10.5px] text-spark-ink-50 font-mono truncate">{planLabel}</div>
          </div>
          <User
            size={14}
            strokeWidth={1.7}
            className={cn(
              "text-spark-ink-50 transition-opacity duration-150",
              expanded ? "opacity-100" : "opacity-0",
            )}
          />
        </Link>
      </aside>
    </>
  );
}

function deriveActive(pathname: string | null): SidebarActive | undefined {
  if (!pathname) return undefined;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/produtos")) return "produtos";
  if (pathname.startsWith("/virais")) return "virais";
  if (pathname.startsWith("/scripts")) return "scripts";
  if (pathname.startsWith("/ao-vivo")) return "ao-vivo";
  if (pathname.startsWith("/educacao")) return "educacao";
  if (pathname.startsWith("/news")) return "news";
  if (pathname.startsWith("/conta")) return "conta";
  return undefined;
}
