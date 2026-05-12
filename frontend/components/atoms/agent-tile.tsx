import { AGENTS, type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  size?: number;
  className?: string;
};

export function AgentTile({ agent, size = 32, className }: Props) {
  const a = AGENTS[agent];
  const radius = size * 0.32;
  const iconSize = Math.round(size * 0.55);
  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: a.bg,
        color: a.fg,
      }}
    >
      <a.Icon size={iconSize} strokeWidth={1.7} />
    </div>
  );
}
