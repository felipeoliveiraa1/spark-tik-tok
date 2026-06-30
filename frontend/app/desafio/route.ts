import { NextResponse } from "next/server";
import { isInAppBrowser, interstitialHtml } from "@/lib/wa-interstitial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirect /desafio -> grupo do WhatsApp do Desafio.
// Sem analytics/round-robin (diferente de /grupo) — apenas atalho de URL.
const DESAFIO_WHATSAPP_URL = "https://chat.whatsapp.com/Coh2xidtJKW58QiDdnpalX";

export function GET(request: Request) {
  const ua = request.headers.get("user-agent");

  // In-app browser (Insta/TikTok/FB) nao faz hand-off pro WhatsApp nativo
  // — serve pagina intermediaria com botao + instrucao de "abrir no
  // navegador externo".
  if (isInAppBrowser(ua)) {
    return new NextResponse(
      interstitialHtml({ waUrl: DESAFIO_WHATSAPP_URL, ua }),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.redirect(DESAFIO_WHATSAPP_URL, { status: 307 });
}
