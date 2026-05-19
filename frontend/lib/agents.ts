import { Search, Flame, Pen, MessageCircle, type LucideIcon } from "lucide-react";

export type AgentId = "info" | "viral" | "script" | "help";

export type AgentMeta = {
  id: AgentId;
  label: string;
  short: string;
  description: string;
  Icon: LucideIcon;
  /** Foto do agente (asset em /public). Usada no AgentTile/Character/Badge. */
  image: string;
  fg: string; // hex/oklch color (text/border)
  bg: string; // hex/oklch color (background)
  tailwindFg: string; // tailwind class for fg
  tailwindBg: string; // tailwind class for bg
  /**
   * Quando true, agente é escondido da galeria e nav, e bloqueamos a criação
   * de novas conversas. Conversas antigas continuam acessíveis.
   * Útil pra parar uma feature em prod sem deletar código.
   */
  hidden?: boolean;
};

export const AGENTS: Record<AgentId, AgentMeta> = {
  info: {
    id: "info",
    label: "Informação",
    short: "Info",
    description: "Análise de produto · foto, ficha, mercado.",
    Icon: Search,
    image: "/analista.png",
    fg: "oklch(0.55 0.18 300)",
    bg: "oklch(0.96 0.04 300)",
    tailwindFg: "text-agent-info-fg",
    tailwindBg: "bg-agent-info-bg",
  },
  viral: {
    id: "viral",
    label: "Virais",
    short: "Virais",
    description: "Descobre o que tá bombando no TikTok Shop.",
    Icon: Flame,
    image: "/viral.png",
    fg: "oklch(0.62 0.22 20)",
    bg: "oklch(0.96 0.05 25)",
    tailwindFg: "text-agent-viral-fg",
    tailwindBg: "bg-agent-viral-bg",
    // Temporariamente ocultado — feature de scraping do Vyral pausada
    // até decidirmos nova fonte de dados (Apify ou similar).
    hidden: true,
  },
  script: {
    id: "script",
    label: "Scripts",
    short: "Scripts",
    description: "Hooks com neurociência e humor brasileiro.",
    Icon: Pen,
    image: "/script.png",
    fg: "oklch(0.60 0.22 350)",
    bg: "oklch(0.96 0.04 350)",
    tailwindFg: "text-agent-script-fg",
    tailwindBg: "bg-agent-script-bg",
  },
  help: {
    id: "help",
    label: "Tira-dúvidas",
    short: "Dúvidas",
    description: "Suporte sobre TikTok Shop, políticas e melhores práticas.",
    Icon: MessageCircle,
    image: "/suporte.png",
    fg: "oklch(0.65 0.15 55)",
    bg: "oklch(0.96 0.04 60)",
    tailwindFg: "text-agent-help-fg",
    tailwindBg: "bg-agent-help-bg",
  },
};

export const AGENT_LIST: AgentMeta[] = [AGENTS.info, AGENTS.viral, AGENTS.script, AGENTS.help];

/** Lista filtrada — só os agentes que aparecem na UI. */
export const VISIBLE_AGENTS: AgentMeta[] = AGENT_LIST.filter((a) => !a.hidden);
