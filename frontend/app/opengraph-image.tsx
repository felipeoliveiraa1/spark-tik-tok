import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Spark — IA pra TikTok Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
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
          background: "linear-gradient(135deg, oklch(0.5 0.22 290), oklch(0.62 0.22 340))",
          color: "#fff",
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path d="M5 16 L16 4 L19 13 L28 16 L16 28 L13 19 Z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>spark</span>
          <span
            style={{
              marginLeft: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.2)",
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
              opacity: 0.85,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
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
              opacity: 0.9,
              marginTop: 22,
              maxWidth: 880,
              lineHeight: 1.4,
            }}
          >
            Foto do produto → ficha completa → virais → 10 hooks com neurociência.
          </div>
        </div>

        {/* Bottom row: agent labels */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { l: "Análise", c: "rgba(255,255,255,0.18)" },
            { l: "Virais", c: "rgba(255,255,255,0.18)" },
            { l: "Scripts", c: "rgba(255,255,255,0.18)" },
            { l: "Tira-dúvidas", c: "rgba(255,255,255,0.18)" },
          ].map((a) => (
            <div
              key={a.l}
              style={{
                padding: "12px 24px",
                borderRadius: 999,
                background: a.c,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {a.l}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
