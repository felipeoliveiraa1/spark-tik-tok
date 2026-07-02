/**
 * Template de email — Lembrete de renovação D-1 (amanhã tem cobrança).
 *
 * Trigger: cron diário. Dispara pra quem tem `plan_next_payment` entre
 * `now + 1d` e `now + 1d + 1h`.
 *
 * Tom: warm reminder, mais casual que o 3d — quase um "psiu, só um alô rápido".
 * Sem drama, sem urgência de alerta. Não é cobrança pendente, é só aviso amigo.
 *
 * CTA: metodotts.app/conta
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
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

function formatCurrencyBRL(cents: number | null | undefined): string | null {
  if (cents == null || Number.isNaN(cents)) return null;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  } catch {
    return null;
  }
}

type Renewal1dInput = {
  firstName: string;
  /** ISO da data de cobrança (amanhã). Usado no destaque 📅. */
  nextPayment: string | null;
  /** Valor da cobrança em centavos. Opcional — só entra se vier. */
  amountCents?: number | null;
  /** Últimos 4 dígitos do cartão. Opcional — só entra se vier. */
  cardLast4?: string | null;
};

export function buildRenewal1dEmail(input: Renewal1dInput): {
  subject: string;
  text: string;
  html: string;
} {
  const { firstName, nextPayment, amountCents, cardLast4 } = input;

  const nextStr = nextPayment ? formatDate(nextPayment) : null;
  const amountStr = formatCurrencyBRL(amountCents ?? null);
  const cardStr = cardLast4 ? `final ${cardLast4}` : null;

  // ---------- SUBJECT ----------
  const subject = `Amanhã tem cobrança ${firstName ? `, ${firstName}` : ""} 💕`.replace(
    " , ",
    ", ",
  );

  // ---------- TEXT plain ----------
  const detailsLines: string[] = [];
  if (nextStr) detailsLines.push(`Data: ${nextStr}`);
  if (amountStr) detailsLines.push(`Valor: ${amountStr}`);
  if (cardStr) detailsLines.push(`Cartão: ${cardStr}`);

  const text = [
    `Oi ${firstName}, tudo bem? 💕`,
    ``,
    `Só um alô rápido pra te avisar: amanhã rola a renovação da sua assinatura do Método TTS. ✨`,
    ``,
    `Nada pra fazer, tá? Se o cartão tiver certinho, roda no automático e você segue liberadinha pra criar conteúdo que vende.`,
    ``,
    ...(detailsLines.length > 0 ? [detailsLines.join(" · "), ``] : []),
    `Se quiser dar uma conferida no cartão antes, é rapidinho:`,
    `${getSiteUrl()}/conta`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  // ---------- HTML ----------
  // Paleta rose/pink solid hex (Outlook-safe) + gradient como enhancement.
  const brandSolid = "#db2777"; // pink 600
  const brandLight = "#fce7f3"; // pink 100
  const brandBorder = "#fbcfe8"; // pink 200
  const brandDeep = "#9d174d"; // pink 800
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  const ctaHref = `${getSiteUrl()}/conta`;

  const detailsHtml =
    detailsLines.length > 0
      ? `
      <div style="margin:16px 0 0;padding:14px 16px;border-radius:14px;background:${brandLight};border:1px solid ${brandBorder};font-size:13.5px;color:#3a3a3f;">
        ${
          nextStr
            ? `<div style="margin:0;"><span style="display:inline-block;min-width:70px;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;color:${brandDeep};font-weight:700;">Data</span> <strong>${escapeHtml(nextStr)}</strong></div>`
            : ""
        }
        ${
          amountStr
            ? `<div style="margin:6px 0 0;"><span style="display:inline-block;min-width:70px;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;color:${brandDeep};font-weight:700;">Valor</span> <strong>${escapeHtml(amountStr)}</strong></div>`
            : ""
        }
        ${
          cardStr
            ? `<div style="margin:6px 0 0;"><span style="display:inline-block;min-width:70px;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;color:${brandDeep};font-weight:700;">Cartão</span> <strong>${escapeHtml(cardStr)}</strong></div>`
            : ""
        }
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Lembrete rápido</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;color:#fff;">Amanhã tem cobrança 💕</h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">Só um alô rápido, ${escapeHtml(firstName)} ✨</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
        Amanhã rola a renovação da sua assinatura do Método TTS. <strong>Nada pra fazer, viu?</strong> Se o cartão tiver certinho, roda no automático e você segue liberadinha pra criar conteúdo que vende.
      </p>
      ${detailsHtml}
      <p style="margin:18px 0 0;font-size:14px;color:#3a3a3f;">
        Se quiser dar uma conferida no cartão antes, é rapidinho:
      </p>
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(ctaHref)}" style="height:46px;v-text-anchor:middle;width:280px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;">Conferir meu cartão &rarr;</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${escapeHtml(ctaHref)}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background-color:${brandSolid};background:${brandGradient};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:14px 0 0;">Conferir meu cartão &rarr;</a>
      <!--<![endif]-->
      <p style="margin:10px 0 0;font-size:12.5px;color:#86868b;text-align:center;">
        <a href="${escapeHtml(ctaHref)}" style="color:${brandDeep};text-decoration:underline;">${escapeHtml(ctaHref)}</a>
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
