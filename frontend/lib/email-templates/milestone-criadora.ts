/**
 * Template do email de milestone Criadora. Mandado quando a aluna completa
 * M1+M2+M3 (Semana 1 inteira) e desbloqueia o selo "Criadora".
 *
 * Tom: celebratorio + convite pra Semana 2 (M4).
 * Estilo: HTML basico com paleta rose, mesmo layout do welcome.
 */

type MilestoneCriadoraInput = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildMilestoneCriadoraEmail(
  input: MilestoneCriadoraInput,
): { subject: string; text: string; html: string } {
  const jornadasUrl = `${getSiteUrl()}/jornadas`;

  const subject = `Voce eh Criadora agora, ${input.firstName} ✨`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Voce fechou a Semana 1 inteira — M1, M2 e M3.`,
    ``,
    `Isso significa que voce nao eh mais "aluna nova". Voce eh CRIADORA agora. ✨`,
    ``,
    `O selo Criadora acabou de aparecer no seu perfil. Ele fica ai como prova de que voce construiu a base do Metodo TTS:`,
    ``,
    `- Entendeu como escolher produto que vende`,
    `- Pegou o jeito do roteiro que engaja`,
    `- Ja mexeu no TikTok Shop com direcao`,
    ``,
    `Agora vem a Semana 2 (M4): a gente sai do "aprender" e entra no "vender de verdade".`,
    ``,
    `Bora?`,
    ``,
    `Link: ${jornadasUrl}`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Cores hex (Outlook/Hotmail nao renderizam oklch nem linear-gradient).
  // Outlook le SO a primeira propriedade `background`/`background-color`,
  // por isso colocamos sempre solid antes do gradient.
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Novo selo desbloqueado</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Voce eh Criadora agora ✨
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Oi ${escapeHtml(input.firstName)}, voce fechou a <strong>Semana 1 inteira</strong> — parabens 💕
      </p>
    </div>

    <div style="padding:24px 28px;">
      <!-- Badge card -->
      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:18px 16px;margin:0 0 20px;text-align:center;">
        <div style="font-size:44px;line-height:1;margin:0 0 8px;">✨</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Selo desbloqueado</div>
        <div style="font-size:20px;font-weight:800;margin:4px 0 0;color:#1d1d1f;letter-spacing:-0.01em;">Criadora</div>
        <div style="font-size:13px;color:#3a3a3f;margin:6px 0 0;">
          M1 + M2 + M3 concluidos — Semana 1 fechada
        </div>
      </div>

      <p style="margin:0 0 12px;font-size:14.5px;color:#3a3a3f;">
        Voce nao eh mais "aluna nova". Voce eh <strong>Criadora</strong> agora — construiu a base do Método TTS:
      </p>

      <ul style="margin:0 0 20px;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li>Entendeu como <strong>escolher produto</strong> que vende</li>
        <li>Pegou o jeito do <strong>roteiro</strong> que engaja</li>
        <li>Ja mexeu no <strong>TikTok Shop</strong> com direcao</li>
      </ul>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 20px;">
        <strong>Agora vem a Semana 2 (M4):</strong> a gente sai do "aprender" e entra no "vender de verdade". Bora?
      </div>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(jornadasUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#10024; Comecar a Semana 2</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(jornadasUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              ✨ Comecar a Semana 2
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto grande pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 20px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(jornadasUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(jornadasUrl)}</a>
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
