/**
 * Configuração da Rotina Yara e helpers de cálculo de aderência.
 *
 * Single source of truth pros 11 itens da rotina + as metas. Usado por:
 *   - Form de check-in (/rotina/hoje)
 *   - Cálculo de % aderência (server + client)
 *   - Página de referência (/rotina/referencia)
 */

export type CheckinRow = {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD

  // A. Trabalho
  videos_posted: number;
  videos_recorded: number;
  live_chat_done: boolean;
  live_shop_done: boolean;
  analytics_done: boolean;
  comms_done: boolean;

  // B. Pessoal
  skincare_morning: boolean;
  skincare_night: boolean;
  supplementation: boolean;
  gym: boolean;
  sleep_hygiene: boolean;

  // C. Resultados (3 KPIs, opcionais)
  sales_brl: number | null;
  commission_brl: number | null;
  total_views: number | null;

  // D. Reflexão
  mood: Mood | null;
  energy_level: number | null; // 1-5
  notes: string | null;

  created_at?: string;
  updated_at?: string;
};

export type Mood = "great" | "good" | "okay" | "tough" | "rough";

export const MOOD_OPTIONS: Array<{ value: Mood; emoji: string; label: string }> = [
  { value: "great", emoji: "🤩", label: "Incrível" },
  { value: "good", emoji: "😊", label: "Bom" },
  { value: "okay", emoji: "😐", label: "Normal" },
  { value: "tough", emoji: "😔", label: "Difícil" },
  { value: "rough", emoji: "😫", label: "Péssimo" },
];

/** Metas diárias da rotina Yara — usadas pra calcular % aderência. */
export const YARA_GOALS = {
  videos_posted: 7,
  videos_recorded: 10,
} as const;

/** Itens BOOLEANOS da rotina Yara (cada um vale 1 ponto). */
export const BOOLEAN_ITEMS = [
  "live_chat_done",
  "live_shop_done",
  "analytics_done",
  "comms_done",
  "skincare_morning",
  "skincare_night",
  "supplementation",
  "gym",
  "sleep_hygiene",
] as const satisfies ReadonlyArray<keyof CheckinRow>;

/** Total de pontos máximos: 2 contadores (proporcionais) + 9 booleanos = 11 */
export const TOTAL_YARA_POINTS = 2 + BOOLEAN_ITEMS.length;

/**
 * Calcula % aderência à rotina Yara (0-100).
 *
 * Cada um dos 11 itens contribui até 1 ponto:
 *   - videos_posted/7  → min(ratio, 1) — proporcional
 *   - videos_recorded/10 → min(ratio, 1) — proporcional
 *   - 9 booleanos → 1 cada se true
 */
export function calcYaraAdherence(row: Partial<CheckinRow>): number {
  let points = 0;
  points += Math.min((row.videos_posted ?? 0) / YARA_GOALS.videos_posted, 1);
  points += Math.min((row.videos_recorded ?? 0) / YARA_GOALS.videos_recorded, 1);
  for (const key of BOOLEAN_ITEMS) {
    if (row[key]) points += 1;
  }
  return Math.round((points / TOTAL_YARA_POINTS) * 100);
}

/** Detecta se um check-in tem alguma atividade marcada (pra contar pro streak). */
export function isActiveCheckin(row: Partial<CheckinRow>): boolean {
  if ((row.videos_posted ?? 0) > 0) return true;
  if ((row.videos_recorded ?? 0) > 0) return true;
  for (const key of BOOLEAN_ITEMS) {
    if (row[key]) return true;
  }
  return false;
}

/** Cria um row vazio pro início do form. */
export function emptyCheckin(date: string): CheckinRow {
  return {
    date,
    videos_posted: 0,
    videos_recorded: 0,
    live_chat_done: false,
    live_shop_done: false,
    analytics_done: false,
    comms_done: false,
    skincare_morning: false,
    skincare_night: false,
    supplementation: false,
    gym: false,
    sleep_hygiene: false,
    sales_brl: null,
    commission_brl: null,
    total_views: null,
    mood: null,
    energy_level: null,
    notes: null,
  };
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD considerando timezone
 * de São Paulo (a aluna está no Brasil).
 */
export function todayBrazil(): string {
  const now = new Date();
  // Converte pra string no fuso BR e pega YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // en-CA dá YYYY-MM-DD
}

/** Formata data ISO pra exibição BR: 27/05/2026 */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Formata data ISO pra "Hoje" / "Ontem" / "27/mai" */
export function smartDateLabel(iso: string): string {
  const today = todayBrazil();
  if (iso === today) return "Hoje";

  // Calcula "ontem" no fuso BR
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (fmt.format(yesterday) === iso) return "Ontem";

  // Senão "27/mai"
  const [, m, d] = iso.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${d}/${months[parseInt(m, 10) - 1]}`;
}
