"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { cn } from "@/lib/cn";

export type SidebarActive =
  | "home"
  | "chat"
  | "produtos"
  | "virais"
  | "scripts"
  | "educacao"
  | "news"
  | "conta"
  | "admin";

type Item = { id: SidebarActive; label: string; href: string; emoji: string };

const items: Item[] = [
  { id: "home", label: "Início", href: "/", emoji: "🏠" },
  { id: "chat", label: "Chat", href: "/chat", emoji: "💬" },
  { id: "produtos", label: "Produtos", href: "/produtos", emoji: "📦" },
  { id: "virais", label: "Virais", href: "/virais", emoji: "🔥" },
  { id: "scripts", label: "Scripts", href: "/scripts", emoji: "✍️" },
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

export function DesktopSidebar({ active }: { active?: SidebarActive }) {
  const pathname = usePathname();
  const profile = useProfile();

  const computedActive = active ?? deriveActive(pathname);

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "Você";
  const initial = displayName.charAt(0).toUpperCase();
  const planLabel = profile?.plan_active ? "Plano ativo ✨" : "Plano inativo";

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 border-r border-spark-hairline bg-spark-surface-elev flex-col">
      <div className="px-4 pt-5 pb-2">
        <Link href="/" className="inline-flex">
          <SparkWordmark size={20} />
        </Link>
      </div>
      <nav className="flex-1 px-2 pt-3">
        {items.map((it) => {
          const isActive = computedActive === it.id;
          return (
            <Link
              key={it.id}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors",
                isActive
                  ? "bg-spark-brand-soft text-spark-brand-deep font-extrabold"
                  : "text-spark-ink-70 font-semibold hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "text-[16px] leading-none",
                  isActive ? "scale-110" : "opacity-75",
                )}
              >
                {it.emoji}
              </span>
              {it.label}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors border-t border-spark-hairline/60 pt-4",
              computedActive === "admin"
                ? "bg-spark-brand-soft text-spark-brand-deep font-extrabold"
                : "text-spark-ink-70 font-semibold hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
            )}
          >
            <span aria-hidden className="text-[16px] leading-none">
              🛠️
            </span>
            Admin
          </Link>
        )}
      </nav>

      <Link
        href="/conta"
        className="border-t border-spark-hairline px-3.5 py-3 flex items-center gap-2.5 hover:bg-spark-surface-sunken transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px]">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold truncate">{displayName}</div>
          <div className="text-[10.5px] text-spark-ink-50 font-mono truncate">{planLabel}</div>
        </div>
        <User size={14} strokeWidth={1.7} className="text-spark-ink-50" />
      </Link>
    </aside>
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
  if (pathname.startsWith("/educacao")) return "educacao";
  if (pathname.startsWith("/news")) return "news";
  if (pathname.startsWith("/conta")) return "conta";
  return undefined;
}
