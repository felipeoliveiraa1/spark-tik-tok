/**
 * Templates de email pros eventos de ciclo de vida da assinatura.
 * Estilo igual ao welcome.ts: HTML simples + texto plain.
 */

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://spark-tik-tok-app.vercel.app";
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

type EmailParts = { subject: string; text: string; html: string };

/**
 * Layout HTML compartilhado entre todos os templates do plano.
 * `tone` muda o gradient/cor de destaque pra fit no evento.
 */
function buildPlanEmailHtml({
  firstName,
  heading,
  body,
  cta,
  tone = "brand",
}: {
  firstName: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  tone?: "brand" | "warn" | "bad";
}): string {
  const gradient =
    tone === "warn"
      ? "linear-gradient(135deg, oklch(0.78 0.16 65), oklch(0.65 0.18 55))"
      : tone === "bad"
        ? "linear-gradient(135deg, oklch(0.62 0.22 20), oklch(0.55 0.24 15))"
        : "linear-gradient(135deg, oklch(0.65 0.22 350), oklch(0.55 0.24 340))";

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:oklch(0.96 0.04 350);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl())}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background:${gradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Olá ${escapeHtml(firstName)}</div>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;">${escapeHtml(heading)}</h1>
    </div>
    <div style="padding:24px 28px;">
      ${body}
      ${
        cta
          ? `<a href="${escapeHtml(cta.href)}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,oklch(0.65 0.22 350),oklch(0.55 0.24 340));color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:18px 0 0;">${escapeHtml(cta.label)} →</a>`
          : ""
      }
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
}

// =================================================================
// Renovação OK
// =================================================================
export function buildPlanRenewedEmail({
  firstName,
  nextPayment,
}: {
  firstName: string;
  nextPayment: string | null;
}): EmailParts {
  const subject = `Renovamos seu plano, ${firstName} 💕`;
  const nextStr = nextPayment ? formatDate(nextPayment) : null;

  const text = [
    `Oi ${firstName}, tudo bem? ✨`,
    ``,
    `Sua assinatura do Método TTS foi renovada com sucesso. Continua liberadinha pra criar conteúdo que vende.`,
    nextStr ? `\nPróxima cobrança: ${nextStr}.` : "",
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const body = `
    <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
      Sua assinatura foi renovada com sucesso. Continua liberadinha pra criar conteúdo que vende. ✨
    </p>
    ${nextStr ? `<div style="margin:14px 0 0;padding:12px 14px;border-radius:12px;background:oklch(0.96 0.04 350);font-size:13.5px;color:#3a3a3f;">📅 <strong>Próxima cobrança:</strong> ${escapeHtml(nextStr)}</div>` : ""}
  `;
  const html = buildPlanEmailHtml({
    firstName,
    heading: "Renovamos seu plano 💕",
    body,
    cta: { label: "Abrir o app", href: `${getSiteUrl()}/` },
    tone: "brand",
  });

  return { subject, text, html };
}

// =================================================================
// Atrasado
// =================================================================
export function buildPlanLateEmail({ firstName }: { firstName: string }): EmailParts {
  const subject = `${firstName}, sua cobrança ficou pendente ⚠️`;
  const text = [
    `Oi ${firstName}, tudo bem? 💕`,
    ``,
    `A última cobrança da sua assinatura do Método TTS ficou pendente. Geralmente é só atualizar os dados do cartão pra resolver.`,
    ``,
    `Enquanto isso seu acesso continua liberado, mas se a cobrança não rolar nos próximos dias o acesso é cortado.`,
    ``,
    `Atualiza no Kiwify: ${getSiteUrl()}/conta`,
    ``,
    `Qualquer coisa, é só responder.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const body = `
    <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
      A última cobrança da sua assinatura ficou <strong>pendente</strong>. Geralmente é só atualizar os dados do cartão pra resolver.
    </p>
    <div style="margin:14px 0 0;padding:12px 14px;border-radius:12px;background:oklch(0.97 0.05 65);border:1px solid oklch(0.85 0.12 65);font-size:13.5px;color:#7c2d12;">
      ⚠️ Seu acesso continua liberado por enquanto. Se a cobrança não rolar nos próximos dias o acesso é cortado.
    </div>
  `;
  const html = buildPlanEmailHtml({
    firstName,
    heading: "Cobrança pendente ⚠️",
    body,
    cta: { label: "Atualizar pagamento", href: `${getSiteUrl()}/conta` },
    tone: "warn",
  });

  return { subject, text, html };
}

// =================================================================
// Cancelado
// =================================================================
export function buildPlanCanceledEmail({
  firstName,
  accessUntil,
}: {
  firstName: string;
  accessUntil: string | null;
}): EmailParts {
  const subject = `${firstName}, sua assinatura foi cancelada 💕`;
  const untilStr = accessUntil ? formatDate(accessUntil) : null;

  const text = [
    `Oi ${firstName}, tudo bem? 💕`,
    ``,
    `Confirmamos o cancelamento da sua assinatura do Método TTS.`,
    untilStr ? `\nVocê continua com acesso até ${untilStr} (período já pago).` : "",
    ``,
    `Se mudou de ideia, pode reativar quando quiser pelo checkout. Suas fichas de produto, scripts e histórico ficam guardadinhos.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const body = `
    <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
      Confirmamos o cancelamento da sua assinatura. Sentiremos sua falta 💕
    </p>
    ${untilStr ? `<div style="margin:14px 0 0;padding:12px 14px;border-radius:12px;background:oklch(0.96 0.04 350);font-size:13.5px;color:#3a3a3f;">📅 Você continua com acesso até <strong>${escapeHtml(untilStr)}</strong> (período já pago).</div>` : ""}
    <p style="margin:14px 0 0;font-size:13.5px;color:#3a3a3f;">
      Se mudou de ideia, pode reativar quando quiser. Suas fichas de produto, scripts e histórico ficam guardadinhos.
    </p>
  `;
  const html = buildPlanEmailHtml({
    firstName,
    heading: "Assinatura cancelada 💕",
    body,
    tone: "brand",
  });

  return { subject, text, html };
}

// =================================================================
// Reembolso
// =================================================================
export function buildPlanRefundedEmail({ firstName }: { firstName: string }): EmailParts {
  const subject = `${firstName}, processamos seu reembolso`;
  const text = [
    `Oi ${firstName}, tudo bem?`,
    ``,
    `Processamos seu reembolso da assinatura do Método TTS. O valor cai na fatura ou conta em alguns dias úteis (varia por banco).`,
    ``,
    `Seu acesso ao app foi encerrado.`,
    ``,
    `Se precisar de qualquer coisa, é só responder esse email.`,
    ``,
    `Equipe Método TTS`,
  ].join("\n");

  const body = `
    <p style="margin:0;font-size:14.5px;color:#3a3a3f;">
      Processamos seu reembolso. O valor cai na fatura ou conta em alguns dias úteis (varia por banco).
    </p>
    <div style="margin:14px 0 0;padding:12px 14px;border-radius:12px;background:oklch(0.97 0.04 20);border:1px solid oklch(0.85 0.12 20);font-size:13.5px;color:#7f1d1d;">
      Seu acesso ao app foi encerrado.
    </div>
  `;
  const html = buildPlanEmailHtml({
    firstName,
    heading: "Reembolso processado",
    body,
    tone: "bad",
  });

  return { subject, text, html };
}
