import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasActiveAccess } from "@/lib/plan-access";

/**
 * Guard de acesso: redireciona aluna sem assinatura ativa pra
 * /plano-inativo, exceto em rotas livres.
 *
 * Rotas livres (sempre acessíveis pra qualquer logado):
 *   /login, /welcome, /plano-inativo, /conta, /landing
 *   /api/webhooks/*, /api/auth/*, /api/me
 *   _next, /icons, /tts-logo-*, /analista.png, /script.png, etc
 *   /favicon, /manifest, opengraph
 *
 * Rotas pagas (default): tudo o resto.
 */

const FREE_PATHS = [
  "/login",
  "/welcome",
  "/plano-inativo",
  "/conta",
  "/landing",
];

const FREE_PREFIXES = [
  "/api/webhooks",
  "/api/auth",
  "/_next",
  "/icons",
];

const FREE_EXTENSIONS = [".png", ".svg", ".ico", ".webmanifest", ".webp", ".jpg", ".jpeg"];

function isFreePath(pathname: string): boolean {
  if (FREE_PATHS.includes(pathname)) return true;
  if (FREE_PATHS.some((p) => pathname.startsWith(p + "/"))) return true;
  if (FREE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (FREE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true;
  // /api/me precisa ser livre pq /conta usa pra fetch profile
  if (pathname === "/api/me") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas livres passam direto
  if (isFreePath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Cliente Supabase no edge runtime (com cookies do request/response)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Verifica sessão. Sem user → /login.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Busca campos minimos pra decidir acesso
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_active, plan_status, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasActiveAccess(profile)) {
    const url = request.nextUrl.clone();
    url.pathname = "/plano-inativo";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Matcher: aplica middleware a TODAS as rotas EXCETO:
 *  - assets do Next (_next/*)
 *  - favicon
 *
 * O isFreePath() acima cuida do resto da lógica.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
