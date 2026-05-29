import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware de auth — duas funções principais:
 *
 *   1) Sincroniza o cookie de sessão do Supabase (usando getUser que faz
 *      refresh quando preciso). Sem isso, o SSR perde sessão.
 *
 *   2) Quando a aluna tem must_reset_password=true (entrou com senha
 *      temporária da Kiwify ou /admin/grant), bloqueia TODO acesso e
 *      redireciona pra /conta?reset=1. Só libera depois que ela trocar
 *      a senha (resetPasswordAction marca must_reset_password=false).
 */

// Rotas publicas — middleware nem faz lookup de profile
const PUBLIC_PATHS = ["/login", "/landing", "/forgot-password", "/reset-password"];

// Rotas que a aluna ainda pode acessar enquanto must_reset_password=true.
// Tudo o mais cai em /conta?reset=1 ate ela trocar a senha.
const RESET_ALLOWED_PATHS = [
  "/conta",         // tela onde ela troca
  "/api/me",        // /conta consome pra render
  "/api/logout",    // pode sair se quiser
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isResetAllowed(pathname: string): boolean {
  return RESET_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass pra rotas publicas (login, landing, etc)
  if (isPublic(pathname)) return NextResponse.next();

  const response = NextResponse.next({ request: { headers: request.headers } });

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

  // Refresh sessao + pega user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem user → deixa as pages decidirem (algumas tem getCurrentProfile + redirect)
  if (!user) return response;

  // Checa flag must_reset_password
  const { data: profile } = await supabase
    .from("profiles")
    .select("must_reset_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.must_reset_password === true && !isResetAllowed(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/conta";
    url.search = "?reset=1";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto:
     * - _next/static, _next/image, favicon
     * - api/webhooks (Kiwify precisa atingir sem redirect)
     * - api/healthz
     * - qualquer arquivo com extensao (assets publicos)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/healthz|.*\\..*).*)",
  ],
};
