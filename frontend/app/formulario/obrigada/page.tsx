import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";

export default async function FormularioObrigadaPage() {
  const t = await getTranslations("formulario.obrigada");
  return (
    <div className="min-h-dvh relative overflow-hidden hero-radial">
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[500px] h-[500px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/4 w-[460px] h-[460px]" />
      <SparkleField count={20} seed={2026} className="opacity-60" />

      <div className="relative min-h-dvh flex flex-col px-5 lg:px-12 py-6 lg:py-10">
        <header className="flex items-center justify-between">
          <SparkWordmark size={32} />
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-[640px] text-center">
            <div className="mb-6 inline-flex">
              <Sticker text={t("stickerText")} emoji="✨" size={140} />
            </div>

            <div className="text-eyebrow text-spark-brand-deep mb-4 inline-flex items-center gap-2">
              <Sparkles size={12} strokeWidth={2.5} />
              {t("eyebrow")}
            </div>

            <h1
              className="font-display lowercase leading-[0.9] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              <span className="block text-spark-ink">{t("headlineLine1")}</span>
              <span className="block text-grad-brand">{t("headlineLine2")}</span>
            </h1>

            <p className="mt-7 text-fluid-lead text-spark-ink-70 leading-snug font-semibold max-w-[44ch] mx-auto">
              {t("subtitle")}
            </p>

            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1"
              >
                {t("ctaTikTok")}
                <ArrowUpRight
                  size={15}
                  strokeWidth={2.5}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <Link
                href="/landing"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full glass border border-spark-hairline text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-1"
              >
                {t("ctaLanding")}
              </Link>
            </div>

            <div className="mt-12 text-[12px] text-spark-ink-50 font-mono">
              {t("responseTime")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
