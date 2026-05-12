import { AGENTS, type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  compact?: boolean;
  className?: string;
};

export function AgentBadge({ agent, compact, className }: Props) {
  const a = AGENTS[agent];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-[-0.01em]",
        compact ? "text-[11px] pl-[5px] pr-2 py-[3px]" : "text-[12px] pl-1.5 pr-2.5 py-[5px]",
        className,
      )}
      style={{ background: a.bg, color: a.fg }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: "rgba(255,255,255,0.6)",
          color: a.fg,
        }}
      >
        <a.Icon size={11} strokeWidth={1.8} />
      </span>
      {a.label}
    </span>
  );
}
