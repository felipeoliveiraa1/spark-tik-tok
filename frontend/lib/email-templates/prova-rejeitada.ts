/**
 * Template do email de prova rejeitada. Mandado quando a mentora/admin
 * marca uma prova de venda com status='rejected' na Jornada 1 (Bebê).
 *
 * Tom: gentil, sem culpa. Dá dicas de print (nitidez, mostrar valor total,
 * sem cortes) pra aluna reenviar sem drama. Sem vermelho, sem "erro" —
 * usa paleta brand rose pra não punir.
 */

type ProvaRejeitadaInput = {
  firstName: string;
  /** Motivo específico da rejeição (opcional). Ex: "não deu pra ver o valor". */
  reason?: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildProvaRejeitadaEmail(input: ProvaRejeitadaInput): { subject: string; text: string; html: string } {
  const subject = `${input.firstName}, precisamos ver outro print 💕`;

  const reenvioUrl = `${getSiteUrl()}/jornadas/jornada-1-bebe/prova`;

  const reasonBlockText = input.reason
    ? [
        ``,
        `Motivo dessa vez: ${input.reason}`,
        ``,
      ]
    : [];

  const text = [
    `Oi ${input.firstName}, tudo bem? 💕`,
    ``,
    `Dei uma olhada no print que você mandou e infelizmente não deu pra confirmar a venda por aqui — precisamos de outro print.`,
    ``,
    `Sem stress, acontece! É só reenviar seguindo essas dicas rapidinhas:`,
    ...reasonBlockText,
    `Dicas pra o print passar de primeira:`,
    ``,
    `- Nitidez: print inteiro, sem borrão nem foto da tela com o celular`,
    `- Valor total da venda aparecendo claramente`,
    `- Sem cortes: data, produto e status "pago/aprovado" visíveis`,
    `- Direto do app do TikTok Shop (Seller Center), não recorte editado`,
    ``,
    `Link pra reenviar: ${reenvioUrl}`,
    ``,
    `Assim que o novo print chegar, revejo e libero sua prova.`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink em hex — Outlook/Hotmail não renderizam oklch nem gradient
  // sozinhos, sempre solid ANTES do gradient. Sem vermelho: tom gentil, sem culpa.
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Prova de venda</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Precisamos de outro print pra confirmar sua venda.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Dei uma olhada no print que você mandou e infelizmente não deu pra confirmar a venda por aqui. <strong>Sem stress, acontece!</strong> É só reenviar seguindo essas dicas rapidinhas 💕
      </p>

      ${
        input.reason
          ? `<div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Motivo dessa vez</div>
        <div style="font-size:14px;margin:6px 0 0;color:#1d1d1f;">${escapeHtml(input.reason)}</div>
      </div>`
          : ""
      }

      <h2 style="margin:6px 0 10px;font-size:15px;font-weight:700;color:#1d1d1f;">Dicas pra o print passar de primeira:</h2>
      <ul style="margin:0 0 20px;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li><strong>Nitidez</strong> — print inteiro, sem borrão nem foto da tela com o celular</li>
        <li><strong>Valor total</strong> da venda aparecendo claramente</li>
        <li><strong>Sem cortes</strong> — data, produto e status "pago/aprovado" visíveis</li>
        <li><strong>Direto do app</strong> do TikTok Shop (Seller Center), não recorte editado</li>
      </ul>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(reenvioUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">Reenviar meu print</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(reenvioUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Reenviar meu print
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto grande pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 20px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(reenvioUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(reenvioUrl)}</a>
      </div>

      <p style="margin:0;font-size:13.5px;color:#3a3a3f;">
        Assim que o novo print chegar, revejo e libero sua prova. ✨
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
