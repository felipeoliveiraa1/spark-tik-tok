"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type NavId =
  | "home"
  | "chat"
  | "produtos"
  | "scripts"
  | "rotina"
  | "ao-vivo"
  | "educacao"
  | "news"
  | "ranking"
  | "conta";

type Item = {
  id: NavId;
  labelKey: "home" | "agents" | "products" | "scripts" | "routine" | "lessons" | "account";
  href: string;
  emoji: string;
};

const items: Item[] = [
  { id: "home", labelKey: "home", href: "/", emoji: "🏠" },
  { id: "chat", labelKey: "agents", href: "/agentes", emoji: "✨" },
  { id: "produtos", labelKey: "products", href: "/produtos", emoji: "📦" },
  { id: "scripts", labelKey: "scripts", href: "/scripts", emoji: "✍️" },
  { id: "rotina", labelKey: "routine", href: "/rotina/hoje", emoji: "📊" },
  { id: "educacao", labelKey: "lessons", href: "/educacao", emoji: "🎓" },
  { id: "conta", labelKey: "account", href: "/conta", emoji: "👤" },
];

type Props = {
  active?: NavId;
  className?: string;
};

export function BottomNav({ active = "home", className }: Props) {
  const t = useTranslations("nav.bottomBar");
  return (
    <nav
      className={cn(
        "border-t border-spark-hairline pt-2 pb-[22px] safe-bottom flex justify-around",
        "bg-white/95 backdrop-blur-xl backdrop-saturate-150",
        className,
      )}
    >
      {items.map((it) => {
        const isActive = active === it.id;
        return (
          <Link
            key={it.id}
            href={it.href}
            className={cn(
              "relative flex flex-col items-center gap-[3px] px-1 py-1.5 min-w-[40px]",
              "transition-all duration-300 ease-premium",
              isActive ? "text-spark-ink" : "text-spark-ink-50",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "text-[20px] leading-none transition-transform",
                isActive ? "scale-110" : "opacity-70",
              )}
              style={{ filter: isActive ? "none" : "saturate(0.85)" }}
            >
              {it.emoji}
            </span>
            <span
              className={cn(
                "text-[9.5px] tracking-tight leading-none",
                isActive ? "font-extrabold" : "font-semibold",
              )}
            >
              {t(it.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
