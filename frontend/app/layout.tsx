import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VideoModalProvider } from "@/components/molecules/video-modal";
import { DialogProvider } from "@/components/molecules/dialog-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
    default: "Spark · IA pra TikTok Shop",
    template: "%s · Spark",
  },
  description,
  applicationName: "Spark",
  authors: [{ name: "Spark" }],
  keywords: ["TikTok Shop", "IA", "scripts virais", "neuromarketing", "criadoras", "Brasil"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Spark",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Spark · IA pra TikTok Shop",
    description,
    siteName: "Spark",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spark · IA pra TikTok Shop",
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
    <html lang="pt-BR" className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full bg-spark-bg text-spark-ink font-sans">
        <DialogProvider>
          <VideoModalProvider>{children}</VideoModalProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
