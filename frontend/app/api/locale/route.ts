import { NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/locale — seta cookie NEXT_LOCALE. Usado pelo botao flutuante
 * de idioma em landing/login (deslogada). Logada deve usar PATCH /api/me
 * com { language } (que sincroniza profile.language + cookie).
 *
 * Body: { locale: 'pt-BR' | 'en' | 'es' }
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isLocale(body.locale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale: body.locale });
  response.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
