/**
 * Template do email de winback D+3.
 *
 * Disparado por cron 3 dias apos o cancelamento da assinatura
 * (plan_status='canceled' AND plan_canceled_at BETWEEN now-3d AND now-3d-1h).
 *
 * Objetivo: reengajar sem oferta ainda. Tom soft, empatico, feedback loop
 * (pergunta o que aconteceu). CTA leve pra pagina de participar.
 *
 * Estilo: mesmo do welcome.ts — paleta rose hex, sem gradient oklch,
 * bulletproof button pra renderizar em Outlook/spam.
 */

type WinbackD3Input = {
  firstName: string;
  /** Email da aluna, usado como reply-to hint no texto. */
  replyEmail?: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildWinbackD3Email(input: WinbackD3Input): { subject: string; text: string; html: string } {
  const subject = `Sentimos tua falta, ${input.firstName} 💕`;

  const participarUrl = `${getSiteUrl()}/participar`;

  const text = [
    `Oi ${input.firstName}, tudo bem? 💕`,
    ``,
    `Aqui é a equipe do Método TTS. Faz uns dias que voce saiu da assinatura e eu queria muito saber: o que aconteceu?`,
    ``,
    `Nao eh cobranca, prometo. So quero entender de verdade — pra gente melhorar o que precisa melhorar.`,
    ``,
    `Se puder responder esse email em 1 ou 2 linhas ja ajuda demais:`,
    ``,
    `- Foi o preco?`,
    `- Nao teve tempo de aplicar?`,
    `- Faltou alguma coisa dentro do app?`,
    `- Ja vendeu e nao precisa mais?`,
    `- Outro motivo?`,
    ``,
    `Qualquer resposta serve. Ate um "nao curti" cru.`,
    ``,
    `Se em algum momento quiser voltar, a porta continua aberta — teu historico (fichas, scripts, conversas) fica salvo:`,
    `${participarUrl}`,
    ``,
    `Mas de novo: sem pressa, sem pressao. So um oi de volta ja faz o dia.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose hex — Outlook/Hotmail nao renderiza oklch.
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Sentimos tua falta</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Faz uns dias que voce saiu. Da pra bater um papo rapidinho?
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Aqui é a equipe do <strong>Método TTS</strong>. Nao eh cobranca, prometo — so quero entender de verdade o que aconteceu pra gente melhorar o que precisa melhorar.
      </p>

      <p style="margin:0 0 12px;font-size:14.5px;color:#3a3a3f;">
        Se puder responder esse email em 1 ou 2 linhas ja ajuda demais. Algum desses motivos?
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#1d1d1f;line-height:1.8;">
          <li>Foi o <strong>preço</strong>?</li>
          <li>Não teve <strong>tempo</strong> de aplicar?</li>
          <li>Faltou alguma coisa <strong>dentro do app</strong>?</li>
          <li>Já <strong>vendeu</strong> e não precisa mais?</li>
          <li>Outro motivo?</li>
        </ul>
      </div>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13.5px;color:#9a3412;margin:0 0 18px;">
        Qualquer resposta serve — até um <em>"não curti"</em> cru. Prometo que leio todas.
      </div>

      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        E se em algum momento quiser voltar, a porta continua aberta — teu histórico (fichas, scripts, conversas) fica guardadinho:
      </p>

      <!-- CTA soft — bulletproof button, sem oferta especial -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(participarUrl)}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Ver como voltar</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(participarUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;line-height:1;padding:16px 28px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Ver como voltar
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:0 0 20px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(participarUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(participarUrl)}</a>
      </div>

      <p style="margin:0;font-size:13.5px;color:#3a3a3f;">
        Mas de novo: <strong>sem pressa, sem pressão</strong>. Só um oi de volta já faz o dia.
      </p>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        É só responder esse email — chega direto na gente.
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
