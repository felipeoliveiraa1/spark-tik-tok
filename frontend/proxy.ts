import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasActiveAccess } from "@/lib/plan-access";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

/**
 * Proxy do Next 16 (era middleware nas versões anteriores). Cobre 3 guards:
 *
 *   1. Auth: rotas públicas (/login, /landing) chutam logados pra dentro;
 *      rotas protegidas chutam não-logados pra /landing.
 *   2. Senha temporária: aluna com must_reset_password=true fica trancada
 *      em /conta?reset=1 até trocar a senha.
 *   3. Plano: alunas logadas sem assinatura ativa caem em /plano-inativo,
 *      exceto em rotas livres (/conta, /welcome, etc).
 *
 * Onboarding: se já tem session mas profile não tem `name`, mandamos pra
 * /welcome pra completar perfil antes de liberar o app.
 */

// Rotas pra quem NÃO está logado (login/landing): se já tá logado, kicka
// pra /chat. Apenas essas redirecionam.
const PUBLIC_ROUTES = new Set(["/login", "/landing"]);

// Rotas SEMPRE acessíveis (logado ou não). Necessário pro reset de senha
// porque o link do email cria sessão temporária — não dá pra kickar.
// /formulario eh pagina publica de captacao de leads (bio do TikTok).
const ALWAYS_PUBLIC = new Set([
  "/forgot-password",
  "/reset-password",
  "/formulario",
  "/formulario/obrigada",
]);
const ONBOARDING_ROUTES = new Set(["/welcome"]);

// Rotas que SEMPRE liberam mesmo sem assinatura ativa (logada mas sem plano):
// /conta pra ela gerir assinatura, /plano-inativo é o destino do bloqueio.
const FREE_FROM_PLAN_GUARD = new Set([
  "/conta",
  "/plano-inativo",
]);

function isFreeFromPlanGuard(pathname: string): boolean {
  if (FREE_FROM_PLAN_GUARD.has(pathname)) return true;
  // Permite /conta/qualquer-coisa e /plano-inativo/qualquer-coisa
  if ([...FREE_FROM_PLAN_GUARD].some((p) => pathname.startsWith(p + "/"))) return true;
  return false;
}

// Rotas permitidas quando must_reset_password=true. Tudo o mais redireciona
// pra /conta?reset=1 ate ela trocar a senha.
const RESET_ALLOWED = ["/conta", "/api/me", "/api/logout"];

function isResetAllowed(pathname: string): boolean {
  return RESET_ALLOWED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

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

  // Always public — passa sempre, mesmo logada (caso forgot/reset password).
  if (ALWAYS_PUBLIC.has(pathname)) {
    return response;
  }

  // Public routes (login/landing) — logada já entra direto no app.
  if (PUBLIC_ROUTES.has(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return response;
  }

  // Onboarding — precisa session mas permite profile incompleto.
  if (ONBOARDING_ROUTES.has(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Tudo o resto (app) precisa de session.
  if (!user) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  // Sessão OK — pra rotas de página (não API/assets), checa profile
  // completeness e plano. APIs gerenciam auth próprio.
  const isPageRoute = !pathname.startsWith("/api") && !pathname.startsWith("/_next");

  if (isPageRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "name, niche, plan_active, plan_status, plan_expires_at, role, must_reset_password, language",
      )
      .eq("id", user.id)
      .maybeSingle();

    // Sync cookie NEXT_LOCALE com profile.language quando divergirem.
    // Caso de uso: aluna troca idioma em outro device, ao voltar aqui
    // queremos refletir a preferencia atual sem mudar codigo i18n/request.
    const currentCookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    if (
      profile?.language &&
      isLocale(profile.language) &&
      currentCookieLocale !== profile.language
    ) {
      response.cookies.set(LOCALE_COOKIE, profile.language, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Admin tem acesso a tudo, ignora guards de onboarding e plano.
    const isAdmin = profile?.role === "admin";
    // crm_agent eh membro interno (atendente de vendas): nao tem plano,
    // nao tem perfil de aluna. Acesso restrito a /crm-metodotts.
    const isCrmAgent = profile?.role === "crm_agent";

    // crm_agent: confina em /crm-metodotts (tentou outra coisa, redireciona)
    if (isCrmAgent) {
      const allowedForCrm =
        pathname === "/crm-metodotts" || pathname.startsWith("/crm-metodotts/");
      if (!allowedForCrm) {
        return NextResponse.redirect(new URL("/crm-metodotts", request.url));
      }
      // Dentro do CRM — passa direto (pula reset/onboarding/plano)
      return response;
    }

    // Senha temporaria → /conta?reset=1 (prioridade maxima, admin pula tb)
    // Bloqueia tudo exceto /conta + APIs essenciais ate ela trocar.
    if (
      !isAdmin &&
      profile?.must_reset_password === true &&
      !isResetAllowed(pathname)
    ) {
      const url = new URL("/conta", request.url);
      url.searchParams.set("reset", "1");
      return NextResponse.redirect(url);
    }

    // Profile incompleto → onboarding (admin pula)
    if (!isAdmin && !profile?.name) {
      return NextResponse.redirect(new URL("/welcome", request.url));
    }

    // Plano inativo → /plano-inativo (admin pula; rotas livres tb)
    if (!isAdmin && !isFreeFromPlanGuard(pathname) && !hasActiveAccess(profile)) {
      return NextResponse.redirect(new URL("/plano-inativo", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/|icons/|manifest.webmanifest|apple-icon|icon|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)).*)",
  ],
};
