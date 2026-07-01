import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /desafio -> video YouTube. Redirect simples 307, sem deeplink intent://
// nem interstitial (versao anterior estava confundindo o fluxo — user
// quer que abra direto no video, em qualquer dispositivo).
const YOUTUBE_URL = "https://www.youtube.com/watch?v=-mexqrXVc3o";

export function GET() {
  return NextResponse.redirect(YOUTUBE_URL, { status: 307 });
}
