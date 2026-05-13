import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = new Set(["/login", "/landing"]);
const ONBOARDING_ROUTES = new Set(["/welcome"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes — kick out anyone already logged in.
  if (PUBLIC_ROUTES.has(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return response;
  }

  // Onboarding — requires session but allows incomplete profile.
  if (ONBOARDING_ROUTES.has(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Everything else (app routes) needs an active session.
  if (!user) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Session OK — but check profile completeness for non-onboarding routes.
  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, niche")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.name) {
      return NextResponse.redirect(new URL("/welcome", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/|icons/|manifest.webmanifest|apple-icon|icon|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)).*)",
  ],
};
