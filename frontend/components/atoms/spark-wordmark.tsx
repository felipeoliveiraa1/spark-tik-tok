import Image from "next/image";

type Props = {
  /** Altura do wordmark em px. Largura é auto (aspect-ratio mantida). */
  size?: number;
  /** Em fundos coloridos, renderiza texto branco em vez do PNG colorido
   *  (que tem fundo claro e ficaria como "carimbo"). */
  white?: boolean;
  className?: string;
};

/**
 * Wordmark horizontal do Método TTS: ícone TTS + texto "MÉTODO TTS".
 *
 * `white=true` em fundos rose/gradient: renderiza texto branco sem
 * imagem (a logo PNG tem fundo claro e visualmente fica como carimbo).
 */
export function SparkWordmark({ size = 36, white = false, className }: Props) {
  if (white) {
    return (
      <div
        className={`inline-flex items-baseline gap-1.5 ${className ?? ""}`}
        style={{ color: "#fff" }}
      >
        <span
          style={{
            fontSize: size * 0.85,
            fontWeight: 600,
            opacity: 0.85,
            letterSpacing: "-0.01em",
          }}
        >
          método
        </span>
        <span
          style={{
            fontSize: size * 1.05,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          TTS
        </span>
      </div>
    );
  }

  // A logo horizontal tem proporção ~2.5:1 (largura:altura).
  const height = size + 8;
  const width = Math.round(height * 2.5);
  return (
    <Image
      src="/tts-logo-horizontal.png"
      alt="Método TTS"
      width={width * 2}
      height={height * 2}
      priority
      className={className}
      style={{
        display: "block",
        height,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
      }}
    />
  );
}
