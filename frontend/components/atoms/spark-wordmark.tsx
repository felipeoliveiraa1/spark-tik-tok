import Image from "next/image";

type Props = {
  /** Altura do wordmark em px. Largura é auto (aspect-ratio mantida). */
  size?: number;
  /** mantido por compat — a logo PNG é colorida fixa. */
  white?: boolean;
  className?: string;
};

/**
 * Wordmark horizontal do Método TTS: ícone TTS + texto "MÉTODO TTS".
 */
export function SparkWordmark({ size = 22, className }: Props) {
  // A logo horizontal tem proporção ~2.5:1 (largura:altura). Setamos altura
  // pelo `size` e largura proporcional.
  const height = size + 4;
  const width = Math.round(height * 2.5);
  return (
    <Image
      src="/tts-logo-horizontal.png"
      alt="Método TTS"
      width={width}
      height={height}
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
