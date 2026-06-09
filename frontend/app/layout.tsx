import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { LOCALE_META, type Locale } from "@/i18n/config";
import "./globals.css";
import { VideoModalProvider } from "@/components/molecules/video-modal";
import { DialogProvider } from "@/components/molecules/dialog-provider";
import { PlanAlert } from "@/components/molecules/plan-alert";
import { PwaPromptCapture } from "@/components/atoms/pwa-prompt-capture";
import { Heartbeat } from "@/components/heartbeat";

/**
 * Cabinet Grotesk Variable — sans-serif moderno usado em body/UI.
 * Single file variable (200-800), ~41KB. Substitui Plus Jakarta Sans.
 */
const cabinet = localFont({
  src: "../public/fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
  style: "normal",
});

/**
 * Tanker Regular — display font condensado/expandido pra hero/headlines.
 * Usado em FluidHeading com a variante "display". Lowercase by design.
 */
const tanker = localFont({
  src: "../public/fonts/Tanker-Regular.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
  style: "normal",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const meta = LOCALE_META[locale] ?? LOCALE_META["pt-BR"];

  // Fallbacks defensivos — namespace 'common' pode nao ter as chaves na
  // 1a versao, entao mantemos valores literais PT como fallback ate ser
  // populado em todos os locales.
  const title = t.has("meta.title") ? t("meta.title") : "Método TTS · IA pra TikTok Shop";
  const description = t.has("meta.description")
    ? t("meta.description")
    : "Sua IA pessoal pra analisar produto, achar viral e escrever hook que converte. Pensado pra criadoras de TikTok Shop.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · Método TTS`,
    },
    description,
    applicationName: "Método TTS",
    authors: [{ name: "Método TTS" }],
    keywords: ["TikTok Shop", "IA", "scripts", "criadoras"],
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "Método TTS",
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      title,
      description,
      siteName: "Método TTS",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const meta = LOCALE_META[locale] ?? LOCALE_META["pt-BR"];

  return (
    <html
      lang={meta.htmlLang}
      className={`${cabinet.variable} ${tanker.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-spark-bg text-spark-ink font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PwaPromptCapture />
          <Heartbeat />
          <DialogProvider>
            <PlanAlert />
            <VideoModalProvider>{children}</VideoModalProvider>
          </DialogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
