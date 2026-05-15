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
  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0 overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: a.bg,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a.image}
        alt={a.label}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
