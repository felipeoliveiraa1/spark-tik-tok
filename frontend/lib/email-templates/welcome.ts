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
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildWelcomeEmail(input: WelcomeInput): { subject: string; text: string; html: string } {
  const subject = `Bem-vinda ao Método TTS, ${input.firstName} 💕`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Sua conta no Método TTS foi criada. Estamos super felizes de te ter aqui!`,
    ``,
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
    `- Aulas e lives da Yara`,
    `- Suporte tira-dúvidas sobre TikTok Shop`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:oklch(0.96 0.04 350);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background:linear-gradient(135deg,oklch(0.65 0.22 350),oklch(0.55 0.24 340));color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Bem-vinda</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">
        Oi ${escapeHtml(input.firstName)} 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;">
        Sua conta no <strong>Método TTS</strong> foi criada. Bora começar?
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14.5px;color:#3a3a3f;">
        Pra entrar pela primeira vez, usa essas credenciais:
      </p>

      <div style="background:oklch(0.96 0.04 350);border:1px solid oklch(0.92 0.04 350);border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:oklch(0.5 0.22 345);">Email</div>
        <div style="font-size:14px;margin:4px 0 12px;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;">${escapeHtml(input.email)}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:oklch(0.5 0.22 345);">Senha temporária</div>
        <div style="font-size:15px;font-weight:700;margin:4px 0 0;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;">${escapeHtml(input.temporaryPassword)}</div>
      </div>

      <a href="${escapeHtml(input.loginUrl)}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,oklch(0.65 0.22 350),oklch(0.55 0.24 340));color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:0 0 18px;">
        Entrar no Método TTS →
      </a>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
