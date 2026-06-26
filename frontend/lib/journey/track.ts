/**
 * Telemetria minima da feature Jornadas. Eventos vao via fetch fire-and-
 * forget pro endpoint /api/track (se existir) ou window.gtag/console
 * fallback. Sem PII.
 *
 * Uso:
 *   trackJourneyEvent('jornada_started', { journey_slug: 'jornada-1-bebe' })
 *   trackJourneyEvent('lesson_completed', { lesson_slug, xp_earned })
 *   trackJourneyEvent('badge_earned', { badge_slug })
 *   trackJourneyEvent('proof_uploaded', { status, sales_value })
 */

type Event =
  | { name: "jornada_started"; props: { journey_slug: string } }
  | { name: "lesson_viewed"; props: { journey_slug: string; lesson_slug: string } }
  | { name: "lesson_completed"; props: { journey_slug: string; lesson_slug: string; xp_earned: number } }
  | { name: "comment_posted"; props: { journey_slug: string; lesson_slug: string; is_reply: boolean } }
  | { name: "proof_uploaded"; props: { journey_slug: string; status: string; sales_value: number | null } }
  | { name: "badge_earned"; props: { badge_slug: string; rarity: string } }
  | { name: "level_up_seen"; props: { from_stage: string; to_stage: string } };

type AnyEvent = { name: string; props: Record<string, unknown> };

export function trackJourneyEvent<E extends Event>(name: E["name"], props: E["props"]): void {
  if (typeof window === "undefined") return;
  const payload: AnyEvent = { name: `journey.${name}`, props };
  // Tenta endpoint interno se existir (silencioso se 404)
  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
  // Fallback console em dev
  if (process.env.NODE_ENV !== "production") {
    console.debug("[track]", payload.name, payload.props);
  }
  // Google Analytics se houver
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") {
    try {
      w.gtag("event", payload.name, payload.props);
    } catch {
      // ignore
    }
  }
}
