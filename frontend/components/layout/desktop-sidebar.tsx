import Link from "next/link";
import { Home, MessageCircle, Newspaper, Package, Flame, Pen, Plus, MoreHorizontal } from "lucide-react";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { AgentTile } from "@/components/atoms/agent-tile";
import { type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

export type SidebarActive = "home" | "chat" | "news" | "produtos" | "virais" | "scripts" | "conta";

const navItems: { id: SidebarActive; label: string; href: string; Icon: typeof Home; hasDot?: boolean }[] = [
  { id: "home", label: "Início", href: "/", Icon: Home },
  { id: "chat", label: "Conversas", href: "/chat", Icon: MessageCircle },
  { id: "news", label: "News", href: "/news", Icon: Newspaper, hasDot: true },
  { id: "produtos", label: "Produtos", href: "/produtos", Icon: Package },
  { id: "virais", label: "Virais", href: "/virais", Icon: Flame },
  { id: "scripts", label: "Scripts", href: "/scripts", Icon: Pen },
];

const todayConversations: { id: string; title: string; agent: AgentId; current?: boolean }[] = [
  { id: "c1", title: "NAC Always Fit · scripts", agent: "script", current: true },
  { id: "c2", title: "Massageador facial", agent: "info" },
  { id: "c3", title: "Virais beleza maio", agent: "viral" },
];

const yesterdayConversations = [
  "Esmalte gel UV",
  "Babyliss profissional",
  "Lash lifting kit",
  "Dúvida sobre frete",
];

type Props = {
  active?: SidebarActive;
};

export function DesktopSidebar({ active }: Props) {
  return (
    <aside className="w-[268px] shrink-0 border-r border-spark-hairline bg-spark-surface-elev flex flex-col h-full">
      <div className="px-[18px] pt-[18px] pb-3.5">
        <SparkWordmark size={20} />
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-white bg-brand-grad text-[13.5px] font-bold shadow-[0_6px_18px_-8px_oklch(0.5_0.22_305/0.5)]"
        >
          <Plus size={16} strokeWidth={1.7} />
          Nova conversa
          <div className="flex-1" />
          <span className="text-[10px] opacity-70 font-mono">⌘N</span>
        </Link>
      </div>

      <nav className="px-3 py-2 space-y-0.5">
        {navItems.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] transition-colors",
              active === it.id
                ? "bg-spark-surface-sunken text-spark-ink font-bold"
                : "text-spark-ink-70 font-medium hover:bg-spark-surface-sunken",
            )}
          >
            <it.Icon size={16} strokeWidth={active === it.id ? 2 : 1.7} />
            <span className="flex-1">{it.label}</span>
            {it.hasDot && active !== it.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-spark-brand" />
            )}
          </Link>
        ))}
      </nav>

      <div className="px-4 pt-3.5 pb-1.5 text-[10.5px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">
        Hoje
      </div>
      <div className="px-3 flex-1 overflow-auto flex flex-col gap-0.5">
        {todayConversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={cn(
              "px-2.5 py-2 rounded-lg text-[12.5px] flex items-center gap-2 transition-colors",
              c.current
                ? "bg-spark-surface-sunken text-spark-ink font-bold"
                : "text-spark-ink-70 font-medium hover:bg-spark-surface-sunken",
            )}
          >
            <AgentTile agent={c.agent} size={18} />
            <span className="truncate">{c.title}</span>
          </Link>
        ))}

        <div className="px-1 pt-3.5 pb-1.5 text-[10.5px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">
          Ontem
        </div>
        {yesterdayConversations.map((t) => (
          <Link
            key={t}
            href="#"
            className="px-2.5 py-2 rounded-lg text-[12.5px] text-spark-ink-70 font-medium flex items-center gap-2 hover:bg-spark-surface-sunken"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-spark-ink-20 shrink-0" />
            <span className="truncate">{t}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/conta"
        className="px-3.5 py-3 border-t border-spark-hairline flex items-center gap-2.5 hover:bg-spark-surface-sunken"
      >
        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-extrabold text-[13px] bg-brand-grad shrink-0">
          M
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold">Maria Silva</div>
          <div className="text-[10.5px] text-spark-ink-50 font-mono">Pro · 18/30 buscas</div>
        </div>
        <MoreHorizontal size={16} strokeWidth={1.7} className="text-spark-ink-50" />
      </Link>
    </aside>
  );
}
