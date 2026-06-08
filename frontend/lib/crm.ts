/**
 * Tipos e helpers compartilhados do CRM (frontend + backend).
 */

export const LEAD_STATUSES = [
  "novo",
  "contactado",
  "em_conversa",
  "agendado",
  "convertido",
  "perdido",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadEventKind =
  | "status_change"
  | "note"
  | "assigned"
  | "contact_attempt";

export const STATUS_META: Record<
  LeadStatus,
  { label: string; emoji: string; tone: "neutral" | "info" | "warn" | "good" | "bad" }
> = {
  novo: { label: "Novo", emoji: "✨", tone: "info" },
  contactado: { label: "Contactado", emoji: "📞", tone: "neutral" },
  em_conversa: { label: "Em conversa", emoji: "💬", tone: "warn" },
  agendado: { label: "Agendado", emoji: "📅", tone: "warn" },
  convertido: { label: "Convertido", emoji: "🎉", tone: "good" },
  perdido: { label: "Perdido", emoji: "💔", tone: "bad" },
};

export type Lead = {
  id: string;
  nome: string;
  telefone: string;
  tiktok_handle: string;
  already_selling: boolean;
  revenue_range: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  status: LeadStatus;
  admin_note: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  actor_name?: string | null;
  kind: LeadEventKind;
  payload: Record<string, unknown>;
  created_at: string;
};

export const REVENUE_LABELS: Record<string, string> = {
  ate_5k: "até 5k",
  de_5k_a_20k: "5k–20k",
  de_20k_a_50k: "20k–50k",
  acima_50k: "acima de 50k",
};

/**
 * Normaliza fone BR pra link WhatsApp (so digitos, com 55 prefix se faltar).
 */
export function phoneToWhatsAppLink(phone: string): string {
  const d = phone.replace(/\D/g, "");
  let normalized = d;
  if ((d.length === 10 || d.length === 11) && !d.startsWith("55")) {
    normalized = `55${d}`;
  }
  return `https://wa.me/${normalized}`;
}

export function tiktokProfileUrl(handle: string): string {
  const clean = handle.replace(/^@/, "").trim();
  return `https://www.tiktok.com/@${clean}`;
}
