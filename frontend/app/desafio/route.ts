import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirect /desafio -> video YouTube do Desafio.
// YouTube abre bem em webview do Insta/TikTok/FB (nao precisa do
// interstitial que /grupo usa pra WhatsApp).
const DESAFIO_YOUTUBE_URL = "https://www.youtube.com/watch?v=-mexqrXVc3o";

export function GET() {
  return NextResponse.redirect(DESAFIO_YOUTUBE_URL, { status: 307 });
}
