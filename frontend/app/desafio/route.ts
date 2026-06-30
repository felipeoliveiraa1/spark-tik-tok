import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirect estatico /desafio -> grupo do WhatsApp do Desafio.
// Sem analytics/round-robin (diferente de /grupo) — apenas atalho de URL.
const DESAFIO_WHATSAPP_URL = "https://chat.whatsapp.com/Coh2xidtJKW58QiDdnpalX";

export function GET() {
  return NextResponse.redirect(DESAFIO_WHATSAPP_URL, { status: 307 });
}
