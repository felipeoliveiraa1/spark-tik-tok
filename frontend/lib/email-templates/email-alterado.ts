/**
 * Template do email "Novo email confirmado". Disparado pro EMAIL NOVO
 * logo apos a aluna trocar o email de acesso.
 *
 * Tom: profissional/seguranca. Confirma a troca, mostra o email antigo
 * mascarado parcialmente (ex: j***@***.com) e o novo em destaque, com
 * aviso "se nao foi voce" apontando pro suporte.
 *
 * Estilo: mesmo esqueleto de welcome.ts — texto simples + HTML basico
 * com paleta rose/pink hex (Outlook nao renderiza oklch/gradient sozinho).
 */

type EmailAlteradoInput = {
  firstName: string;
  /** Email antigo (sera mascarado antes de exibir). */
  oldEmail: string;
  /** Email novo confirmado (aparece em destaque). */
  newEmail: string;
  /** Link pro app / area logada. */
  loginUrl: string;
  /** Link/mailto pro suporte, usado no aviso "se nao foi voce". */
  supportUrl: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

/**
 * Mascara parcial do email antigo. Mantem so a 1a letra do local-part
 * e o TLD final; o resto vira `***`.
 *
 * Exemplos:
 *   joana@gmail.com     -> j***@***.com
 *   ana.silva@yahoo.br  -> a***@***.br
 *   x@dominio.co.uk     -> x***@***.uk
 *
 * Se o email vier malformado, devolve `***` como fallback seguro.
 */
function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const firstChar = local.charAt(0);
  const lastDot = domain.lastIndexOf(".");
  const tld = lastDot >= 0 ? domain.slice(lastDot) : "";
  return `${firstChar}***@***${tld}`;
}

export function buildEmailAlteradoEmail(input: EmailAlteradoInput): { subject: string; text: string; html: string } {
  const oldEmailMasked = maskEmail(input.oldEmail);

  const subject = `${input.firstName}, novo email confirmado`;

  const text = [
    `Oi ${input.firstName}, tudo bem?`,
    ``,
    `Confirmamos a troca do email de acesso da sua conta no Método TTS.`,
    ``,
    `Email anterior: ${oldEmailMasked}`,
    `Email novo (esse aqui): ${input.newEmail}`,
    ``,
    `A partir de agora, use esse email pra entrar no app. Sua senha continua a mesma.`,
    ``,
    `Link de acesso: ${input.loginUrl}`,
    ``,
    `SE NÃO FOI VOCÊ:`,
    `Se você não pediu essa troca, fale com o suporte imediatamente pra gente reverter o acesso e proteger sua conta.`,
    `Suporte: ${input.supportUrl}`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Equipe Método TTS`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Cores hex (Outlook/Hotmail nao renderizam oklch nem linear-gradient).
  // Outlook le SO a primeira propriedade `background`/`background-color`,
  // por isso colocamos sempre solid antes do gradient.
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Segurança da conta</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Novo email confirmado ✓
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Olá ${escapeHtml(input.firstName)}, a troca do email de acesso da sua conta foi concluída.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        A partir de agora, use o email abaixo pra entrar no <strong>Método TTS</strong>. Sua senha continua a mesma.
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Email anterior</div>
        <div style="font-size:14px;margin:4px 0 12px;color:#86868b;font-family:'SF Mono',ui-monospace,monospace;word-break:break-all;text-decoration:line-through;">${escapeHtml(oldEmailMasked)}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Email novo</div>
        <div style="font-size:16px;font-weight:700;margin:4px 0 0;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;word-break:break-all;">${escapeHtml(input.newEmail)}</div>
      </div>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(input.loginUrl)}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">Entrar no app</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(input.loginUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Entrar no app
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(input.loginUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(input.loginUrl)}</a>
      </div>

      <!-- Aviso "se nao foi voce" — tom alerta profissional -->
      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <div style="font-weight:700;margin-bottom:4px;">Se não foi você</div>
        Se você não pediu essa troca de email, fale com o suporte agora pra reverter o acesso e proteger sua conta.<br />
        <a href="${escapeHtml(input.supportUrl)}" style="color:#9a3412;font-weight:700;text-decoration:underline;">Falar com o suporte</a>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Qualquer coisa, é só responder esse email.
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#86868b;">
        <strong>Equipe Método TTS</strong>
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
