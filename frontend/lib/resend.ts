import { Resend } from "resend";

/**
 * Cliente Resend lazy. Só instancia quando precisa enviar.
 *
 * Requer:
 *   - RESEND_API_KEY (chave da conta Resend)
 *   - RESEND_FROM_EMAIL (ex: "Método TTS <ola@seudominio.com.br>" — precisa
 *     ter o domínio verificado no painel da Resend)
 */
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export type SendEmailInput = {
  to: string;
  subject: string;
  /** Versão texto. Sempre obrigatório (clientes que não renderizam HTML). */
  text: string;
  /** Versão HTML (opcional). */
  html?: string;
  /** Tags pra rastrear no dashboard Resend. */
  tags?: Array<{ name: string; value: string }>;
};

export async function sendEmail(input: SendEmailInput): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY não configurada" };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { ok: false, error: "RESEND_FROM_EMAIL não configurado" };
  }

  try {
    const result = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      tags: input.tags,
    });
    if (result.error) {
      return { ok: false, error: result.error.message ?? "Erro no Resend" };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return { ok: false, error: msg };
  }
}
