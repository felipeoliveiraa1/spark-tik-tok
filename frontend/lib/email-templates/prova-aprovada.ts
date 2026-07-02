/**
 * Template do email de PROVA APROVADA. Mandado quando POST /proof rola
 * com status = "auto_approved" ou "approved" — significa que a aluna
 * mandou a prova da primeira venda dela e foi validada.
 *
 * Momento super simbolico: ela virou oficialmente afiliada + destravou
 * os selos ELITE TTS, Afiliada e Consistente na jornada.
 *
 * Estilo: tom de celebracao maximo, muito rosa, muito 💕 ✨ 🎉.
 * Sem React Email pra manter bundle leve.
 */

type ProvaAprovadaInput = {
  firstName: string;
  /** Valor da venda detectada na prova (em BRL). Opcional — usa formatBRL. */
  salesValue?: number;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildProvaAprovadaEmail(
  input: ProvaAprovadaInput,
): { subject: string; text: string; html: string } {
  const hasValue = typeof input.salesValue === "number" && input.salesValue > 0;
  const valueLabel = hasValue ? formatBRL(input.salesValue as number) : null;

  const subject = `Aprovada! Voce eh oficialmente afiliada, ${input.firstName} 💕`;

  const jornadasUrl = `${getSiteUrl()}/jornadas`;

  const valueLineText = hasValue
    ? [
        `Detectamos sua venda de ${valueLabel} na prova. Parabéns demais! 🎉`,
        ``,
      ]
    : [];

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `A gente tem uma noticia MUITO especial pra te dar:`,
    ``,
    `SUA PROVA FOI APROVADA! 💕🎉`,
    ``,
    `Voce eh oficialmente afiliada do TikTok Shop. Isso nao eh pouca coisa — muita gente comeca e para no meio do caminho. Voce fez acontecer. ✨`,
    ``,
    ...valueLineText,
    `E olha só o que voce acabou de destravar na sua jornada:`,
    ``,
    `- Selo ELITE TTS 🏆 — as que fizeram acontecer de verdade`,
    `- Selo Afiliada 💼 — oficial no programa TikTok Shop`,
    `- Selo Consistente 🔥 — presenca que vira resultado`,
    ``,
    `Corre ver seus selos brilhando no perfil:`,
    `${jornadasUrl}`,
    ``,
    `Isso eh so o comeco. Agora a gente sobe o nivel — proximas vendas, mais selos, mais reconhecimento dentro da comunidade. 💕`,
    ``,
    `Muito orgulho de voce.`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink hex (Outlook nao le oklch/gradient sozinho).
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Prova aprovada</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Aprovada, ${escapeHtml(input.firstName)}! 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Voce eh <strong>oficialmente afiliada</strong> do TikTok Shop. ✨
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:15px;color:#3a3a3f;">
        A gente tem uma noticia MUITO especial pra te dar: <strong>sua prova foi aprovada!</strong> 🎉
      </p>

      <p style="margin:0 0 18px;font-size:14.5px;color:#3a3a3f;">
        Isso nao eh pouca coisa — muita gente comeca e para no meio do caminho. Voce fez acontecer. 💕
      </p>

      ${
        hasValue
          ? `<div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Venda detectada na prova</div>
        <div style="font-size:22px;font-weight:800;margin:4px 0 0;color:#1d1d1f;letter-spacing:-0.01em;">${escapeHtml(valueLabel as string)} 🎉</div>
      </div>`
          : ""
      }

      <h2 style="margin:20px 0 10px;font-size:15px;font-weight:700;color:#1d1d1f;">Selos que voce acabou de destravar:</h2>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:14px;color:#1d1d1f;margin:0 0 10px;">
          🏆 <strong>ELITE TTS</strong> — as que fizeram acontecer de verdade
        </div>
        <div style="font-size:14px;color:#1d1d1f;margin:0 0 10px;">
          💼 <strong>Afiliada</strong> — oficial no programa TikTok Shop
        </div>
        <div style="font-size:14px;color:#1d1d1f;margin:0;">
          🔥 <strong>Consistente</strong> — presenca que vira resultado
        </div>
      </div>

      <!-- CTA principal — bulletproof button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(jornadasUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#127942; Ver meus selos</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(jornadasUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              🏆 Ver meus selos
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(jornadasUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(jornadasUrl)}</a>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#3a3a3f;">
        Isso eh <strong>so o comeco</strong>. Agora a gente sobe o nivel — proximas vendas, mais selos, mais reconhecimento dentro da comunidade. 💕
      </p>

      <p style="margin:14px 0 0;font-size:14px;color:#3a3a3f;">
        Muito orgulho de voce. ✨
      </p>

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
