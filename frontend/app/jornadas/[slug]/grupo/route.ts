import { NextResponse } from "next/server";
import { isInAppBrowser, interstitialHtml } from "@/lib/wa-interstitial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirect /jornadas/[slug]/grupo -> grupo WhatsApp da jornada.
// In-app browser (Insta/TikTok/FB) recebe interstitial com botao + instrucao
// "abrir no navegador externo"; browser real vai direto 307.
//
// Adicionar novo link: cria entry em JOURNEY_GROUP_URLS pelo slug da jornada.
// Se a jornada nao tiver link ainda, retorna 404.
const JOURNEY_GROUP_URLS: Record<string, string> = {
  "jornada-1-bebe": "https://chat.whatsapp.com/FMi0NH3U3qE6ntN1RUR5Dy",
  // "jornada-2-adolescente": "https://chat.whatsapp.com/...",
  // "jornada-3-adulta": "https://chat.whatsapp.com/...",
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const waUrl = JOURNEY_GROUP_URLS[slug];
  if (!waUrl) {
    return NextResponse.json({ error: "group not available yet" }, { status: 404 });
  }

  const ua = request.headers.get("user-agent");
  if (isInAppBrowser(ua)) {
    return new NextResponse(interstitialHtml({ waUrl, ua }), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.redirect(waUrl, { status: 307 });
}
