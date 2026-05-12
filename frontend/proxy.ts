import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/login", "/landing"]);
const ONBOARDING_ROUTES = new Set(["/welcome", "/onboarding/perfil"]);
const SESSION_COOKIE = "spark-session";
const ONBOARDED_COOKIE = "spark-onboarded";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;
  const isOnboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "true";

  // Allow public routes
  if (PUBLIC_ROUTES.has(pathname)) {
    // If already authenticated, kick them home
    if (hasSession && isOnboarded) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Onboarding routes require a session but not "onboarded"
  if (ONBOARDING_ROUTES.has(pathname)) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Everything else requires full auth — unauthenticated users see the landing
  if (!hasSession) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Logged in but not onboarded yet -> send to welcome
  if (!isOnboarded) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals, API routes, and static assets — those manage their own auth
    "/((?!api/|_next/|icons/|manifest.webmanifest|apple-icon|icon|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)).*)",
  ],
};
