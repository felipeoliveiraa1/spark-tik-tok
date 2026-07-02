/**
 * Template de email — Aviso de renovação em 3 dias.
 *
 * Trigger: cron diário. Dispara pra assinantes ativos cujo
 * `plan_next_payment` cai entre `now + 3d` e `now + 3d + 1h`.
 *
 * Tom: profissional, transparente. Sem drama. Só avisa que a
 * cobrança recorrente de R$49 vai rolar no cartão em 3 dias
 * e aponta pra /conta caso queira atualizar o cartão antes.
 */

type RenewalIn3DaysInput = {
  firstName: string;
  /** ISO string da data da próxima cobrança (plan_next_payment). */
  nextPayment: string;
};

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function buildRenewalIn3DaysEmail(input: RenewalIn3DaysInput): {
  subject: string;
  text: string;
  html: string;
} {
  const { firstName, nextPayment } = input;
  const dateStr = formatDate(nextPayment);
  const accountUrl = `${getSiteUrl()}/conta`;

  const subject = `Sua renovação é em 3 dias, ${firstName}`;

  const text = [
    `Oi ${firstName}, tudo bem?`,
    ``,
    `Passando só pra avisar: sua assinatura do Método TTS renova em 3 dias.`,
    ``,
    `Data: ${dateStr}`,
    `Valor: R$ 49,00`,
    `Método: cartão de crédito cadastrado (cobrança automática)`,
    ``,
    `Não precisa fazer nada. A cobrança roda sozinha no cartão que você usou na compra e o acesso continua liberado sem interrupção.`,
    ``,
    `Se o cartão trocou, venceu ou você quer usar outro, dá pra atualizar por aqui antes da cobrança:`,
    `${accountUrl}`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const brandLight = "#fce7f3"; // pink 100
  const brandBorder = "#fbcfe8"; // pink 200
  const brandSolid = "#db2777"; // pink 600
  const brandDeep = "#9d174d"; // pink 800
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:${brandLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl())}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background-color:${brandSolid};background:${brandGradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Aviso de renovação</div>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;color:#fff;">Sua renovação é em 3 dias</h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">Oi ${escapeHtml(firstName)} — passando só pra avisar antes da cobrança rodar.</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
        Sua assinatura do Método TTS renova daqui a 3 dias. Não precisa fazer nada — a cobrança roda automática no cartão cadastrado e o acesso continua liberado sem interrupção.
      </p>

      <div style="margin:18px 0 0;padding:16px 18px;border-radius:14px;background:${brandLight};border:1px solid ${brandBorder};font-size:13.5px;color:#3a3a3f;">
        <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${brandDeep};font-weight:700;">Detalhes da cobrança</div>
        <div style="margin-top:10px;line-height:1.7;">
          <div><strong>Data:</strong> ${escapeHtml(dateStr)}</div>
          <div><strong>Valor:</strong> R$ 49,00</div>
          <div><strong>Método:</strong> cartão cadastrado (recorrência automática)</div>
        </div>
      </div>

      <p style="margin:18px 0 0;font-size:14px;color:#3a3a3f;">
        Se o cartão trocou, venceu ou você quer trocar pra outro, dá pra atualizar antes da cobrança:
      </p>

      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(accountUrl)}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="50%" strokecolor="${brandSolid}" fillcolor="${brandSolid}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;">Atualizar cartão →</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${escapeHtml(accountUrl)}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background-color:${brandSolid};background:${brandGradient};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:14px 0 0;">Atualizar cartão →</a>
      <!--<![endif]-->

      <p style="margin:12px 0 0;font-size:12.5px;color:#86868b;text-align:center;">
        Link direto: <a href="${escapeHtml(accountUrl)}" style="color:${brandDeep};text-decoration:underline;">${escapeHtml(accountUrl)}</a>
      </p>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Qualquer coisa, é só responder esse email.
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
