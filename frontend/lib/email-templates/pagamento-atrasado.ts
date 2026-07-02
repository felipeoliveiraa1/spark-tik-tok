/**
 * Template de email — Pagamento em atraso (subscription_late).
 *
 * Trigger: webhook Kiwify `subscription_late` ou cron que detecta
 * cobrança recorrente que falhou. Aponta pra URL de atualização de
 * cartão (checkout Kiwify direto).
 *
 * Tom: warm, sem culpa, sem urgência agressiva. "Psiu, teu pagamento
 * não passou — bora resolver rapidinho." Não ameaça cortar acesso.
 *
 * CTA: input.updateUrl (link Kiwify de atualização de cartão)
 */

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoUrl(): string {
  return `${getSiteUrl()}/tts-logo-horizontal.png`;
}

type PagamentoAtrasadoInput = {
  firstName: string;
  /** URL do checkout / atualização de cartão. Aponta pra Kiwify link direto. */
  updateUrl: string;
  /** Dias desde a falha do pagamento. Opcional — se vier, entra no copy. */
  daysLate?: number;
};

export function buildPagamentoAtrasadoEmail(input: PagamentoAtrasadoInput): {
  subject: string;
  text: string;
  html: string;
} {
  const { firstName, updateUrl, daysLate } = input;

  const showDaysLine = typeof daysLate === "number" && daysLate >= 3;
  const daysLineText = showDaysLine
    ? `Faz ${daysLate} dias que estamos tentando — enquanto isso teu acesso segue liberado, mas rola atualizar quando puder ✨`
    : null;

  // ---------- SUBJECT ----------
  const subject = `Seu pagamento não passou, ${firstName} 💕`;

  // ---------- TEXT plain ----------
  const text = [
    `Oi ${firstName}, tudo bem?`,
    ``,
    `Passando pra te avisar — teu pagamento do Método TTS não passou dessa vez. Pode ser cartão vencido, limite ou só instabilidade mesmo.`,
    ``,
    `Bora resolver rapidinho? Clica no botão abaixo, atualiza o cartão e teu acesso volta na hora.`,
    ``,
    ...(daysLineText ? [daysLineText, ``] : []),
    `Atualizar cartão:`,
    `${updateUrl}`,
    ``,
    `Qualquer dúvida, responde esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  // ---------- HTML ----------
  const brandSolid = "#db2777"; // pink 600
  const brandLight = "#fce7f3"; // pink 100
  const brandBorder = "#fbcfe8"; // pink 200
  const brandDeep = "#9d174d"; // pink 800
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  const daysHtml = daysLineText
    ? `
      <div style="margin:16px 0 0;padding:14px 16px;border-radius:14px;background:${brandLight};border:1px solid ${brandBorder};font-size:13.5px;color:#3a3a3f;">
        ${escapeHtml(daysLineText)}
      </div>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:${brandLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl())}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background-color:${brandSolid};background:${brandGradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Psiu, um alô rápido</div>
      <h1 style="margin:6px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;color:#fff;">Seu pagamento não passou 💕</h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">Oi ${escapeHtml(firstName)} — bora resolver rapidinho?</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
        Passando pra te avisar — teu pagamento do Método TTS <strong>não passou dessa vez</strong>. Pode ser cartão vencido, limite ou só instabilidade mesmo.
      </p>
      <p style="margin:14px 0 0;font-size:14.5px;color:#3a3a3f;">
        Bora resolver rapidinho? Clica no botão abaixo, atualiza o cartão e teu acesso volta na hora.
      </p>
      ${daysHtml}
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(updateUrl)}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="${brandSolid}" fillcolor="${brandSolid}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;">Atualizar cartão →</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${escapeHtml(updateUrl)}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background-color:${brandSolid};background:${brandGradient};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:18px 0 0;">Atualizar cartão →</a>
      <!--<![endif]-->
      <p style="margin:12px 0 0;font-size:12.5px;color:#86868b;text-align:center;">
        Link direto: <a href="${escapeHtml(updateUrl)}" style="color:${brandDeep};text-decoration:underline;">${escapeHtml(updateUrl)}</a>
      </p>
      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Qualquer dúvida, responde esse email.
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br /><strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
