/**
 * Template do email de boas-vindas. Mandado quando a aluna paga na Kiwify
 * e a conta é criada com senha temporária.
 *
 * Estilo: texto simples + HTML básico com cores rose. Sem React Email pra
 * manter o bundle leve.
 */

type WelcomeInput = {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  /** Quando > 0, monta mensagem de trial (acesso gratuito limitado). */
  trialDays?: number;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildWelcomeEmail(input: WelcomeInput): { subject: string; text: string; html: string } {
  const isTrial = (input.trialDays ?? 0) > 0;
  const subject = isTrial
    ? `${input.firstName}, ganhou ${input.trialDays} dias grátis no Método TTS ✨`
    : `Bem-vinda ao Método TTS, ${input.firstName} 💕`;

  const trialBanner = isTrial
    ? [
        ``,
        `🎁 ACESSO LIBERADO POR ${input.trialDays} DIAS:`,
        `Você foi convidada pra experimentar o Método TTS de graça. Use tudo à vontade nesse período.`,
        ``,
        `Quando o teste acabar, é só assinar pela Kiwify pra continuar — seu histórico (produtos, scripts, conversas) fica salvo, você só renova o acesso.`,
        ``,
      ]
    : [];

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    isTrial
      ? `Sua conta no Método TTS foi criada com acesso gratuito de ${input.trialDays} dias.`
      : `Sua conta no Método TTS foi criada. Estamos super felizes de te ter aqui!`,
    ...trialBanner,
    `Pra entrar pela primeira vez:`,
    ``,
    `Email: ${input.email}`,
    `Senha temporária: ${input.temporaryPassword}`,
    ``,
    `Link de acesso: ${input.loginUrl}`,
    ``,
    `IMPORTANTE: Na primeira vez que entrar, vamos te pedir pra criar uma senha nova — a temporária não funciona depois.`,
    ``,
    `Dentro do app você tem:`,
    `- Análise de produto com foto (Informação)`,
    `- Roteiros completos de TikTok (Scripts) — gancho, desenvolvimento, benefício e CTA`,
    `- Aulas e lives ao vivo`,
    `- Suporte tira-dúvidas sobre TikTok Shop`,
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
  const brandSolid = "#db2777"; // pink 600 (proximo do oklch(0.55 0.24 340))
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Bem-vinda</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Sua conta no <strong>Método TTS</strong> foi criada. Bora começar?
      </p>
    </div>

    <div style="padding:24px 28px;">
      ${
        isTrial
          ? `<div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:14px 16px;margin:0 0 16px;font-size:13.5px;color:#78350f;">
        <div style="font-weight:700;margin-bottom:4px;">🎁 ${input.trialDays} dias grátis</div>
        Você ganhou ${input.trialDays} dias de acesso completo. Quando o teste acabar, é só assinar pela Kiwify pra continuar — seu histórico fica salvo.
      </div>`
          : ""
      }

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(input.loginUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#10024; Entrar no Método TTS</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(input.loginUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              ✨ Entrar no Método TTS
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto grande pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(input.loginUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(input.loginUrl)}</a>
      </div>

      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Pra entrar pela primeira vez, usa essas credenciais:
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Email</div>
        <div style="font-size:14px;margin:4px 0 12px;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;word-break:break-all;">${escapeHtml(input.email)}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Senha temporária</div>
        <div style="font-size:16px;font-weight:700;margin:4px 0 0;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;letter-spacing:0.02em;">${escapeHtml(input.temporaryPassword)}</div>
      </div>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Importante:</strong> Na primeira vez que entrar, vamos te pedir pra criar uma senha nova — a temporária não funciona depois.
      </div>

      <h2 style="margin:20px 0 8px;font-size:15px;font-weight:700;color:#1d1d1f;">O que tem lá dentro:</h2>
      <ul style="margin:0;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li><strong>Informação</strong> — analisa seu produto com foto</li>
        <li><strong>Scripts</strong> — 5 roteiros prontos com gancho, desenvolvimento, benefício e CTA</li>
        <li><strong>Aulas e lives</strong> da Yara</li>
        <li><strong>Tira-dúvidas</strong> sobre TikTok Shop</li>
      </ul>

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

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
