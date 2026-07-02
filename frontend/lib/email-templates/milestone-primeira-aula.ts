/**
 * Template de email de milestone: PRIMEIRA AULA COMPLETADA.
 *
 * Trigger: apos POST /lesson/[id]/complete quando eh a 1a aula da aluna
 * (ou seja, count de lessons completadas === 1).
 *
 * Tom: celebratorio, brand rosa, reforca habito, menciona o badge
 * "Iniciante" desbloqueado. CTA leva pra pagina de jornadas.
 *
 * Estilo: texto simples + HTML basico com cores rose. Mesmo padrao do
 * welcome.ts (sem React Email pra manter bundle leve).
 */

type MilestonePrimeiraAulaInput = {
  firstName: string;
  /** Titulo da aula que a aluna acabou de completar (opcional — se vier, aparece num destaque). */
  lessonTitle?: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildMilestonePrimeiraAulaEmail(
  input: MilestonePrimeiraAulaInput,
): { subject: string; text: string; html: string } {
  const subject = `Primeira aula feita, ${input.firstName} 🎉`;

  const jornadasUrl = `${getSiteUrl()}/jornadas`;

  const lessonLine = input.lessonTitle
    ? [`Aula concluida: ${input.lessonTitle}`, ``]
    : [];

  const text = [
    `Oi ${input.firstName}, tudo bem? ✨`,
    ``,
    `Voce acabou de terminar a sua PRIMEIRA aula no Metodo TTS. Que orgulho! 🎉`,
    ``,
    ...lessonLine,
    `E ja tem novidade: voce desbloqueou o selo INICIANTE 🌱`,
    `Ele aparece no seu perfil e marca o comeco da sua jornada aqui dentro.`,
    ``,
    `O segredo agora e nao parar. Uma aula por dia (mesmo que curtinha) ja te coloca na frente da maioria das criadoras. Consistencia > intensidade.`,
    ``,
    `Bora pra proxima?`,
    ``,
    `Link: ${jornadasUrl}`,
    ``,
    `Dica de ouro: separa 15 minutinhos no mesmo horario todo dia. O cerebro cria o habito sozinho depois de uns dias.`,
    ``,
    `Qualquer coisa, e so responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Metodo TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink em hex (Outlook nao renderiza oklch nem gradient sozinho —
  // sempre solid antes do gradient).
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
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Primeiro marco</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Primeira aula feita, ${escapeHtml(input.firstName)} 🎉
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Que orgulho ver voce aqui, dando o primeiro passo. 💕
      </p>
    </div>

    <div style="padding:24px 28px;">
      ${
        input.lessonTitle
          ? `<div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:12px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};">Aula concluída</div>
        <div style="font-size:15px;margin:4px 0 0;color:#1d1d1f;font-weight:600;">${escapeHtml(input.lessonTitle)}</div>
      </div>`
          : ""
      }

      <!-- Badge desbloqueado — destaque especial -->
      <div style="background-color:${brandLight};border:2px solid ${brandBorder};border-radius:16px;padding:18px 16px;margin:0 0 22px;text-align:center;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:6px;">Selo desbloqueado</div>
        <div style="font-size:32px;line-height:1;margin:4px 0 8px;">🌱</div>
        <div style="font-size:18px;font-weight:800;color:${brandDeep};letter-spacing:-0.01em;">Iniciante</div>
        <div style="font-size:13px;color:#3a3a3f;margin-top:6px;">
          Ja aparece no seu perfil marcando o comeco da sua jornada.
        </div>
      </div>

      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Agora o segredo e <strong>nao parar</strong>. Uma aula por dia (mesmo curtinha) ja te coloca na frente da maioria das criadoras. Consistencia bate intensidade sempre.
      </p>

      <!-- CTA principal — bulletproof button (renderiza em Outlook/spam) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(jornadasUrl)}" style="height:56px;v-text-anchor:middle;width:320px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">Bora pra proxima aula &#10024;</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(jornadasUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              Bora pra proxima aula ✨
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback: link em texto -->
      <div style="text-align:center;margin:0 0 22px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(jornadasUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(jornadasUrl)}</a>
      </div>

      <!-- Dica de habito -->
      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 8px;">
        <strong>Dica de ouro:</strong> separa 15 minutinhos no mesmo horario todo dia. O cerebro cria o habito sozinho depois de alguns dias — e ai vira automatico.
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
