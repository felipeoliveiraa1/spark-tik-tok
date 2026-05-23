import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Método TTS — IA pra TikTok Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://spark-tik-tok-app.vercel.app";
  const logoUrl = `${siteUrl}/tts-logo-horizontal.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 350), oklch(0.92 0.06 25))",
          color: "#1d1d1f",
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Método TTS" width={260} height={104} style={{ objectFit: "contain" }} />
          <span
            style={{
              marginLeft: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "oklch(0.55 0.24 340)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Beta
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              opacity: 0.7,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.5 0.22 345)",
            }}
          >
            IA pra criadoras de TikTok Shop
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              marginTop: 18,
              maxWidth: 980,
            }}
          >
            Crie scripts que vendem.
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.75,
              marginTop: 22,
              maxWidth: 920,
              lineHeight: 1.4,
            }}
          >
            Foto do produto → ficha completa → 5 roteiros prontos com gancho, desenvolvimento, benefício e CTA.
          </div>
        </div>

        {/* Bottom row: agent labels */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            "📦 Análise",
            "✍️ Scripts",
            "🎓 Aulas",
            "💬 Suporte",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "12px 24px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid oklch(0.9 0.05 345)",
                fontSize: 22,
                fontWeight: 700,
                color: "oklch(0.4 0.18 345)",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
