"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Package,
  Flame,
  Pen,
  Newspaper,
  User,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { cn } from "@/lib/cn";

export type SidebarActive = "home" | "chat" | "produtos" | "virais" | "scripts" | "news" | "conta";

type Item = { id: SidebarActive; label: string; href: string; Icon: LucideIcon };

const items: Item[] = [
  { id: "home", label: "Início", href: "/", Icon: Home },
  { id: "chat", label: "Chat", href: "/chat", Icon: MessageCircle },
  { id: "produtos", label: "Produtos", href: "/produtos", Icon: Package },
  { id: "virais", label: "Virais", href: "/virais", Icon: Flame },
  { id: "scripts", label: "Scripts", href: "/scripts", Icon: Pen },
  { id: "news", label: "News", href: "/news", Icon: Newspaper },
];

type Profile = { name: string | null; email: string; plan_active: boolean };

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
  const planLabel = profile?.plan_active ? "Plano ativo" : "Plano inativo";

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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors",
                isActive
                  ? "bg-spark-surface-sunken text-spark-ink"
                  : "text-spark-ink-70 hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
              )}
            >
              <it.Icon size={16} strokeWidth={isActive ? 2 : 1.7} />
              {it.label}
            </Link>
          );
        })}
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
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/produtos")) return "produtos";
  if (pathname.startsWith("/virais")) return "virais";
  if (pathname.startsWith("/scripts")) return "scripts";
  if (pathname.startsWith("/news")) return "news";
  if (pathname.startsWith("/conta")) return "conta";
  return undefined;
}
