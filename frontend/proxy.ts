import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/login", "/landing"]);
const ONBOARDING_ROUTES = new Set(["/welcome"]);
const SESSION_COOKIE = "spark-session";
const ONBOARDED_COOKIE = "spark-onboarded";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;
  const isOnboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "true";

  if (PUBLIC_ROUTES.has(pathname)) {
    if (hasSession && isOnboarded) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
  }

  if (ONBOARDING_ROUTES.has(pathname)) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  if (!isOnboarded) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/|icons/|manifest.webmanifest|apple-icon|icon|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)).*)",
  ],
};
