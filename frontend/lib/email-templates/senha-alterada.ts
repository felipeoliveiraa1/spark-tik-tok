/**
 * Template do email de confirmação de senha alterada.
 * Mandado após a aluna concluir o fluxo /reset-password com sucesso
 * (ou trocar a senha manualmente pela tela de conta).
 *
 * Tom: profissional, informativo, sem festa. Serve como registro de segurança —
 * comunica o quê + quando + de onde (IP mascarado), e dá saída clara caso
 * não tenha sido a aluna (responder o email).
 */

type SenhaAlteradaInput = {
  firstName: string;
  /** Email da conta que teve a senha alterada (também o destinatário). */
  email: string;
  /**
   * Momento da alteração já formatado em PT-BR (ex: "02/07/2026 às 14:32 (horário de Brasília)").
   * Formatação fica com quem chama — o template só imprime.
   */
  changedAt: string;
  /**
   * IP de origem da requisição já mascarado (ex: "189.45.xxx.xxx" ou "2804:14d:xxxx::xxxx").
   * Se null/undefined, a linha do IP some do email.
   */
  ipMasked?: string | null;
  /**
   * User agent / dispositivo simplificado (ex: "Chrome no iPhone", "Safari no Mac").
   * Opcional — quando presente aparece junto do IP pra dar mais contexto.
   */
  device?: string | null;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildSenhaAlteradaEmail(
  input: SenhaAlteradaInput
): { subject: string; text: string; html: string } {
  const siteUrl = getSiteUrl();
  const contaUrl = `${siteUrl}/conta`;

  // Subject: neutro/profissional, sem emoji brand (💕/🌹) — é comunicado de segurança.
  // Check simples (✓) reforça "deu certo, é só confirmação" sem virar festa.
  const subject = `Senha alterada com sucesso ✓`;

  const hasIp = typeof input.ipMasked === "string" && input.ipMasked.length > 0;
  const hasDevice = typeof input.device === "string" && (input.device ?? "").length > 0;

  // Linha combinada IP + device pro plain text
  const originLineText = hasIp
    ? hasDevice
      ? `Origem: ${input.ipMasked} — ${input.device}`
      : `Origem: ${input.ipMasked}`
    : null;

  const text = [
    `Oi ${input.firstName}, tudo bem?`,
    ``,
    `Confirmamos que a senha da sua conta no Método TTS foi alterada.`,
    ``,
    `Conta: ${input.email}`,
    `Quando: ${input.changedAt}`,
    ...(originLineText ? [originLineText] : []),
    ``,
    `Se foi você, pode ignorar esse email — é só um registro de segurança.`,
    ``,
    `SE NÃO FOI VOCÊ: responde esse email agora mesmo que a gente bloqueia o acesso e ajuda a recuperar a conta. Também recomendamos trocar a senha de novo por uma nova em ${contaUrl}.`,
    ``,
    `Equipe Método TTS`,
  ].join("\n");

  const logoUrl = `${siteUrl}/tts-logo-horizontal.png`;

  // Paleta rose padrão (mantida pra brand consistency), mas hero usa tom mais sério —
  // eyebrow "SEGURANÇA DA CONTA" + h1 curto + subline factual, sem "bora"/"💕".
  const brandSolid = "#db2777"; // pink 600
  const brandLight = "#fce7f3"; // pink 100 (body bg + info card)
  const brandBorder = "#fbcfe8"; // pink 200
  const brandDeep = "#9d174d"; // pink 800 (labels + links)
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  // Bloco condicional: linha "Origem" no info card
  const originHtml = hasIp
    ? `
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-top:12px;">Origem</div>
        <div style="font-size:14px;margin:4px 0 0;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;word-break:break-all;">${escapeHtml(input.ipMasked ?? "")}${
          hasDevice ? ` <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#3a3a3f;">— ${escapeHtml(input.device ?? "")}</span>` : ""
        }</div>`
    : "";

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
        Senha alterada com sucesso
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        A senha da sua conta no <strong>Método TTS</strong> foi atualizada.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14.5px;color:#3a3a3f;">
        Oi ${escapeHtml(input.firstName)}, esse é um registro de segurança da alteração de senha da sua conta. Confere os detalhes abaixo:
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Conta</div>
        <div style="font-size:14px;margin:4px 0 12px;color:#1d1d1f;font-family:'SF Mono',ui-monospace,monospace;word-break:break-all;">${escapeHtml(input.email)}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Quando</div>
        <div style="font-size:14px;margin:4px 0 0;color:#1d1d1f;">${escapeHtml(input.changedAt)}</div>${originHtml}
      </div>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Não foi você?</strong> Responde esse email agora mesmo que a gente bloqueia o acesso e ajuda a recuperar a conta. Recomendamos também trocar a senha de novo pra uma nova em <a href="${escapeHtml(contaUrl)}" style="color:#9a3412;font-weight:700;text-decoration:underline;">metodotts.app/conta</a>.
      </div>

      <p style="margin:0 0 6px;font-size:13.5px;color:#3a3a3f;">
        Se foi você, pode ignorar esse email — é só um registro de segurança pra sua tranquilidade.
      </p>

      <!-- CTA secundário: acessar a conta. Bulletproof pra Outlook. -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 8px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(contaUrl)}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Ir para minha conta</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(contaUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:1;padding:14px 26px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Ir para minha conta
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Qualquer coisa suspeita, é só responder esse email — a gente age rápido.
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
