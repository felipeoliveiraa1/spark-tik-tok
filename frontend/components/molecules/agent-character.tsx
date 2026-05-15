import { AGENTS, type AgentId } from "@/lib/agents";

/**
 * Foto do agente (em /public). Anteriormente era um SVG estilizado;
 * agora usamos a imagem personalizada que a Aline subiu pra cada agente.
 */

type Props = {
  agent: AgentId;
  size?: number;
  className?: string;
};

export function AgentCharacter({ agent, size = 96, className }: Props) {
  const a = AGENTS[agent];

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: a.bg,
        position: "relative",
        overflow: "hidden",
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
