/**
 * Template WINBACK D+30 — mandado por cron pra alunas que cancelaram
 * há 30 dias. Tom casual, quase news: fala de "novidade" (jornada/conteúdo
 * novo) de forma genérica pra não precisar atualizar toda hora.
 *
 * CTA: metodotts.app/participar
 *
 * Estilo visual igual ao welcome.ts — hex colors (Outlook safe),
 * bulletproof MSO button, paleta rose/pink.
 */

type WinbackD30Input = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildWinbackD30Email(input: WinbackD30Input): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `${input.firstName}, novidade que talvez tu goste ✨`;

  const participarUrl = `${getSiteUrl()}/participar`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Faz um tempinho que a gente não se fala, então quis passar aqui rapidinho.`,
    ``,
    `Rolou novidade por aqui — aula nova, jornada nova, uns ajustes no método que deram um puta resultado com as meninas que tão dentro.`,
    ``,
    `Achei que talvez tu quisesse dar uma espiada. Sem pressão, sem papinho de venda.`,
    ``,
    `Se bater a curiosidade, é só entrar:`,
    `${participarUrl}`,
    ``,
    `Ah, e se preferir só responder esse email contando o que te fez sair, também ajuda demais. A gente lê tudo.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink hex (Outlook nao renderiza oklch/gradient sozinho).
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Novidade por aqui</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} ✨
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Faz um tempinho, né? Passei só pra te contar uma coisa.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Rolou novidade por aqui — <strong>aula nova, jornada nova</strong> e uns ajustes no método que deram um puta resultado com as meninas que tão dentro agora.
      </p>

      <p style="margin:0 0 18px;font-size:14.5px;color:#3a3a3f;">
        Achei que talvez tu quisesse dar uma espiada. Sem pressão, sem papinho de venda. 💕
      </p>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(participarUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">Dar uma espiada</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(participarUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Dar uma espiada ✨
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(participarUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(participarUrl)}</a>
      </div>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 4px;font-size:13.5px;color:#3a3a3f;">
        Se preferir só me responder esse email contando o que te fez sair, também ajuda demais — a gente lê tudo e ajusta com base no que vocês dizem. 🌹
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
