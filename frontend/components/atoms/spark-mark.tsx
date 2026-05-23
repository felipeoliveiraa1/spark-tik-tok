import Image from "next/image";

type Props = {
  size?: number;
  /** mantido por compat — não muda renderização da imagem. */
  mono?: boolean;
  /** mantido por compat — não muda renderização da imagem. */
  white?: boolean;
  className?: string;
};

/**
 * Mark visual do Método TTS — sacola TTS com play e gráfico.
 *
 * As props `mono`/`white` ficam só pra compat com call sites antigos (o
 * Spark antigo tinha variantes monocromáticas). O logo PNG é colorido fixo.
 */
export function SparkMark({ size = 28, className }: Props) {
  return (
    <Image
      src="/tts-logo-mark.png"
      alt="Método TTS"
      width={size}
      height={size}
      priority
      className={className}
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}
