/**
 * Template do email ONBOARDING D+14. Mandado 14 dias após a aluna começar
 * a Jornada 1 (Bebê), no dia em que o Módulo 4 (Semana 2) desbloqueia.
 *
 * Tom: energizado, celebratório. A Semana 2 abriu = ela chegou lá, bora pegar
 * o momentum. Assume que a aluna já terminou M1 + M2 + M3 (mas reforça sem
 * dedo apontado caso ainda esteja atrasada).
 *
 * Regras de conteúdo:
 * - NUNCA citar mês/ano/data do treino
 * - "Método TTS" pro método; "Yara" só como nome da mentora (aulas/lives)
 * - Assinatura fixa "Beijos, Equipe Método TTS 🌹"
 */

type OnboardingD14Input = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildOnboardingD14Email(input: OnboardingD14Input): { subject: string; text: string; html: string } {
  const siteUrl = getSiteUrl();
  const jornadaUrl = `${siteUrl}/jornadas/jornada-1-bebe`;

  const subject = `${input.firstName}, Semana 2 abriu — pega o momentum 🔥`;

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Passaram 2 semanas desde que você começou a Jornada 1 (Bebê) — e hoje o Módulo 4 (Semana 2) desbloqueou pra você. 🔥`,
    ``,
    `A parte boa: aluna que fecha a Semana 2 tem quase o dobro de chance de bater a primeira venda. É aqui que o método começa a virar rotina de verdade.`,
    ``,
    `Link direto pra Jornada 1: ${jornadaUrl}`,
    ``,
    `O que você libera nessa Semana 2:`,
    `- Aulas novas com aplicação prática (não é só teoria)`,
    `- Checklist da semana pra você marcar o que já fez`,
    `- Selos novos pra desbloquear conforme evolui`,
    ``,
    `IMPORTANTE: Se ainda não terminou os Módulos 1, 2 e 3, dá uma olhada neles antes — a Semana 2 assume que você já tem a base pronta.`,
    ``,
    `Uma dica: reserva 20 minutos por dia só pra Jornada. É pouco, cabe em qualquer rotina, e é o que separa quem vende de quem só assiste.`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${siteUrl}/tts-logo-horizontal.png`;

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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Semana 2 desbloqueada</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} 🔥
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Módulo 4 da <strong>Jornada 1 (Bebê)</strong> abriu — bora pegar o momentum?
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Passaram 2 semanas desde que você começou a Jornada, e hoje um bloco novo desbloqueou pra você. ✨
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Por que essa semana importa</div>
        <div style="font-size:14px;margin:6px 0 0;color:#1d1d1f;">
          Aluna que <strong>fecha a Semana 2</strong> tem quase o dobro de chance de bater a primeira venda. É aqui que o Método TTS começa a virar rotina de verdade.
        </div>
      </div>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(jornadaUrl)}" style="height:56px;v-text-anchor:middle;width:340px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#128293; Abrir a Semana 2</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(jornadaUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              🔥 Abrir a Semana 2
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto grande pra caso botao nao renderize -->
      <div style="text-align:center;margin:0 0 24px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(jornadaUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(jornadaUrl)}</a>
      </div>

      <h2 style="margin:20px 0 8px;font-size:15px;font-weight:700;color:#1d1d1f;">O que abriu pra você agora:</h2>
      <ul style="margin:0;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li><strong>Aulas novas</strong> — aplicação prática, não é só teoria</li>
        <li><strong>Checklist da semana</strong> — marca o que já fez e mede evolução</li>
        <li><strong>Selos novos</strong> — mais conquistas pra desbloquear no caminho</li>
        <li><strong>Aulas e lives</strong> da Yara pra tirar dúvida no ao vivo</li>
      </ul>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:18px 0 16px;">
        <strong>Antes de começar:</strong> se ainda não fechou os Módulos 1, 2 e 3, dá uma passada rápida neles — a Semana 2 assume que você já tem a base pronta.
      </div>

      <p style="margin:0 0 4px;font-size:14px;color:#3a3a3f;">
        <strong>Uma dica de ouro:</strong> reserva 20 minutos por dia só pra Jornada.
      </p>
      <p style="margin:0;font-size:13.5px;color:#3a3a3f;">
        É pouco, cabe em qualquer rotina, e é o que separa quem vende de quem só assiste. 💕
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
