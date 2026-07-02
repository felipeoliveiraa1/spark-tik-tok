/**
 * Template do email de prova pendente. Mandado quando a aluna envia uma prova
 * de execução e o OCR não bateu confiança > 90% — a prova cai numa fila de
 * revisão manual e precisa ser conferida por um humano.
 *
 * Tom: profissional, tranquilizador. Sem urgência, sem celebração.
 * Objetivo: confirmar recebimento, dar prazo (24h) e tirar ansiedade.
 * CTA: nenhum principal. Link secundário opcional pro hub /jornadas pra
 * aluna continuar navegando enquanto espera.
 */

type ProvaPendenteInput = {
  firstName: string;
  /** Nome/rótulo da tarefa da prova (ex: "Publicar 1 vídeo no TikTok Shop"). Opcional. */
  taskLabel?: string;
};

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

export function buildProvaPendenteEmail(
  input: ProvaPendenteInput,
): { subject: string; text: string; html: string } {
  const jornadasUrl = `${getSiteUrl()}/jornadas`;

  // Sem emoji no subject — a aluna está esperando um veredito, não uma festa.
  const subject = `${input.firstName}, recebemos sua prova — revisamos em até 24h`;

  const taskLine = input.taskLabel
    ? `Tarefa: ${input.taskLabel}`
    : null;

  const text = [
    `Oi ${input.firstName}, tudo bem?`,
    ``,
    `Recebemos a prova que você enviou. Está tudo certo — ela entrou na nossa fila de revisão.`,
    ...(taskLine ? [``, taskLine] : []),
    ``,
    `Nossa equipe confere manualmente em até 24 horas. Assim que aprovarmos, você recebe um email com o resultado e o próximo passo da sua jornada é liberado automaticamente.`,
    ``,
    `Não precisa reenviar nem fazer nada agora — está tudo em ordem, é só aguardar.`,
    ``,
    `Enquanto isso, você pode continuar navegando pelas aulas e materiais do hub:`,
    `${jornadasUrl}`,
    ``,
    `Qualquer coisa, é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const logoUrl = `${getSiteUrl()}/tts-logo-horizontal.png`;

  // Paleta rose/pink hex (Outlook não renderiza oklch/gradient sozinho —
  // sempre solid ANTES do gradient).
  const brandSolid = "#db2777"; // pink 600
  const brandLight = "#fce7f3"; // pink 100
  const brandBorder = "#fbcfe8"; // pink 200
  const brandDeep = "#9d174d"; // pink 800
  const brandGradient = `linear-gradient(135deg,#ec4899,${brandSolid})`;

  // Cinza neutro pra box de status "aguardando" — não é warn (laranja),
  // não é success (verde). É informativo/tranquilo.
  const neutralBg = "#f5f5f7";
  const neutralBorder = "#e5e5ea";
  const neutralText = "#3a3a3f";
  const neutralLabel = "#6e6e73";

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background-color:${brandLight};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="Método TTS" width="180" style="max-width:180px;height:auto;display:inline-block;" />
    </div>
    <div style="padding:8px 28px 24px;background-color:${brandSolid};background:${brandGradient};color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#fff;">Prova recebida</div>
      <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
        Oi ${escapeHtml(input.firstName)} ⏳
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;color:#fff;">
        Recebemos sua prova. Nossa equipe revisa em até <strong>24h</strong>.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Está tudo certo. Sua prova entrou na fila de revisão manual — nossa equipe confere pessoalmente pra garantir que fica registrado direitinho no seu progresso.
      </p>

      <div style="background-color:${neutralBg};border:1px solid ${neutralBorder};border-radius:14px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${neutralLabel};">Status</div>
        <div style="font-size:15px;font-weight:600;margin:4px 0 12px;color:${neutralText};">Aguardando revisão manual</div>
        ${
          input.taskLabel
            ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${neutralLabel};">Tarefa</div>
        <div style="font-size:14px;margin:4px 0 12px;color:${neutralText};">${escapeHtml(input.taskLabel)}</div>`
            : ""
        }
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${neutralLabel};">Prazo de resposta</div>
        <div style="font-size:14px;margin:4px 0 0;color:${neutralText};">Até 24 horas</div>
      </div>

      <p style="margin:0 0 14px;font-size:14.5px;color:#3a3a3f;">
        Assim que a revisão for concluída, você recebe um email com o resultado e o próximo passo da sua jornada é liberado automaticamente.
      </p>

      <p style="margin:0 0 20px;font-size:14px;color:${neutralLabel};">
        Não precisa reenviar nada nem tomar nenhuma ação agora — é só aguardar.
      </p>

      <div style="background-color:${brandLight};border:1px solid ${brandBorder};border-radius:12px;padding:14px 16px;margin:0 0 18px;">
        <div style="font-size:13.5px;color:#3a3a3f;margin:0 0 8px;">
          Enquanto espera, você pode continuar navegando pelas aulas e materiais do hub:
        </div>
        <a href="${escapeHtml(jornadasUrl)}" style="color:${brandDeep};font-weight:700;text-decoration:underline;font-size:14px;">
          Abrir o hub Jornadas →
        </a>
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
