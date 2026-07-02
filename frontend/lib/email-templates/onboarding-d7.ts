/**
 * Template do email de check-in D+7. Mandado ~7 dias apos a criacao da conta,
 * quando a aluna deveria ter passado por M1 (Boas-vindas), M2 (Fundamentos)
 * e M3 (Primeiro roteiro).
 *
 * Tom: check-in genuino, sem pressao. Elogia se ela ta indo bem, abre espaco
 * pra ela falar se travou em algo, e lembra dos proximos passos da jornada.
 *
 * Estilo: mesma paleta rose do welcome. Card branco, header gradient, CTA
 * bulletproof.
 */

type OnboardingD7Input = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildOnboardingD7Email(input: OnboardingD7Input): { subject: string; text: string; html: string } {
  const subject = `Como ta indo, ${input.firstName}? ✨`;

  const jornadasUrl = `${getSiteUrl()}/jornadas`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Passando aqui so pra saber como voce ta se sentindo nessa primeira semana no Metodo TTS.`,
    ``,
    `A essa altura, voce ja deveria ter passado por:`,
    ``,
    `- M1: Boas-vindas e primeiros passos`,
    `- M2: Fundamentos do TikTok Shop`,
    `- M3: Seu primeiro roteiro`,
    ``,
    `Se ta tudo fluindo, MARAVILHA — voce ta no ritmo certo. 💕`,
    ``,
    `Se travou em alguma coisa, respira: e super normal. Me conta aqui o que ta pegando (e so responder esse email) que a gente te ajuda a destravar.`,
    ``,
    `Proximo passo da sua jornada:`,
    `- M4 destrava em 7 dias (ao entrar na Semana 2)`,
    `- La voce aprende a estruturar conteudo que converte de verdade`,
    ``,
    `Continua na jornada: ${jornadasUrl}`,
    ``,
    `Qualquer coisa, e so responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Metodo TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Cores hex (Outlook/Hotmail nao renderizam oklch nem linear-gradient).
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Check-in da Semana 1</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Como tá indo, ${escapeHtml(input.firstName)}? ✨
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Só passando pra saber como você tá se sentindo nessa primeira semana. 💕
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        A essa altura, você já deveria ter passado por:
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:8px;">Sua semana 1</div>
        <ul style="margin:0;padding:0 0 0 20px;font-size:13.5px;color:#1d1d1f;line-height:1.8;">
          <li><strong>M1</strong> — Boas-vindas e primeiros passos</li>
          <li><strong>M2</strong> — Fundamentos do TikTok Shop</li>
          <li><strong>M3</strong> — Seu primeiro roteiro</li>
        </ul>
      </div>

      <p style="margin:0 0 12px;font-size:14.5px;color:#3a3a3f;">
        <strong>Se tá tudo fluindo:</strong> maravilha, você tá no ritmo certo. 💕 Continua firme.
      </p>
      <p style="margin:0 0 20px;font-size:14.5px;color:#3a3a3f;">
        <strong>Se travou em alguma coisa:</strong> respira, é super normal. Me conta aqui o que tá pegando (é só responder esse email) que a gente te ajuda a destravar.
      </p>

      <!-- CTA principal — bulletproof button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(jornadasUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#10024; Continuar na jornada</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(jornadasUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              ✨ Continuar na jornada
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(jornadasUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(jornadasUrl)}</a>
      </div>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Próximo passo:</strong> M4 destrava em 7 dias (quando você entrar na Semana 2). Lá você aprende a estruturar conteúdo que converte de verdade. 🎯
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
