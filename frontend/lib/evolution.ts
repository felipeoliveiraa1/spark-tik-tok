/**
 * Cliente Evolution API — envio de WhatsApp.
 *
 * Requer envs:
 *   - EVOLUTION_API_URL       (ex: https://evo2.server.sermelhor.site)
 *   - EVOLUTION_INSTANCE      (ex: metodotts)
 *   - EVOLUTION_API_KEY       (apikey global da instancia)
 *
 * Endpoint usado: POST {url}/message/sendText/{instance}
 *   Header: apikey: <key>
 *   Body: { number, text }
 */

export type SendWhatsAppInput = {
  /** Telefone com ou sem +/codigo pais. Normaliza pra digits-only. */
  phone: string;
  /** Texto WhatsApp (suporta *bold*, _italic_). */
  text: string;
};

export type SendWhatsAppResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

/**
 * Normaliza telefone pra formato Evo (digits-only, com codigo pais BR).
 *
 * Aceita:
 *   +5583991480495 → 5583991480495
 *   5583991480495  → 5583991480495
 *   (83) 99148-0495 → 5583991480495 (assume BR se 10-11 digitos)
 *   83991480495    → 5583991480495 (10-11 digitos sem 55)
 *
 * Retorna null se nao conseguiu normalizar.
 */
export function normalizePhoneBR(input: string): string | null {
  if (typeof input !== "string") return null;
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  // Se ja tem 12-13 digitos e comeca com 55, ja eh formato BR completo
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  // 10-11 digitos = DDD + numero sem codigo pais → adiciona 55
  if (d.length === 10 || d.length === 11) {
    d = `55${d}`;
    return d;
  }
  // Outros tamanhos: retorna se 12-13 digitos (assumindo internacional),
  // senao null.
  if (d.length >= 12 && d.length <= 14) return d;
  return null;
}

export async function sendWhatsApp(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_INSTANCE;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !instance || !apiKey) {
    return {
      ok: false,
      error: "EVOLUTION_API_URL / EVOLUTION_INSTANCE / EVOLUTION_API_KEY nao configurados",
    };
  }

  const number = normalizePhoneBR(input.phone);
  if (!number) {
    return { ok: false, error: `phone invalido: ${input.phone}` };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(instance)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data = (await res.json().catch(() => ({}))) as {
      key?: { id?: string };
      id?: string;
    };
    return { ok: true, id: data.key?.id ?? data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "erro desconhecido",
    };
  }
}
