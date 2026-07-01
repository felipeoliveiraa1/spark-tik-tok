import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /desafio -> video/live YouTube com deeplink pro app quando possivel.
//
// Estrategia:
// - Server detecta UA (iOS vs Android vs desktop)
// - Android: intent:// URL abre app YouTube via package name
//   (com.google.android.youtube). Fallback pro browser web se app nao
//   instalado (S.browser_fallback_url).
// - iOS: HTML com JS que tenta youtube:// scheme primeiro; se app nao
//   responder em 1.2s, cai pro https URL. Universal Links do YouTube
//   tambem cobrem parte dos casos.
// - Desktop/outros: redirect direto pro youtube.com/watch (307).
//
// Nota: proxy.ts tem /desafio no ALWAYS_PUBLIC + matcher exclusion — aluna
// nao-logada NAO cai em /landing. Fix de 2 push atras (bfe521a).

const VIDEO_ID = "-mexqrXVc3o";
const WEB_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

function isIOS(ua: string): boolean {
  return /iPad|iPhone|iPod/.test(ua);
}
function isAndroid(ua: string): boolean {
  return /Android/.test(ua);
}

function iosDeeplinkHtml(): string {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Abrindo YouTube...</title>
<style>
  body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:linear-gradient(135deg,#fdb4c2,#ffd6a8);min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px}
  .spinner{width:36px;height:36px;border:4px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px}
  @keyframes spin{to{transform:rotate(360deg)}}
  h1{font-size:20px;margin:0 0 8px;font-weight:800}
  p{font-size:14px;opacity:.9;margin:0 0 20px}
  a{color:#fff;text-decoration:underline;font-weight:700;font-size:13px}
</style></head><body>
<div class="spinner" aria-hidden></div>
<h1>Abrindo YouTube...</h1>
<p>Se nada acontecer em 2 segundos, toca abaixo pra abrir no navegador.</p>
<a id="fallback" href="${WEB_URL}">Abrir no navegador</a>
<script>
  // Tenta o app YouTube via URL scheme. Se o app estiver instalado,
  // ele "engole" o location e o setTimeout abaixo nunca dispara.
  // Se nao estiver, o browser continua na tela e cai no fallback.
  var appUrl = 'youtube://www.youtube.com/watch?v=${VIDEO_ID}';
  var webUrl = ${JSON.stringify(WEB_URL)};
  window.location.replace(appUrl);
  setTimeout(function(){ window.location.replace(webUrl); }, 1200);
</script>
</body></html>`;
}

function androidIntentUrl(): string {
  // Intent URL do Chrome pra Android: abre app YouTube se instalado,
  // fallback automatico pra https URL se nao. Sintaxe oficial:
  // intent://www.youtube.com/watch?v=ID#Intent;package=com.google.android.youtube;scheme=https;S.browser_fallback_url=<URL>;end
  const fallback = encodeURIComponent(WEB_URL);
  return (
    `intent://www.youtube.com/watch?v=${VIDEO_ID}` +
    `#Intent;package=com.google.android.youtube;scheme=https;` +
    `S.browser_fallback_url=${fallback};end`
  );
}

export function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";

  if (isAndroid(ua)) {
    // 307 pro intent URL — Chrome/Samsung Browser abrem o app
    return NextResponse.redirect(androidIntentUrl(), { status: 307 });
  }

  if (isIOS(ua)) {
    // Serve HTML com JS que tenta youtube:// + fallback https
    return new NextResponse(iosDeeplinkHtml(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Desktop / outros: redirect padrao
  return NextResponse.redirect(WEB_URL, { status: 307 });
}
