import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// LGPD: IP_HASH_SALT obrigatorio. Sem fallback no source — se salt
// hardcoded vaza no git, hash vira reversivel via rainbow table (universo
// IPv4 eh ~4B, GPU brute-forca em segundos). Sem env -> ip_hash=null.
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    console.error("[grupo] IP_HASH_SALT not set — ip_hash will be null");
    return null;
  }
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .slice(0, 16);
}

// Bots que disparam GET pra unfurl/preview do link (WhatsApp, Insta,
// Telegram, Twitter, Discord, etc). Se a gente nao filtra, esses hits
// inflam o click_count e queimam o cap antes da aluna real chegar.
// Pra esses, serve uma pagina simples (200 + HTML) SEM chamar a RPC e
// SEM registrar click. Browsers reais caem no fluxo normal de redirect.
const BOT_UA_REGEX =
  /facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|skypeuripreview|tumblr|googlebot|bingbot|applebot|duckduckbot|baiduspider|yandex|pinterest|crawler|spider|bot\/|preview|unfurl/i;

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_UA_REGEX.test(ua);
}

function botPreviewHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Comunidade Método TTS</title>
<meta name="description" content="Entra na nossa comunidade de criadoras TikTok Shop.">
<meta property="og:title" content="Comunidade Método TTS">
<meta property="og:description" content="Entra na nossa comunidade de criadoras TikTok Shop.">
<meta property="og:url" content="https://www.metodotts.app/grupo">
<meta property="og:type" content="website">
</head>
<body>
<h1>Comunidade Método TTS</h1>
<p>Clica no link pra entrar no nosso grupo de criadoras.</p>
</body>
</html>`;
}

function fullPageHtml(title: string, message: string, ctaUrl?: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
       background:linear-gradient(135deg,#fff5f7 0%,#ffe8ed 100%);
       min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;color:#2a2a2a}
  .card{background:white;border-radius:24px;padding:40px 28px;max-width:420px;width:100%;
        box-shadow:0 8px 32px rgba(0,0,0,0.08);text-align:center}
  h1{margin:0 0 12px;font-size:22px;font-weight:800;letter-spacing:-0.02em}
  p{margin:0 0 24px;color:#6a6a6a;font-size:15px;line-height:1.5}
  a{display:inline-block;background:linear-gradient(135deg,#ff5f8d,#ff8b5f);color:white;
    text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:800;
    box-shadow:0 4px 16px rgba(255,95,141,0.3)}
  .emoji{font-size:48px;margin-bottom:16px;display:block}
</style>
</head>
<body>
<div class="card">
<span class="emoji">💕</span>
<h1>${title}</h1>
<p>${message}</p>
${ctaUrl ? `<a href="${ctaUrl}">Acessar</a>` : ""}
</div>
</body>
</html>`;
}

/**
 * GET /grupo
 *
 * Round-robin entre grupos WhatsApp configurados em group_redirect_links.
 * RPC atomic pick_next_group_redirect garante balanceamento perfeito mesmo
 * sob acesso concorrente.
 *
 * Bot detection: previewers (WhatsApp/Insta/Telegram/etc) recebem HTML
 * simples SEM incrementar click_count.
 *
 * Insert do click usa `after()` do Next 16 — garante execucao mesmo em
 * runtime serverless (sem cortar fire-and-forget).
 *
 * Tracking de UTM + ip_hash (LGPD-safe via IP_HASH_SALT env obrigatoria).
 */
export async function GET(request: Request) {
  const ua = request.headers.get("user-agent");

  // Bot/unfurl: serve HTML simples, nao mexe no contador
  if (isBot(ua)) {
    return new NextResponse(botPreviewHtml(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("pick_next_group_redirect");

  if (error) {
    console.error("[grupo] RPC error:", error.message);
    const fallback = process.env.GRUPO_FALLBACK_URL;
    if (fallback) return NextResponse.redirect(fallback, 302);
    return new NextResponse(
      fullPageHtml(
        "Ops, deu um errinho",
        "Estamos com um problema técnico. Tenta de novo em alguns minutos ou nos chama no Instagram @metodotts.",
      ),
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  if (!data || data.length === 0) {
    const fallback = process.env.GRUPO_FALLBACK_URL;
    if (fallback) return NextResponse.redirect(fallback, 302);
    return new NextResponse(
      fullPageHtml(
        "Grupos lotados",
        "Nossas comunidades atingiram o limite. Nos chama no Instagram @metodotts que te incluímos na próxima turma!",
      ),
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const row = data[0] as { id: string; url: string };
  const linkId = row.id;
  const targetUrl = row.url;

  const { searchParams } = new URL(request.url);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  // after() garante que o insert roda APOS o response sair, mas dentro
  // do ciclo de vida da invocacao serverless — promise nao eh cortada.
  after(async () => {
    const { error: insErr } = await supabase
      .from("group_redirect_clicks")
      .insert({
        link_id: linkId,
        ip_hash: hashIp(ip),
        user_agent: ua?.slice(0, 500) ?? null,
        referer: request.headers.get("referer")?.slice(0, 500) ?? null,
        utm_source: searchParams.get("utm_source")?.slice(0, 100) ?? null,
        utm_medium: searchParams.get("utm_medium")?.slice(0, 100) ?? null,
        utm_campaign: searchParams.get("utm_campaign")?.slice(0, 100) ?? null,
        utm_content: searchParams.get("utm_content")?.slice(0, 100) ?? null,
        utm_term: searchParams.get("utm_term")?.slice(0, 100) ?? null,
      });
    if (insErr) {
      console.warn("[grupo] click insert failed:", insErr.message);
    }
  });

  return NextResponse.redirect(targetUrl, 302);
}
