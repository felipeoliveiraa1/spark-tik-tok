/**
 * Template do email de onboarding D+3. Mandado quando passaram 3 dias desde
 * a criação da conta e a aluna ainda não completou a primeira aula.
 *
 * Tom: acolhedor, sem chatice. Pergunta se travou em alguma coisa e oferece
 * ajuda por resposta direta do email. CTA único pro login.
 */

type OnboardingD3Input = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildOnboardingD3Email(input: OnboardingD3Input): { subject: string; text: string; html: string } {
  const subject = `Ainda não te vi por lá, ${input.firstName} 💕`;

  const loginUrl = `${getSiteUrl()}/login`;

  const text = [
    `Oi ${input.firstName}, tudo bem? 💕`,
    ``,
    `Passei aqui rapidinho porque ainda não te vi na primeira aula do Método TTS.`,
    ``,
    `Travou em alguma coisa? Não conseguiu entrar, ficou perdida no app, não sabe por onde começar?`,
    ``,
    `Qualquer dúvida, é só responder esse email que a gente te ajuda direto. Sem pressa e sem julgamento — a ideia é que você comece com o pé direito.`,
    ``,
    `Quando puder, é só entrar por aqui:`,
    ``,
    `Link: ${loginUrl}`,
    ``,
    `Ah, e uma dica: a primeira aula é curtinha, cabe num intervalinho. Bora?`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink hex (Outlook nao le oklch/gradient sozinho — solid antes do gradient)
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Cadê você?</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Ainda não te vi na primeira aula. Travou em alguma coisa?
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Passei aqui rapidinho porque ainda não te vi na primeira aula do <strong>Método TTS</strong>.
      </p>

      <p style="margin:0 0 18px;font-size:14.5px;color:#3a3a3f;">
        Travou em alguma coisa? Não conseguiu entrar, ficou perdida no app, não sabe por onde começar?
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:6px;">Precisa de ajuda?</div>
        <div style="font-size:14px;color:#1d1d1f;">
          É só <strong>responder esse email</strong> que a gente te ajuda direto. Sem pressa e sem julgamento — a ideia é que você comece com o pé direito. 💕
        </div>
      </div>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(loginUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#10024; Entrar no app</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(loginUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              ✨ Entrar no app
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto -->
      <div style="text-align:center;margin:0 0 20px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(loginUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(loginUrl)}</a>
      </div>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 8px;">
        <strong>Dica:</strong> a primeira aula é curtinha, cabe num intervalinho. Bora?
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
