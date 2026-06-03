/**
 * Helpers das campanhas de WhatsApp:
 *
 *   - pickInstanceForUser  → sticky routing + round-robin com daily_limit
 *   - pickNextMotivational → escolhe template_key da biblioteca 365 que a
 *                            aluna ainda nao recebeu (loop infinito)
 *   - enqueueOutbox        → grava 1 linha pending na whatsapp_outbox
 *   - flushOutbox          → cron processa pending: chama Evo, marca status
 *   - canSendNow           → respeita janela 8h-22h BRT
 *
 * Toda funcao usa supabase com SERVICE_ROLE_KEY (operacao server-side).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  MOTIVATIONAL_LIBRARY,
  renderMotivational,
  type MotivationalEntry,
} from "@/lib/whatsapp-templates/motivational";
import { normalizePhoneBR } from "@/lib/evolution";

// =================================================================
// CONSTANTES
// =================================================================

// Cadencia entre envios do MESMO blast — evita ban Evo. 4-6s eh seguro.
export const BLAST_INTERVAL_MS = 4_500;

// Limite global por aluna por janela de 7 dias — evita spam.
export const WEEKLY_MSG_LIMIT_PER_USER = 3;

// Window de horario (Brasilia) em que crons podem enviar.
export const HOUR_OPEN_BRT = 8;
export const HOUR_CLOSE_BRT = 22;

// =================================================================
// SERVICE CLIENT
// =================================================================

export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Supabase service env vars ausentes");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// =================================================================
// JANELA DE HORARIO
// =================================================================

/**
 * Hora atual em BRT (UTC-3, sem horario de verao).
 */
function hourBRT(now: Date = new Date()): number {
  // BRT = UTC-3
  const utcHour = now.getUTCHours();
  return (utcHour - 3 + 24) % 24;
}

export function canSendNow(now: Date = new Date()): boolean {
  const h = hourBRT(now);
  return h >= HOUR_OPEN_BRT && h < HOUR_CLOSE_BRT;
}

// =================================================================
// INSTANCIAS (sticky routing + round-robin)
// =================================================================

type Instance = {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  priority: number;
  daily_limit: number;
  purpose: string;
};

/**
 * Retorna a instancia que deve mandar mensagem pra essa aluna:
 *   1. Se profiles.whatsapp_instance_id ja existe (sticky) — usa ela
 *      mesmo se outras estiverem livres. Garante que aluna sempre recebe
 *      do mesmo numero.
 *   2. Se ainda nao tem sticky, escolhe via round-robin: ativa + purpose
 *      compativel + menor priority + menor uso hoje.
 *
 * NAO grava a sticky aqui — quem chama eh quem decide quando fixar.
 * (Normalmente: fixa no momento do enqueue do PRIMEIRO send.)
 *
 * Retorna null se nao tem instancia disponivel (todas inativas/lotadas).
 */
export async function pickInstanceForUser(
  supabase: SupabaseClient,
  userId: string,
  purpose: "all" | "marketing" | "transactional" | "support" = "marketing",
): Promise<{ instance: Instance | null; sticky: boolean }> {
  // 1. Tenta sticky
  const { data: profile } = await supabase
    .from("profiles")
    .select("whatsapp_instance_id")
    .eq("id", userId)
    .maybeSingle();

  const stickyId = (profile?.whatsapp_instance_id as string | null) ?? null;
  if (stickyId) {
    const { data } = await supabase
      .from("whatsapp_instances")
      .select("id, name, display_name, is_active, priority, daily_limit, purpose")
      .eq("id", stickyId)
      .maybeSingle();
    if (data && data.is_active) {
      return { instance: data as Instance, sticky: true };
    }
    // Sticky existe mas tá inativa — retorna null, quem chama decide
    // (pular ou reatribuir). NAO troca silenciosamente: trocar de numero
    // assina como spam pro WhatsApp da aluna.
    return { instance: null, sticky: true };
  }

  // 2. Round-robin pra atribuir
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("id, name, display_name, is_active, priority, daily_limit, purpose")
    .eq("is_active", true)
    .in("purpose", purpose === "all" ? ["all", "marketing", "transactional", "support"] : [purpose, "all"])
    .order("priority", { ascending: true });

  const candidates = (instances ?? []) as Instance[];
  if (candidates.length === 0) return { instance: null, sticky: false };

  // Conta envios de HOJE por instance pra respeitar daily_limit
  const todayStart = new Date();
  todayStart.setUTCHours(3, 0, 0, 0); // 00h BRT
  if (todayStart.getTime() > Date.now()) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }
  const { data: counts } = await supabase
    .from("whatsapp_outbox")
    .select("instance_id")
    .eq("status", "sent")
    .gte("sent_at", todayStart.toISOString());

  const usedToday = new Map<string, number>();
  for (const c of (counts ?? []) as { instance_id: string | null }[]) {
    if (!c.instance_id) continue;
    usedToday.set(c.instance_id, (usedToday.get(c.instance_id) ?? 0) + 1);
  }

  // Pega a primeira (menor priority) que ainda tem espaco hoje
  const fit = candidates.find((c) => (usedToday.get(c.id) ?? 0) < c.daily_limit);
  return { instance: fit ?? null, sticky: false };
}

// =================================================================
// SELECAO DO PROXIMO MOTIVACIONAL (rotation 365)
// =================================================================

/**
 * Pra uma aluna, retorna o proximo entry da MOTIVATIONAL_LIBRARY que
 * ela AINDA NAO recebeu. Quando esgotar os 365, recomeca do 001
 * (acontece naturalmente: filtro vira vazio → cai no fallback).
 */
export async function pickNextMotivational(
  supabase: SupabaseClient,
  userId: string,
): Promise<MotivationalEntry> {
  const { data: sent } = await supabase
    .from("whatsapp_outbox")
    .select("template_key")
    .eq("user_id", userId)
    .like("template_key", "motivacional_%");

  const sentKeys = new Set(
    ((sent ?? []) as { template_key: string }[]).map((r) => r.template_key),
  );

  const next = MOTIVATIONAL_LIBRARY.find((e) => !sentKeys.has(e.key));
  if (next) return next;

  // Esgotou os 365 — recomeca do mais antigo (pelo proprio order do array).
  // Aluna nao deve perceber porque foram MUITOS dias entre v1 e v365.
  return MOTIVATIONAL_LIBRARY[0]!;
}

// =================================================================
// DEDUP / LIMITE SEMANAL
// =================================================================

/**
 * Aluna ja recebeu esse template_key nas ultimas N horas?
 * (Triggers usam isso pra nao spammar; blast manual de admin pode
 *  ignorar via flag.)
 */
export async function alreadyReceivedRecently(
  supabase: SupabaseClient,
  userId: string,
  templateKey: string,
  withinHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 3600_000).toISOString();
  const { count } = await supabase
    .from("whatsapp_outbox")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("template_key", templateKey)
    .gte("created_at", since);
  return (count ?? 0) > 0;
}

/**
 * Aluna ja recebeu >= WEEKLY_MSG_LIMIT_PER_USER nos ultimos 7 dias?
 * Conta apenas status sent OU pending (futuro), nao skipped/failed.
 */
export async function reachedWeeklyLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { count } = await supabase
    .from("whatsapp_outbox")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "sent"])
    .gte("created_at", since);
  return (count ?? 0) >= WEEKLY_MSG_LIMIT_PER_USER;
}

// =================================================================
// ENQUEUE
// =================================================================

export type EnqueueResult =
  | { ok: true; outbox_id: string; sticky_assigned: boolean }
  | { ok: false; reason: string };

/**
 * Enfileira UMA mensagem pra UMA aluna. Faz todas as checagens:
 *   - Aluna tem whatsapp cadastrado e valido?
 *   - Tem instancia disponivel (sticky valida ou round-robin)?
 *   - Limite semanal nao estourou?
 *
 * Se for o 1o envio, fixa a sticky em profiles.whatsapp_instance_id.
 *
 * Nao envia — so enfileira. O cron flush eh quem envia.
 */
export async function enqueueOutbox(
  supabase: SupabaseClient,
  args: {
    userId: string;
    phone: string;
    templateKey: string;
    text: string;
    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
    skipWeeklyLimit?: boolean;
  },
): Promise<EnqueueResult> {
  const normalizedPhone = normalizePhoneBR(args.phone);
  if (!normalizedPhone) {
    return { ok: false, reason: "phone_invalido" };
  }

  // Checa limite semanal (exceto se admin marcou skip)
  if (!args.skipWeeklyLimit) {
    const tooMany = await reachedWeeklyLimit(supabase, args.userId);
    if (tooMany) {
      return { ok: false, reason: "weekly_limit_reached" };
    }
  }

  // Escolhe instancia
  const { instance, sticky } = await pickInstanceForUser(
    supabase,
    args.userId,
    "marketing",
  );
  if (!instance) {
    return {
      ok: false,
      reason: sticky ? "sticky_inactive" : "no_instance_available",
    };
  }

  // Se ainda nao tem sticky, fixa agora
  let stickyAssigned = false;
  if (!sticky) {
    await supabase
      .from("profiles")
      .update({ whatsapp_instance_id: instance.id })
      .eq("id", args.userId);
    stickyAssigned = true;
  }

  // Insere na outbox
  const { data, error } = await supabase
    .from("whatsapp_outbox")
    .insert({
      user_id: args.userId,
      instance_id: instance.id,
      template_key: args.templateKey,
      phone: normalizedPhone,
      text: args.text,
      status: "pending",
      scheduled_at: (args.scheduledAt ?? new Date()).toISOString(),
      metadata: args.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "insert_failed" };
  }

  return { ok: true, outbox_id: data.id, sticky_assigned: stickyAssigned };
}

// =================================================================
// FLUSH (cron a cada 1min)
// =================================================================

type OutboxRow = {
  id: string;
  user_id: string;
  instance_id: string | null;
  template_key: string;
  phone: string;
  text: string;
  status: string;
  scheduled_at: string;
  attempts: number;
};

type InstanceLite = { id: string; name: string };

/**
 * Processa ate `limit` linhas pendentes da outbox. Chama Evo na instancia
 * de cada linha, marca status como sent/failed.
 *
 * Retorna estatisticas pra log.
 */
export async function flushOutbox(
  supabase: SupabaseClient,
  limit = 15,
): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  const now = new Date();
  if (!canSendNow(now)) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const { data: rows } = await supabase
    .from("whatsapp_outbox")
    .select("id, user_id, instance_id, template_key, phone, text, status, scheduled_at, attempts")
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  const pending = (rows ?? []) as OutboxRow[];
  if (pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  // Cache de instancias
  const instanceIds = Array.from(
    new Set(pending.map((r) => r.instance_id).filter(Boolean)),
  ) as string[];
  const { data: instData } = await supabase
    .from("whatsapp_instances")
    .select("id, name, is_active")
    .in("id", instanceIds);
  const instById = new Map<string, InstanceLite & { is_active: boolean }>();
  for (const i of (instData ?? []) as (InstanceLite & { is_active: boolean })[]) {
    instById.set(i.id, i);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of pending) {
    if (!row.instance_id) {
      await markOutbox(supabase, row.id, "skipped", "no_instance");
      skipped++;
      continue;
    }
    const inst = instById.get(row.instance_id);
    if (!inst || !inst.is_active) {
      await markOutbox(supabase, row.id, "skipped", "instance_inactive");
      skipped++;
      continue;
    }

    const result = await sendViaEvoInstance({
      instanceName: inst.name,
      phone: row.phone,
      text: row.text,
    });

    if (result.ok) {
      await supabase
        .from("whatsapp_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: row.attempts + 1,
        })
        .eq("id", row.id);
      sent++;
    } else {
      // Apos 3 tentativas, marca como failed permanente
      const attempts = row.attempts + 1;
      const status = attempts >= 3 ? "failed" : "pending";
      // Em caso de retry, agenda + 5min
      const reschedule =
        status === "pending"
          ? new Date(Date.now() + 5 * 60_000).toISOString()
          : row.scheduled_at;
      await supabase
        .from("whatsapp_outbox")
        .update({
          status,
          attempts,
          error: result.error.slice(0, 500),
          scheduled_at: reschedule,
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return { processed: pending.length, sent, failed, skipped };
}

async function markOutbox(
  supabase: SupabaseClient,
  id: string,
  status: "sent" | "failed" | "skipped",
  error?: string,
) {
  await supabase
    .from("whatsapp_outbox")
    .update({
      status,
      error: error ?? null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", id);
}

// =================================================================
// CHAMADA EVO POR INSTANCIA ESPECIFICA
// =================================================================
// O lib/evolution.ts existente usa a env EVOLUTION_INSTANCE fixa. Aqui
// preciso mandar pela instancia EXATA da linha — sobrescreve o nome da
// instancia na URL.

async function sendViaEvoInstance(args: {
  instanceName: string;
  phone: string;
  text: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    return { ok: false, error: "EVOLUTION_API_URL / EVOLUTION_API_KEY ausentes" };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(args.instanceName)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number: args.phone, text: args.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `evo_${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => null)) as { key?: { id?: string } } | null;
    return { ok: true, id: json?.key?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" };
  }
}

// =================================================================
// HELPER PUBLICO: ENFILEIRAR BLAST MOTIVACIONAL PRA UMA LISTA
// =================================================================

/**
 * Enfileira o proximo motivacional (rotation 365) pra cada aluna da
 * lista, escalonado em BLAST_INTERVAL_MS.
 *
 * Pula automaticamente quem:
 *   - nao tem whatsapp
 *   - estourou weekly limit
 *   - sticky tá inativa sem fallback
 *
 * Retorna contagens.
 */
export async function enqueueMotivationalBlast(
  supabase: SupabaseClient,
  users: { id: string; name: string | null; whatsapp: string | null }[],
  options?: { campaignKey?: string; startAt?: Date },
): Promise<{
  enqueued: number;
  skipped_no_phone: number;
  skipped_weekly: number;
  skipped_other: number;
  details: Array<{ user_id: string; reason: string }>;
}> {
  const startTs = (options?.startAt ?? new Date()).getTime();
  const campaign = options?.campaignKey ?? `blast_${Date.now()}`;

  let enqueued = 0;
  let skippedNoPhone = 0;
  let skippedWeekly = 0;
  let skippedOther = 0;
  const details: Array<{ user_id: string; reason: string }> = [];

  let idx = 0;
  for (const u of users) {
    if (!u.whatsapp) {
      skippedNoPhone++;
      details.push({ user_id: u.id, reason: "no_phone" });
      continue;
    }
    const entry = await pickNextMotivational(supabase, u.id);
    const text = renderMotivational(entry, { firstName: u.name });

    const scheduledAt = new Date(startTs + idx * BLAST_INTERVAL_MS);
    const r = await enqueueOutbox(supabase, {
      userId: u.id,
      phone: u.whatsapp,
      templateKey: entry.key,
      text,
      scheduledAt,
      metadata: { campaign, theme: entry.theme },
    });

    if (r.ok) {
      enqueued++;
      idx++;
    } else if (r.reason === "weekly_limit_reached") {
      skippedWeekly++;
      details.push({ user_id: u.id, reason: r.reason });
    } else {
      skippedOther++;
      details.push({ user_id: u.id, reason: r.reason });
    }
  }

  return {
    enqueued,
    skipped_no_phone: skippedNoPhone,
    skipped_weekly: skippedWeekly,
    skipped_other: skippedOther,
    details,
  };
}
