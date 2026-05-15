import { AGENTS, type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  compact?: boolean;
  className?: string;
};

export function AgentBadge({ agent, compact, className }: Props) {
  const a = AGENTS[agent];
  const dot = compact ? 16 : 18;
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
        className="inline-flex items-center justify-center overflow-hidden"
        style={{
          width: dot,
          height: dot,
          borderRadius: dot * 0.28,
          background: "rgba(255,255,255,0.6)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.image}
          alt=""
          width={dot}
          height={dot}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </span>
      {a.label}
    </span>
  );
}
