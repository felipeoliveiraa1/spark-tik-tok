/**
 * Template do email D+1 de onboarding. Mandado 24h depois da compra confirmada
 * quando a aluna ainda nao logou no app.
 *
 * Objetivo: puxar a aluna pra dentro sem culpa — lembra que o acesso ta la,
 * ancora o proximo passo (primeiro login), e reforca o valor imediato.
 *
 * Estilo: mesmo layout do welcome.ts (gradient rose, card centralizado,
 * CTA bulletproof, footer). Reusa escapeHtml exportado de welcome.
 */

import { escapeHtml } from "./welcome";

type OnboardingInput = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildOnboardingD1Email(input: OnboardingInput): { subject: string; text: string; html: string } {
  const loginUrl = `${getSiteUrl()}/login`;

  const subject = `${input.firstName}, seu acesso ao Método TTS ta te esperando ✨`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Ontem sua compra foi confirmada e eu vi que voce ainda nao entrou no app — vim aqui so pra lembrar que ta tudo prontinho te esperando.`,
    ``,
    `O email de boas-vindas que mandei ontem tem seu login e senha temporaria. Se nao achou, da uma olhadinha na aba de promocoes ou spam (as vezes cai la).`,
    ``,
    `Link direto pra entrar: ${loginUrl}`,
    ``,
    `Assim que voce logar, ja pode:`,
    `- Subir uma foto do seu produto e receber uma analise completa`,
    `- Gerar 5 roteiros prontos pro TikTok (gancho, desenvolvimento, beneficio, CTA)`,
    `- Ver as aulas e lives da Yara`,
    `- Tirar duvidas sobre TikTok Shop`,
    ``,
    `Nao precisa fazer tudo hoje — so entra uma vez pra criar sua senha nova e dar uma explorada. O resto vem no seu ritmo.`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Mesma paleta rose/pink do welcome (Outlook nao le oklch/gradient sozinho —
  // solid antes do gradient).
  const brandSolid = "#db2777"; // pink 600
  const brandLight = "#fce7f3"; // pink 100
  const brandBorder = "#fbcfe8"; // pink 200
  const brandDeep = "#9d174d"; // pink 800
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:${brandLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background-color:${brandSolid};background:${brandGradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Seu acesso ta pronto</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Vim so lembrar que o <strong>Método TTS</strong> ta te esperando ✨
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Ontem sua compra foi confirmada e eu vi que voce ainda nao entrou. Ta tudo prontinho por aqui — bora fazer seu primeiro login?
      </p>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(loginUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#10024; Entrar no Método TTS</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(loginUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              ✨ Entrar no Método TTS
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto grande pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(loginUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(loginUrl)}</a>
      </div>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Nao achou o email de ontem?</div>
        <div style="font-size:13.5px;margin:6px 0 0;color:#3a3a3f;">
          Seu login e a senha temporaria vieram no <strong>email de boas-vindas</strong>. As vezes cai na aba de <strong>Promoções</strong> ou <strong>Spam</strong> — da uma olhadinha por la.
        </div>
      </div>

      <h2 style="margin:20px 0 8px;font-size:15px;font-weight:700;color:#1d1d1f;">Assim que voce logar, ja pode:</h2>
      <ul style="margin:0;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li><strong>Subir uma foto do seu produto</strong> e receber uma analise completa</li>
        <li><strong>Gerar 5 roteiros prontos</strong> pro TikTok — gancho, desenvolvimento, beneficio e CTA</li>
        <li><strong>Aulas e lives</strong> da Yara</li>
        <li><strong>Tira-dúvidas</strong> sobre TikTok Shop</li>
      </ul>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:18px 0 0;">
        <strong>Sem pressa:</strong> nao precisa fazer tudo hoje. So entra uma vez pra criar sua senha nova e da uma explorada — o resto vem no seu ritmo. 💕
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Qualquer coisa, é só responder esse email.
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br />
        <strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
