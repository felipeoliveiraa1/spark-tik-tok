import * as React from "react";
import { AgentBadge } from "@/components/atoms/agent-badge";
import { MessageContent } from "@/components/molecules/message-content";
import { SaveScriptsButton } from "@/components/molecules/save-scripts-button";
import { SaveProductButton } from "@/components/molecules/save-product-button";
import { type AgentId } from "@/lib/agents";
import { cn } from "@/lib/cn";

type Props = {
  agent: AgentId;
  children: React.ReactNode;
  className?: string;
  /** URL da última foto anexada pela aluna ANTES dessa mensagem. Quando
   *  for ficha de produto da Info, vai junto pro endpoint de save pra
   *  preencher image_url do produto. */
  lastUserImageUrl?: string;
};

/**
 * Detecta se a mensagem da Info gerou uma ficha de produto.
 * Procura por pelo menos 3 dos campos típicos da ficha rica.
 */
function looksLikeProductFicha(text: string): boolean {
  const markers = [
    /p[úu]blico[\s-]?alvo/i,
    /dor(?:es)?\s+que\s+resolve/i,
    /pontos?\s+fortes?/i,
    /faixa\s+de\s+pre[çc]o/i,
    /concorrent/i,
    /diferenciais/i,
    /obje[çc][õo]es/i,
    /gatilhos?\s+emocionai/i,
    /momentos?\s+de\s+uso/i,
    /[âa]ngulos?\s+de\s+conte[úu]do/i,
    /hooks?\s+(prontos?|ideias?)/i,
    /sazonalidade/i,
  ];
  let hits = 0;
  for (const m of markers) {
    if (m.test(text)) hits++;
    if (hits >= 3) return true;
  }
  return false;
}

export function AgentBubble({ agent, children, className, lastUserImageUrl }: Props) {
  const isString = typeof children === "string";
  const text = isString ? (children as string) : "";

  // Botão "Salvar roteiros" pro Scripts quando detecta blocos ROTEIRO N
  const showSaveScripts =
    agent === "script" &&
    isString &&
    /\*\*\s*ROTEIRO\s+\d+\s*[—–-]\s*Estilo:/i.test(text);

  // Botão "Salvar ficha" pra Info quando detecta ficha de produto
  const showSaveProduct =
    agent === "info" && isString && looksLikeProductFicha(text);

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
      {showSaveScripts && <SaveScriptsButton text={text} />}
      {showSaveProduct && (
        <SaveProductButton text={text} imageUrl={lastUserImageUrl} />
      )}
    </div>
  );
}
