import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
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

const description =
  "Sua IA pessoal pra analisar produto, achar viral e escrever hook que converte. Pensado pra criadoras brasileiras de TikTok Shop.";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Método TTS · IA pra TikTok Shop",
    template: "%s · Método TTS",
  },
  description,
  applicationName: "Método TTS",
  authors: [{ name: "Método TTS" }],
  keywords: ["TikTok Shop", "IA", "scripts virais", "neuromarketing", "criadoras", "Brasil"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Método TTS",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Método TTS · IA pra TikTok Shop",
    description,
    siteName: "Método TTS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Método TTS · IA pra TikTok Shop",
    description,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cabinet.variable} ${tanker.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full bg-spark-bg text-spark-ink font-sans">
        <PwaPromptCapture />
        <Heartbeat />
        <DialogProvider>
          <PlanAlert />
          <VideoModalProvider>{children}</VideoModalProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
