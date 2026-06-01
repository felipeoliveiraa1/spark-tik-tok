/**
 * Template WhatsApp de boas-vindas. Mandado em paralelo com o email
 * welcome quando uma compra Kiwify aprova OU quando admin cria conta
 * manualmente.
 *
 * Markdown WhatsApp: *bold*, _italic_, ~strike~, ```mono```.
 */

type WelcomeWhatsAppInput = {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export function buildWelcomeWhatsApp(input: WelcomeWhatsAppInput): { text: string } {
  const text = [
    `Oi ${input.firstName}! 💕`,
    ``,
    `Bem-vinda ao *Método TTS*! Sua conta tá pronta:`,
    ``,
    `🔗 ${input.loginUrl}`,
    `📧 *Email:* ${input.email}`,
    `🔑 *Senha temporária:* ${input.temporaryPassword}`,
    ``,
    `Na primeira entrada o app te pede pra criar uma senha só sua (leva 10s) — depois é só usar à vontade.`,
    ``,
    `_Equipe Método TTS_ 🌹✨`,
  ].join("\n");

  return { text };
}
