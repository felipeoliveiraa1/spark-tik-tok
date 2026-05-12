import * as React from "react";
import { AgentBadge } from "@/components/atoms/agent-badge";
import { type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  children: React.ReactNode;
  className?: string;
};

export function AgentBubble({ agent, children, className }: Props) {
  return (
    <div className={cn("px-4 mb-3.5", className)}>
      <div className="mb-1.5">
        <AgentBadge agent={agent} />
      </div>
      <div className="text-[14.5px] leading-[1.5] text-spark-ink tracking-[-0.005em]">{children}</div>
    </div>
  );
}
