/**
 * Template do email de milestone "Boss Fight liberado".
 *
 * Trigger: aluna concluiu todos os modulos da Jornada 1 (Bebe) e o M4
 * foi destravado (all_modules_complete). E a prova final: mandar print
 * de vendas pra virar Vendedora e desbloquear proxima fase.
 *
 * Tom: bosstoso, motivador, energia de arena. Deixa claro que ela ja
 * fez o dificil (estudo) — agora e so mostrar o resultado (print).
 *
 * Estilo: mesma paleta rose/pink do welcome/plan, com destaque especial
 * pra o "troféu" do Boss Fight. Sem citar mes/ano nem "Yara" como
 * qualificador do metodo.
 */

type MilestoneBossFightReadyInput = {
  firstName: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildMilestoneBossFightReadyEmail(
  input: MilestoneBossFightReadyInput,
): { subject: string; text: string; html: string } {
  const subject = `Chegou a hora da prova, ${input.firstName} 🏆`;

  const ctaUrl = `${getSiteUrl()}/jornadas/jornada-1-bebe/prova`;

  const text = [
    `Oi ${input.firstName}, tudo bem? 🏆`,
    ``,
    `Voce concluiu TODOS os modulos da Jornada. Levantou cedo, estudou,`,
    `absorveu o Metodo TTS inteirinho. Agora chegou a hora da prova.`,
    ``,
    `O que e o Boss Fight:`,
    `Um unico desafio final pra provar que o Metodo funciona na sua mao —`,
    `basta enviar o print das suas vendas no TikTok Shop.`,
    ``,
    `E so isso. Sem redacao, sem checklist gigante, sem enrolacao.`,
    `Print. Envio. Aprovada. Selo de Vendedora liberado. 🏆`,
    ``,
    `Como funciona:`,
    `- Abre a tela da prova`,
    `- Anexa o print das vendas (painel do TikTok Shop)`,
    `- A gente valida em ate 48h`,
    `- Voce vira Vendedora oficial e destrava a proxima fase`,
    ``,
    `Link da prova: ${ctaUrl}`,
    ``,
    `Voce ja fez a parte dificil. A parte dificil foi estudar tudo ate aqui.`,
    `Agora e so colher. Bora fechar essa jornada com chave de ouro?`,
    ``,
    `Qualquer coisa, e so responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Metodo TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink hex — mesma do welcome/plan (Outlook nao le oklch).
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
    <div style="padding:8px 28px 28px;background-color:${brandSolid};background:${brandGradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Boss Fight liberado</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Chegou a hora da prova, ${escapeHtml(input.firstName)} 🏆
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Voce concluiu <strong>todos os modulos</strong>. Agora e so mostrar o resultado.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:14px;padding:16px 18px;margin:0 0 20px;text-align:center;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${brandDeep};margin-bottom:6px;">Desafio final</div>
        <div style="font-size:18px;font-weight:800;color:#1d1d1f;line-height:1.35;">
          🏆 Envie o print das suas vendas no TikTok Shop
        </div>
        <div style="font-size:13.5px;color:#3a3a3f;margin-top:8px;">
          Print. Envio. Aprovada. Selo de <strong>Vendedora</strong> liberado.
        </div>
      </div>

      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Voce levantou cedo, estudou, absorveu o <strong>Método TTS</strong> inteirinho.
        Agora chegou a hora da prova — e ela e mais simples do que parece.
      </p>

      <!-- CTA principal — bulletproof button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 12px;">
        <tr>
          <td align="center" style="padding:0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(ctaUrl)}" style="height:56px;v-text-anchor:middle;width:340px;" arcsize="50%" stroke="f" fillcolor="${brandSolid}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;">&#127942; Fazer a prova agora</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${escapeHtml(ctaUrl)}" style="background-color:${brandSolid};background:${brandGradient};border:2px solid ${brandSolid};border-radius:999px;color:#ffffff !important;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;line-height:1;padding:18px 32px;text-align:center;text-decoration:none !important;mso-hide:all;">
              🏆 Fazer a prova agora
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <!-- Fallback link -->
      <div style="text-align:center;margin:0 0 22px;font-size:13px;color:#86868b;">
        ou copia esse link no navegador:<br />
        <a href="${escapeHtml(ctaUrl)}" style="color:${brandDeep};font-weight:700;word-break:break-all;text-decoration:underline;">${escapeHtml(ctaUrl)}</a>
      </div>

      <h2 style="margin:8px 0 10px;font-size:15px;font-weight:700;color:#1d1d1f;">Como funciona:</h2>
      <ul style="margin:0 0 18px;padding:0 0 0 20px;font-size:13.5px;color:#3a3a3f;line-height:1.7;">
        <li>Abre a tela da prova</li>
        <li>Anexa o <strong>print</strong> das vendas (painel do TikTok Shop)</li>
        <li>A gente valida em ate <strong>48h</strong></li>
        <li>Voce vira <strong>Vendedora</strong> oficial e destrava a proxima fase</li>
      </ul>

      <div style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;font-size:13.5px;color:#9a3412;margin:0 0 8px;">
        <strong>Sem redacao. Sem checklist gigante. Sem enrolacao.</strong><br />
        A parte dificil ja foi — estudar. Agora e so colher. 🔥
      </div>

      <p style="margin:20px 0 0;font-size:14px;color:#1d1d1f;font-weight:600;">
        Bora fechar essa jornada com chave de ouro? 🏆
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
