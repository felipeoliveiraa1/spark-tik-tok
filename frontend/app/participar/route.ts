import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /participar -> checkout Kiwify. Redirect 307 puro, sem interstitial.
// Kiwify abre bem em qualquer webview (Insta/TikTok/browser real).
const KIWIFY_CHECKOUT_URL = "https://pay.kiwify.com.br/YOR83Pu";

export function GET() {
  return NextResponse.redirect(KIWIFY_CHECKOUT_URL, { status: 307 });
}
