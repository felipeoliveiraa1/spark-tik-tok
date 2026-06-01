/**
 * Templates WhatsApp pra ciclo de vida do plano.
 *
 * Markdown WhatsApp: *bold*, _italic_, ~strike~, ```mono```.
 */

type PlanReactivatedInput = {
  firstName: string;
  loginUrl: string;
  forgotUrl: string;
};

export function buildPlanReactivatedWhatsApp(input: PlanReactivatedInput): {
  text: string;
} {
  const text = [
    `Oi ${input.firstName}! 💕`,
    ``,
    `Seu plano no *Método TTS* foi reativado!`,
    ``,
    `🔗 Entrar: ${input.loginUrl}`,
    ``,
    `Pode usar a senha de sempre. Se não lembra, redefine aqui:`,
    `👉 ${input.forgotUrl}`,
    ``,
    `_Equipe Método TTS_ 🌹`,
  ].join("\n");

  return { text };
}
