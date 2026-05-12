import Link from "next/link";
import { Home, MessageCircle, Newspaper, Package, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavId = "home" | "chat" | "news" | "produtos" | "conta";

type Item = {
  id: NavId;
  label: string;
  href: string;
  Icon: LucideIcon;
  hasDot?: boolean;
};

const items: Item[] = [
  { id: "home", label: "Home", href: "/", Icon: Home },
  { id: "chat", label: "Chat", href: "/chat", Icon: MessageCircle },
  { id: "news", label: "News", href: "/news", Icon: Newspaper, hasDot: true },
  { id: "produtos", label: "Produtos", href: "/produtos", Icon: Package },
  { id: "conta", label: "Conta", href: "/conta", Icon: User },
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
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          className={cn(
            "relative flex flex-col items-center gap-[3px] px-3 py-1.5 transition-colors",
            active === it.id ? "text-spark-ink" : "text-spark-ink-35",
          )}
        >
          <div className="relative">
            <it.Icon size={22} strokeWidth={active === it.id ? 2 : 1.7} />
            {it.hasDot && active !== it.id && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-spark-brand ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10.5px] font-semibold tracking-tight">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
