/**
 * Helpers pra derivar o status de uma live ao vivo a partir de starts_at e
 * ends_at. Frontend e backend usam.
 */

export type LiveStatus = "upcoming" | "live" | "replay";

export type LiveLike = {
  starts_at: string | Date;
  ends_at: string | Date | null;
  duration_minutes?: number | null;
};

/**
 * Janela de "ao vivo" quando ends_at não foi setado: 2 horas após o start
 * (suficiente pra maioria das lives).
 */
const DEFAULT_LIVE_WINDOW_MIN = 120;

export function getLiveStatus(event: LiveLike, now: Date = new Date()): LiveStatus {
  const starts = new Date(event.starts_at).getTime();
  const ends = event.ends_at
    ? new Date(event.ends_at).getTime()
    : starts + (event.duration_minutes ?? DEFAULT_LIVE_WINDOW_MIN) * 60_000;
  const t = now.getTime();
  if (t < starts) return "upcoming";
  if (t < ends) return "live";
  return "replay";
}

export function minutesUntil(startIso: string | Date, now: Date = new Date()): number {
  const start = new Date(startIso).getTime();
  return Math.round((start - now.getTime()) / 60_000);
}

export function formatCountdown(min: number): string {
  if (min <= 0) return "começando agora";
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m === 0 ? `em ${h}h` : `em ${h}h ${m}min`;
  const d = Math.floor(h / 24);
  return `em ${d} ${d === 1 ? "dia" : "dias"}`;
}
