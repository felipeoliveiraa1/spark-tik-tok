/**
 * Template winback D+14. Enviado por cron para alunas que cancelaram
 * ha ~14 dias. Oferta: 50% off no primeiro mes de renovacao (R$49 -> R$24,50).
 *
 * Tom: leve, sem culpa, sem pressao. Mostra o valor da volta + cupom claro
 * + reforca que os dados dela ficaram salvos (destrava fricção de reentrada).
 * CTA aponta pro checkout Kiwify normal — o cupom eh configurado no Kiwify
 * separado (nao passamos aqui, so mostramos o codigo pra ela colar).
 */

type WinbackD14Input = {
  firstName: string;
  /**
   * Codigo do cupom Kiwify (ex: "VOLTA50"). Aparece pra aluna copiar.
   * Default: "VOLTA50".
   */
  couponCode?: string;
  /**
   * URL do checkout Kiwify (mesmo link do Metodo TTS normal).
   * Default: metodotts.app/participar.
   */
  checkoutUrl?: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildWinbackD14Email(input: WinbackD14Input): { subject: string; text: string; html: string } {
  const couponCode = input.couponCode ?? "VOLTA50";
  const checkoutUrl = input.checkoutUrl ?? `${getSiteUrl()}/participar`;

  const subject = `${input.firstName}, bora voltar com 50% off? 💕`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Faz umas duas semanas que voce cancelou e a gente ficou pensando em voce por aqui.`,
    ``,
    `Se rolar de voltar, separei uma condicao especial: 50% off no primeiro mes.`,
    ``,
    `R$49 vira R$24,50 no proximo mes.`,
    `Depois volta ao valor normal (R$49/mes) — e voce cancela quando quiser.`,
    ``,
    `Cupom: ${couponCode}`,
    `Link: ${checkoutUrl}`,
    ``,
    `Cola o cupom na hora do checkout que o desconto entra automatico.`,
    ``,
    `E fica tranquila: suas fichas de produto, scripts salvos e historico continuam guardadinhos aqui. Assim que voltar, ta tudo do jeitinho que voce deixou.`,
    ``,
    `Qualquer coisa, e so responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Metodo TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Uma oferta pra voce</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Bora voltar pro <strong>Método TTS</strong> com 50% off no primeiro mês?
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Faz umas duas semanas que voce cancelou e a gente ficou pensando em voce por aqui. Se rolar de voltar, separei uma condição especial:
      </p>

      <!-- Highlight de preco -->
      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:16px 18px;margin:0 0 18px;text-align:center;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:6px;">Primeiro mês com 50% off</div>
        <div style="font-size:14px;color:#86868b;text-decoration:line-through;margin-bottom:2px;">R$49,00</div>
        <div style="font-size:32px;font-weight:800;color:${brandDeep};letter-spacing:-0.02em;line-height:1.1;">R$24,50</div>
        <div style="font-size:12.5px;color:#3a3a3f;margin-top:8px;">Depois volta pro valor normal (R$49/mês) — e você cancela quando quiser.</div>
      </div>

      <!-- Cupom -->
      <div style="background-color:${brandLight};border:1px dashed ${brandSolid};border-radius:14px;padding:14px 16px;margin:0 0 18px;text-align:center;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:6px;">Seu cupom</div>
        <div style="font-size:22px;font-weight:800;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;letter-spacing:0.08em;">${escapeHtml(couponCode)}</div>
        <div style="font-size:12px;color:#86868b;margin-top:6px;">Cola no checkout que o desconto entra automático.</div>
      </div>

      <!-- CTA principal — bulletproof button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(checkoutUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#128149; Voltar com 50% off</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(checkoutUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              💕 Voltar com 50% off
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(checkoutUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(checkoutUrl)}</a>
      </div>

      <!-- Reforco de valor: dados preservados -->
      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Suas coisas continuam aqui:</strong> fichas de produto, scripts salvos e histórico ficaram guardadinhos. Assim que voltar, tá tudo do jeitinho que você deixou.
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
