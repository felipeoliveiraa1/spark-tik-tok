/**
 * Tracking server-side: heartbeat (last_seen_at) + user_events.
 *
 * Heartbeat — atualiza profiles.last_seen_at quando a aluna acessa o app.
 * Throttle de 5 minutos via cache em memoria pra evitar UPDATE em cada
 * request RSC. O cache nao precisa ser persistente: se zerar entre
 * deploys, a unica consequencia eh fazer um UPDATE a mais por aluna.
 *
 * Eventos — escreve em public.user_events. Fire-and-forget (sem await
 * obrigatorio); se falhar, swallowa o erro e loga no console pra nao
 * quebrar o fluxo principal. Use em endpoints/server actions.
 *
 * Como instrumentar:
 *   import { trackEvent, heartbeat } from "@/lib/track";
 *   await trackEvent(userId, "product_create", { product_id: id });
 *   heartbeat(userId);  // sem await: dispara em background
 */

import { createClient } from "@supabase/supabase-js";

const HEARTBEAT_TTL_MS = 5 * 60 * 1000; // 5 min

// Cache em memoria por processo. Em serverless edge cada lambda tem seu
// proprio cache, mas mesmo assim economiza > 90% dos UPDATEs porque a
// mesma aluna normalmente bate no mesmo container algumas vezes.
const lastSeenCache = new Map<string, number>();

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("Supabase service env vars ausentes");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Marca a aluna como ativa AGORA. Idempotente, com throttle de 5min em
 * memoria. Use em rotas server (RSC layout, server actions) sempre que
 * tiver um userId em maos.
 *
 * Nao bloqueia — retorna void. Eventuais erros sao logados mas nao
 * propagam (heartbeat falhar nao deve quebrar a pagina).
 */
export function heartbeat(userId: string): void {
  if (!userId) return;
  const now = Date.now();
  const last = lastSeenCache.get(userId);
  if (last && now - last < HEARTBEAT_TTL_MS) return;

  // Marca cache imediatamente pra absorver chamadas em paralelo
  lastSeenCache.set(userId, now);

  // Dispara UPDATE em background
  void (async () => {
    try {
      const supabase = getServiceClient();
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date(now).toISOString() })
        .eq("id", userId);
    } catch (err) {
      console.error("[heartbeat] falhou", err);
      // remove do cache pra tentar de novo na proxima
      lastSeenCache.delete(userId);
    }
  })();
}

/**
 * Insere um evento na timeline da aluna. Nao bloqueia o fluxo principal
 * (errors sao swallowed e logados).
 *
 * Eventos canonicos atuais:
 *   - login                  metadata: {}
 *   - routine_check          metadata: { habit_id?: string, all_done?: bool }
 *   - product_create         metadata: { product_id, name, category }
 *   - product_save_from_text metadata: { product_id, source: 'cola_rapida' }
 *   - script_generate        metadata: { product_id, style }
 *   - script_save_from_text  metadata: { script_id, source: 'cola_rapida' }
 *   - lesson_view            metadata: { lesson_id, module_slug }
 *   - lesson_complete        metadata: { lesson_id }
 *   - live_join              metadata: { live_id }
 *   - cola_rapida_use        metadata: { product_saved, scripts_saved }
 *   - revenue_save           metadata: { year_month, amount_brl }
 *   - install_pwa            metadata: { platform: 'ios'|'android'|'desktop' }
 *   - tour_complete          metadata: { tour: 'home'|'educacao'|'ranking' }
 *   - whatsapp_send          metadata: { template: 'welcome'|'plan' }
 *   - feedback_submit        metadata: { type: 'bug'|'suggestion' }
 *
 * Pra adicionar um novo: so chamar com o nome em snake_case + metadata
 * relevante. Nao precisa atualizar enum nem schema.
 */
export async function trackEvent(
  userId: string,
  event: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!userId || !event) return;
  try {
    const supabase = getServiceClient();
    await supabase.from("user_events").insert({
      user_id: userId,
      event,
      metadata,
    });
  } catch (err) {
    console.error("[trackEvent] falhou", event, err);
  }
}
