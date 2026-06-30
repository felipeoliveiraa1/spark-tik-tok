/**
 * In-app browser interstitial pra links de WhatsApp (chat.whatsapp.com/CODE).
 *
 * Problema: Instagram/TikTok/Facebook abrem links em WKWebView (iOS) ou
 * WebView (Android). Esses webviews NAO disparam Universal Links/App Links
 * pro app nativo do WhatsApp — em vez de abrir o app, mostram a pagina
 * fallback "Baixar WhatsApp" do site WhatsApp.com.
 *
 * Solucao: detectar UA in-app browser e servir HTML intermediario com:
 *   - Botao grande "ABRIR NO WHATSAPP" (clique = user gesture, melhora chance
 *     de hand-off em alguns iOS+Android)
 *   - Instrucao visual "toque nos ... -> Abrir no navegador externo" com
 *     copy adaptado por app (Instagram, TikTok, Facebook)
 *   - Link intent:// como fallback Android
 *
 * Browser nativo (Safari/Chrome/etc) continua recebendo redirect 302 direto.
 */

// Regex captura os in-app browsers mais comuns no target (mulher brasileira
// vinda de bio Instagram/TikTok). Line eh comum no Japao mas inofensivo.
export const IN_APP_UA_REGEX =
  /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Line\//i;

export function isInAppBrowser(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return IN_APP_UA_REGEX.test(ua);
}

export type InAppKind = "instagram" | "tiktok" | "facebook" | "other";

export function detectInApp(ua: string | null | undefined): InAppKind {
  if (!ua) return "other";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  return "other";
}

function isAndroid(ua: string | null | undefined): boolean {
  return !!ua && /Android/i.test(ua);
}

const APP_INSTRUCTIONS: Record<InAppKind, string> = {
  instagram:
    "Toca nos <strong>3 pontinhos (⋯)</strong> no canto superior direito da tela &rarr; <strong>“Abrir no navegador externo”</strong>",
  tiktok:
    "Toca no botão de <strong>compartilhar (→)</strong> ou nos <strong>3 pontinhos</strong> &rarr; <strong>“Abrir no Chrome / Safari”</strong>",
  facebook:
    "Toca nos <strong>3 pontinhos (⋯)</strong> no canto superior direito &rarr; <strong>“Abrir no navegador externo”</strong>",
  other:
    "Toca nos <strong>3 pontinhos</strong> do app e escolhe <strong>“Abrir no navegador externo”</strong> (ou no Chrome / Safari)",
};

const APP_LABEL: Record<InAppKind, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  other: "navegador interno do app",
};

/**
 * Extrai o codigo do convite de https://chat.whatsapp.com/CODIGO.
 */
function extractCode(waUrl: string): string | null {
  const m = waUrl.match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

export function interstitialHtml({
  waUrl,
  ua,
}: {
  waUrl: string;
  ua: string | null | undefined;
}): string {
  const app = detectInApp(ua);
  const code = extractCode(waUrl);
  const android = isAndroid(ua);
  const intentUrl = code
    ? `intent://chat.whatsapp.com/${code}#Intent;scheme=https;package=com.whatsapp;end`
    : null;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Entrar no grupo do WhatsApp</title>
  <link rel="preconnect" href="https://chat.whatsapp.com" crossorigin>
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, oklch(0.68 0.18 145) 0%, oklch(0.55 0.18 155) 100%);
      min-height: 100dvh;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px max(env(safe-area-inset-left), 20px) max(env(safe-area-inset-bottom), 32px) max(env(safe-area-inset-right), 20px);
      text-align: center;
    }
    main { max-width: 480px; width: 100%; }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
    }
    h1 {
      font-size: clamp(22px, 5vw, 28px);
      line-height: 1.15;
      margin: 0 0 8px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    p { margin: 0 0 24px; font-size: 14.5px; line-height: 1.5; opacity: 0.92; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 18px 24px;
      background: #fff;
      color: #0d6b3d;
      font-weight: 800;
      font-size: 16px;
      border-radius: 999px;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      margin-bottom: 12px;
      transition: transform 0.15s ease;
    }
    .btn-primary:active { transform: scale(0.98); }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 20px;
      background: rgba(0,0,0,0.18);
      color: #fff;
      font-weight: 700;
      font-size: 13.5px;
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 999px;
      text-decoration: none;
      margin-bottom: 24px;
    }
    .hint {
      background: rgba(255, 235, 59, 0.95);
      color: #6b4900;
      border-radius: 16px;
      padding: 16px 18px;
      text-align: left;
      font-size: 13.5px;
      line-height: 1.55;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .hint b { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; color: #4a3500; }
    .hint strong { color: #2e2000; font-weight: 800; }
    .small { margin-top: 16px; font-size: 12px; opacity: 0.75; }
    .small a { color: #fff; }
  </style>
</head>
<body>
  <main>
    <div class="icon" aria-hidden="true">💬</div>
    <h1>Entrar no grupo do WhatsApp</h1>
    <p>Você está abrindo pelo ${APP_LABEL[app]}. Pra entrar no grupo, toca no botão abaixo:</p>

    <a class="btn-primary" href="${waUrl}" target="_blank" rel="noopener">
      ABRIR WHATSAPP
      <span aria-hidden="true">→</span>
    </a>
    ${
      android && intentUrl
        ? `<a class="btn-secondary" href="${intentUrl}">Tentar abrir direto no app</a>`
        : ""
    }

    <div class="hint" role="note">
      <b>Não abriu o WhatsApp?</b>
      ${APP_INSTRUCTIONS[app]}, e cola este link:
      <div style="margin-top: 8px; font-family: monospace; word-break: break-all; background: rgba(255,255,255,0.6); padding: 8px 10px; border-radius: 8px;">${waUrl}</div>
    </div>

    <p class="small">Método TTS · Comunidade exclusiva pra criadoras</p>
  </main>

  <script>
    // Tentativa silenciosa de hand-off com user gesture do clique do botao
    // primario (alguns iOS Universal Link respondem). Sem auto-redirect pra
    // nao confundir o usuario.
  </script>
</body>
</html>`;
}
