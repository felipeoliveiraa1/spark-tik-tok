import Image from "next/image";

type Props = {
  size?: number;
  /** mantido por compat — não muda renderização da imagem. */
  mono?: boolean;
  /** Em fundos coloridos (gradient rose, etc), renderiza versão branca
   *  abstrata em vez do PNG (que tem fundo claro). */
  white?: boolean;
  className?: string;
};

/**
 * Mark visual do Método TTS — sacola TTS com play e gráfico.
 *
 * Em fundos coloridos (login splash, landing CTA), `white=true` renderiza
 * uma versão branca abstrata (estrela) porque o PNG colorido tem fundo
 * claro e ficaria como "carimbo" feio em cima do gradient.
 */
export function SparkMark({ size = 36, white = false, className }: Props) {
  if (white) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={className}
        style={{ display: "block" }}
      >
        <path d="M5 16 L16 4 L19 13 L28 16 L16 28 L13 19 Z" fill="#fff" />
      </svg>
    );
  }
  return (
    <Image
      src="/tts-logo-mark.png"
      alt="Método TTS"
      width={size * 2}
      height={size * 2}
      priority
      className={className}
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  );
}
