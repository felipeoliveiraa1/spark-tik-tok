import * as React from "react";
import { AgentBadge } from "@/components/atoms/agent-badge";
import { MessageContent } from "@/components/molecules/message-content";
import { SaveScriptsButton } from "@/components/molecules/save-scripts-button";
import { type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  children: React.ReactNode;
  className?: string;
};

export function AgentBubble({ agent, children, className }: Props) {
  const isString = typeof children === "string";
  // Só pro Scripts: detecta blocos de roteiro e mostra botão "Salvar".
  // Não depende de tool calling do modelo — aluna controla.
  const text = isString ? (children as string) : "";
  const showSaveButton =
    agent === "script" &&
    isString &&
    /\*\*\s*ROTEIRO\s+\d+\s*[—–-]\s*Estilo:/i.test(text);

  return (
    <div className={cn("px-4 mb-3.5", className)}>
      <div className="mb-1.5">
        <AgentBadge agent={agent} />
      </div>
      {isString ? (
        <MessageContent>{children as string}</MessageContent>
      ) : (
        <div className="text-[14.5px] leading-[1.5] text-spark-ink tracking-[-0.005em]">
          {children}
        </div>
      )}
      {showSaveButton && <SaveScriptsButton text={text} />}
    </div>
  );
}
