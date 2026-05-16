import Link from "next/link";
import { cn } from "@/lib/cn";

export type NavId = "home" | "chat" | "produtos" | "virais" | "conta";

type Item = {
  id: NavId;
  label: string;
  href: string;
  emoji: string;
};

const items: Item[] = [
  { id: "home", label: "Início", href: "/", emoji: "🏠" },
  { id: "chat", label: "Chat", href: "/chat", emoji: "💬" },
  { id: "produtos", label: "Produtos", href: "/produtos", emoji: "📦" },
  { id: "virais", label: "Virais", href: "/virais", emoji: "🔥" },
  { id: "conta", label: "Conta", href: "/conta", emoji: "👤" },
];

type Props = {
  active?: NavId;
  className?: string;
};

export function BottomNav({ active = "home", className }: Props) {
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
              "relative flex flex-col items-center gap-[3px] px-3 py-1.5 transition-all",
              isActive ? "text-spark-ink" : "text-spark-ink-50",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "text-[22px] leading-none transition-transform",
                isActive ? "scale-110" : "opacity-70",
              )}
              style={{ filter: isActive ? "none" : "saturate(0.85)" }}
            >
              {it.emoji}
            </span>
            <span
              className={cn(
                "text-[10.5px] tracking-tight",
                isActive ? "font-extrabold" : "font-semibold",
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
