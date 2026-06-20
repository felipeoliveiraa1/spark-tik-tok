/**
 * Worker WhatsApp do Metodo TTS — roda no VPS Contabo.
 *
 * Responsabilidades:
 *   - Processar fila whatsapp_outbox (setInterval 60s)
 *   - Disparar triggers diarios (dia1 nao logou, sumiu 7d, streak 3)
 *   - Expor rotas HTTP HMAC-protected pro frontend chamar (blast/stats)
 *
 * Vantagem de estar aqui em vez do Vercel:
 *   - Sem timeout serverless (pode processar lotes grandes)
 *   - Cron-like via setInterval, sem depender de plano Vercel Pro
 *   - Latencia menor pro Evo (VPS BR -> Evo BR)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Node 20 nao tem WebSocket nativo; o supabase-js precisa pra inicializar
// o RealtimeClient mesmo quando a gente nao usa realtime. Injetamos `ws`.
import WebSocket from "ws";
import { log } from "./logger.js";
import {
  MOTIVATIONAL_LIBRARY,
  renderMotivational,
  TRIGGER_DIA1_NAO_LOGOU_KEY,
  TRIGGER_SUMIU_7D_KEY,
  TRIGGER_STREAK_3_KEY,
  TRIGGER_PRIMEIRO_FATURAMENTO_KEY,
  TRIGGER_STREAK_QUEBRADO_KEY,
  TRIGGER_PRIMEIRO_PRODUTO_KEY,
  TRIGGER_PRIMEIRO_ROTEIRO_KEY,
  TRIGGER_BATEU_META_MENSAL_KEY,
  TRIGGER_TOUR_COMPLETO_KEY,
  TRIGGER_EBOOK_BAIXADO_KEY,
  TRIGGER_ROTINA_30DIAS_KEY,
  TRIGGER_PLANO_ENCERRANDO_3D_KEY,
  TRIGGER_TRIAL_EXPIRANDO_3D_KEY,
  TRIGGER_TRIAL_EXPIROU_KEY,
  TRIGGER_PLANO_CANCELOU_KEY,
  TRIGGER_PLANO_REATIVADO_KEY,
  TRIGGER_LEMBRETE_CHECKIN_KEY,
  TRIGGER_GROUP_REMOVAL_WARNING_KEY,
  buildLembreteCheckin,
  buildTriggerGroupRemovalWarning,
  buildTriggerDia1NaoLogou,
  buildTriggerSumiu7d,
  buildTriggerStreak3,
  buildTriggerPrimeiroFaturamento,
  buildTriggerStreakQuebrado,
  buildTriggerPrimeiroProduto,
  buildTriggerPrimeiroRoteiro,
  buildTriggerBateuMetaMensal,
  buildTriggerTourCompleto,
  buildTriggerEbookBaixado,
  buildTriggerRotina30Dias,
  buildTriggerPlanoEncerrando3d,
  buildTriggerTrialExpirando3d,
  buildTriggerTrialExpirou,
  buildTriggerPlanoCancelou,
  buildTriggerPlanoReativado,
  type MotivationalEntry,
} from "./whatsapp-templates.js";

// =================================================================
// CONFIG
// =================================================================

// Cadencia entre envios em batch (motivacional diario, group cleanup
// warning, etc). Subiu de 15s -> 40s em 2026-06-20 pra dar mais folga
// pro chip metodotts (caiu uma vez recente; ritmo mais lento ajuda
// estabilidade do Baileys/WhatsApp Web).
export const BLAST_INTERVAL_MS = 40_000;
export const WEEKLY_MSG_LIMIT_PER_USER = 5;
export const HOUR_OPEN_BRT = 8;
export const HOUR_CLOSE_BRT = 23;
export const FLUSH_INTERVAL_MS = 60_000; // 1 minuto
export const FLUSH_BATCH_SIZE = 25;

// =================================================================
// SUPABASE
// =================================================================

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no .env");
  }
  _supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Sem polyfill, supabase-js explode no Node 20 (WebSocket nao eh
    // nativo). Mesmo nao usando realtime, o construtor instancia.
    realtime: {
      transport: WebSocket as unknown as typeof globalThis.WebSocket,
    },
  });
  return _supabase;
}

// =================================================================
// EVOLUTION API
// =================================================================

export function normalizePhoneBR(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  if (d.length === 10 || d.length === 11) {
    d = `55${d}`;
    return d;
  }
  if (d.length >= 12 && d.length <= 14) return d;
  return null;
}

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

// Mascarar PII em strings de erro vindas do Evolution/Baileys antes de
// logar/persistir. Evolution echo o phone do participante no body de
// erro (ex: "forbidden to remove 5511999999999@s.whatsapp.net from group"),
// e LGPD nao permite phone bruto em logs operacionais nem em audit
// jsonb. Mascara phones E.164 BR (12-13 digitos) e JIDs WhatsApp.
function maskPhoneInErrorString(input: string): string {
  return input
    .replace(/\b55\d{10,11}\b/g, "55**********")
    .replace(/\b\d{12,13}@s\.whatsapp\.net\b/g, "55**********@s.whatsapp.net");
}

// Evolution v2 group/updateParticipant — remove participante de grupo.
// CONFIRMADO via recon: groupJid eh QUERY PARAM (nao body), method POST,
// body { action: "remove", participants: ["5511..."] } com phone puro
// (sem @s.whatsapp.net). Headers: apikey + Content-Type. Erros comuns:
// 400/403 quando instancia nao eh admin; 400 com Baileys error quando
// participante ja saiu do grupo. Erros sao sanitizados (phone mascarado)
// pra nao vazar PII em log/audit.
export async function removeParticipantFromGroup(args: {
  instanceName: string;
  groupJid: string;
  phone: string;
}): Promise<{ ok: true; raw?: unknown } | { ok: false; error: string; status?: number }> {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    return { ok: false, error: "EVOLUTION_API_URL / EVOLUTION_API_KEY ausentes" };
  }
  if (!args.groupJid.endsWith("@g.us")) {
    return { ok: false, error: `groupJid invalido (faltando @g.us): ${args.groupJid}` };
  }

  const phone = normalizePhoneBR(args.phone) ?? args.phone;
  const url =
    `${baseUrl.replace(/\/$/, "")}` +
    `/group/updateParticipant/${encodeURIComponent(args.instanceName)}` +
    `?groupJid=${encodeURIComponent(args.groupJid)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ action: "remove", participants: [phone] }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: maskPhoneInErrorString(`evo_${res.status}: ${body.slice(0, 300)}`),
      };
    }
    const json = await res.json().catch(() => null);
    return { ok: true, raw: json };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "fetch_failed";
    return { ok: false, error: maskPhoneInErrorString(raw) };
  }
}

// =================================================================
// JANELA DE HORARIO
// =================================================================

function hourBRT(now: Date = new Date()): number {
  return (now.getUTCHours() - 3 + 24) % 24;
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

export async function pickInstanceForUser(
  supabase: SupabaseClient,
  userId: string,
  purpose: "all" | "marketing" | "transactional" | "support" = "marketing",
): Promise<{ instance: Instance | null; sticky: boolean }> {
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
    if (data && data.is_active) return { instance: data as Instance, sticky: true };
    return { instance: null, sticky: true };
  }

  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("id, name, display_name, is_active, priority, daily_limit, purpose")
    .eq("is_active", true)
    .in(
      "purpose",
      purpose === "all"
        ? ["all", "marketing", "transactional", "support"]
        : [purpose, "all"],
    )
    .order("priority", { ascending: true });

  const candidates = (instances ?? []) as Instance[];
  if (candidates.length === 0) return { instance: null, sticky: false };

  const todayStart = new Date();
  todayStart.setUTCHours(3, 0, 0, 0);
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

  const fit = candidates.find((c) => (usedToday.get(c.id) ?? 0) < c.daily_limit);
  return { instance: fit ?? null, sticky: false };
}

// =================================================================
// PROXIMO MOTIVACIONAL (rotation 365)
// =================================================================

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
  return next ?? MOTIVATIONAL_LIBRARY[0]!;
}

// =================================================================
// DEDUP / WEEKLY LIMIT
// =================================================================

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
 * Limite semanal aplica APENAS pros motivacionais (template_key
 * comecando com 'motivacional_'). Triggers (welcome, dia1_nao_logou,
 * sumiu_7d, primeiro_faturamento, etc) NAO contam — sao eventos
 * pontuais raros, podem passar livres.
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
    .like("template_key", "motivacional_%")
    .gte("created_at", since);
  return (count ?? 0) >= WEEKLY_MSG_LIMIT_PER_USER;
}

// =================================================================
// ENQUEUE
// =================================================================

export type EnqueueResult =
  | { ok: true; outbox_id: string; sticky_assigned: boolean }
  | { ok: false; reason: string };

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
    skipOptInCheck?: boolean;
  },
): Promise<EnqueueResult> {
  const normalizedPhone = normalizePhoneBR(args.phone);
  if (!normalizedPhone) return { ok: false, reason: "phone_invalido" };

  // Defesa em profundidade: aluna optou por NAO receber mensagens?
  // Pula sempre (mesmo blast manual respeita — admin que clica
  // "test_admin" usa skipOptInCheck pra mandar pra qualquer numero).
  if (!args.skipOptInCheck) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("whatsapp_opt_in")
      .eq("id", args.userId)
      .maybeSingle();
    if (prof && prof.whatsapp_opt_in === false) {
      return { ok: false, reason: "opt_out" };
    }
  }

  // Weekly limit aplica SO pros motivacionais. Triggers (1a venda,
  // sumiu_7d, etc) passam livres — sao eventos raros pontuais.
  const isMotivacional = args.templateKey.startsWith("motivacional_");
  if (isMotivacional && !args.skipWeeklyLimit) {
    const tooMany = await reachedWeeklyLimit(supabase, args.userId);
    if (tooMany) return { ok: false, reason: "weekly_limit_reached" };
  }

  const { instance, sticky } = await pickInstanceForUser(supabase, args.userId, "marketing");
  if (!instance) {
    return { ok: false, reason: sticky ? "sticky_inactive" : "no_instance_available" };
  }

  let stickyAssigned = false;
  if (!sticky) {
    await supabase
      .from("profiles")
      .update({ whatsapp_instance_id: instance.id })
      .eq("id", args.userId);
    stickyAssigned = true;
  }

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

  if (error || !data) return { ok: false, reason: error?.message ?? "insert_failed" };
  return { ok: true, outbox_id: data.id, sticky_assigned: stickyAssigned };
}

// =================================================================
// FLUSH (worker tick)
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

type InstanceLite = { id: string; name: string; is_active: boolean };

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

export async function flushOutbox(
  supabase: SupabaseClient,
  limit = FLUSH_BATCH_SIZE,
  options?: { bypassWindow?: boolean },
): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  const now = new Date();
  // Cron respeita janela 8h-22h BRT pra nao mandar de madrugada.
  // Admin clicando "Processar agora" passa bypassWindow=true.
  if (!options?.bypassWindow && !canSendNow(now)) {
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
  if (pending.length === 0) return { processed: 0, sent: 0, failed: 0, skipped: 0 };

  const instanceIds = Array.from(
    new Set(pending.map((r) => r.instance_id).filter(Boolean)),
  ) as string[];
  const { data: instData } = await supabase
    .from("whatsapp_instances")
    .select("id, name, is_active")
    .in("id", instanceIds);
  const instById = new Map<string, InstanceLite>();
  for (const i of (instData ?? []) as InstanceLite[]) instById.set(i.id, i);

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
      const attempts = row.attempts + 1;
      const status = attempts >= 3 ? "failed" : "pending";
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

// =================================================================
// BLAST
// =================================================================

export async function enqueueMotivationalBlast(
  supabase: SupabaseClient,
  users: { id: string; name: string | null; whatsapp: string | null }[],
  options?: { campaignKey?: string; startAt?: Date },
): Promise<{
  enqueued: number;
  skipped_no_phone: number;
  skipped_weekly: number;
  skipped_other: number;
}> {
  const startTs = (options?.startAt ?? new Date()).getTime();
  const campaign = options?.campaignKey ?? `blast_${Date.now()}`;

  let enqueued = 0;
  let skippedNoPhone = 0;
  let skippedWeekly = 0;
  let skippedOther = 0;
  let idx = 0;

  for (const u of users) {
    if (!u.whatsapp) {
      skippedNoPhone++;
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
    } else {
      skippedOther++;
    }
  }

  return {
    enqueued,
    skipped_no_phone: skippedNoPhone,
    skipped_weekly: skippedWeekly,
    skipped_other: skippedOther,
  };
}

// =================================================================
// TRIGGERS (diario)
// =================================================================

function brtDateString(deltaDays: number): string {
  const brt = new Date(Date.now() - 3 * 3600_000);
  brt.setUTCDate(brt.getUTCDate() + deltaDays);
  return brt.toISOString().slice(0, 10);
}

async function runTriggerDia1NaoLogou(supabase: SupabaseClient) {
  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/login`
    : "https://www.metodotts.app/login";

  const from = new Date(Date.now() - 48 * 3600_000).toISOString();
  const to = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, created_at")
    .not("whatsapp", "is", null)
    .or("plan_active.eq.true,plan_status.eq.trial")
    .gte("created_at", from)
    .lte("created_at", to);

  const candidates = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];
  if (candidates.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const candidateIds = new Set(candidates.map((c) => c.id));
  const loggedInIds = new Set<string>();
  try {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.last_sign_in_at && candidateIds.has(u.id)) loggedInIds.add(u.id);
    }
  } catch {
    return { found: candidates.length, enqueued: 0, skipped: candidates.length };
  }

  const targets = candidates.filter((c) => !loggedInIds.has(c.id));
  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_DIA1_NAO_LOGOU_KEY, 24 * 30)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerDia1NaoLogou({
      firstName: c.name ?? "amiga",
      loginUrl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_DIA1_NAO_LOGOU_KEY,
      text,
      metadata: { trigger: "dia1_nao_logou" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

async function runTriggerSumiu7d(supabase: SupabaseClient) {
  const from = new Date(Date.now() - 14 * 86400_000).toISOString();
  const to = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, last_seen_at")
    .not("whatsapp", "is", null)
    .eq("plan_active", true)
    .gte("last_seen_at", from)
    .lte("last_seen_at", to);

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];
  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_SUMIU_7D_KEY, 24 * 30)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerSumiu7d({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_SUMIU_7D_KEY,
      text,
      metadata: { trigger: "sumiu_7d" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

async function runTriggerStreak3(supabase: SupabaseClient) {
  const d0 = brtDateString(0);
  const d1 = brtDateString(-1);
  const d2 = brtDateString(-2);

  const { data: completions } = await supabase
    .from("daily_completions")
    .select("user_id, date")
    .in("date", [d0, d1, d2]);

  const byUser = new Map<string, Set<string>>();
  for (const c of (completions ?? []) as { user_id: string; date: string }[]) {
    if (!byUser.has(c.user_id)) byUser.set(c.user_id, new Set());
    byUser.get(c.user_id)!.add(c.date);
  }

  const streakIds = Array.from(byUser.entries())
    .filter(([, dates]) => dates.size === 3)
    .map(([uid]) => uid);

  if (streakIds.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .in("id", streakIds)
    .not("whatsapp", "is", null);

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];
  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_STREAK_3_KEY, 24 * 30)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerStreak3({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_STREAK_3_KEY,
      text,
      metadata: { trigger: "streak_3" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// HELPER: "primeira vez do evento X" (primeiro_faturamento, produto, etc)
// =================================================================
//
// Pra cada user, retorna os candidatos cujo PRIMEIRO evento "eventName"
// aconteceu nas ultimas 24h. Usado por triggers que celebram marcos
// unicos (1a venda, 1o produto, 1o roteiro, etc).
async function runTriggerFirstEvent(
  supabase: SupabaseClient,
  args: {
    eventName: string;
    metadataFilter?: { key: string; value: string };
    templateKey: string;
    buildText: (input: { firstName: string }) => { text: string };
    triggerLabel: string;
  },
): Promise<{ found: number; enqueued: number; skipped: number }> {
  const last24h = new Date(Date.now() - 24 * 3600_000).toISOString();

  // Eventos recentes
  let query = supabase
    .from("user_events")
    .select("user_id, created_at, metadata")
    .eq("event", args.eventName)
    .gte("created_at", last24h);
  if (args.metadataFilter) {
    query = query.eq(`metadata->>${args.metadataFilter.key}`, args.metadataFilter.value);
  }
  const { data: recent } = await query;

  type EventRow = { user_id: string; created_at: string; metadata: Record<string, unknown> };
  const recentRows = (recent ?? []) as EventRow[];
  if (recentRows.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  // Pra cada candidato, confirma que NAO tem evento anterior (=eh o 1o)
  const candidateIds = Array.from(new Set(recentRows.map((r) => r.user_id)));
  const { data: earlier } = await supabase
    .from("user_events")
    .select("user_id, created_at")
    .eq("event", args.eventName)
    .in("user_id", candidateIds)
    .lt("created_at", last24h);

  const hasEarlier = new Set(
    ((earlier ?? []) as { user_id: string }[]).map((e) => e.user_id),
  );
  const firstTimeIds = candidateIds.filter((id) => !hasEarlier.has(id));
  if (firstTimeIds.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  // Busca dados dos profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .in("id", firstTimeIds)
    .not("whatsapp", "is", null)
    .or("plan_active.eq.true,plan_status.eq.trial");

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, args.templateKey, 24 * 30)) {
      skipped++;
      continue;
    }
    const { text } = args.buildText({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: args.templateKey,
      text,
      metadata: { trigger: args.triggerLabel },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// TRIGGER: 1o faturamento registrado (event=revenue_save)
// =================================================================

async function runTriggerPrimeiroFaturamento(supabase: SupabaseClient) {
  return runTriggerFirstEvent(supabase, {
    eventName: "revenue_save",
    templateKey: TRIGGER_PRIMEIRO_FATURAMENTO_KEY,
    buildText: buildTriggerPrimeiroFaturamento,
    triggerLabel: "primeiro_faturamento",
  });
}

// =================================================================
// TRIGGER: 1o produto cadastrado (event=product_create)
// =================================================================

async function runTriggerPrimeiroProduto(supabase: SupabaseClient) {
  return runTriggerFirstEvent(supabase, {
    eventName: "product_create",
    templateKey: TRIGGER_PRIMEIRO_PRODUTO_KEY,
    buildText: buildTriggerPrimeiroProduto,
    triggerLabel: "primeiro_produto",
  });
}

// =================================================================
// TRIGGER: 1o roteiro gerado (event=script_generate)
// =================================================================

async function runTriggerPrimeiroRoteiro(supabase: SupabaseClient) {
  return runTriggerFirstEvent(supabase, {
    eventName: "script_generate",
    templateKey: TRIGGER_PRIMEIRO_ROTEIRO_KEY,
    buildText: buildTriggerPrimeiroRoteiro,
    triggerLabel: "primeiro_roteiro",
  });
}

// =================================================================
// TRIGGER: completou tour da home (event=tour_complete, metadata.tour=home)
// =================================================================

async function runTriggerTourCompleto(supabase: SupabaseClient) {
  return runTriggerFirstEvent(supabase, {
    eventName: "tour_complete",
    metadataFilter: { key: "tour", value: "home" },
    templateKey: TRIGGER_TOUR_COMPLETO_KEY,
    buildText: buildTriggerTourCompleto,
    triggerLabel: "tour_completo",
  });
}

// =================================================================
// TRIGGER: 1o ebook baixado (event=ebook_download)
// =================================================================

async function runTriggerEbookBaixado(supabase: SupabaseClient) {
  return runTriggerFirstEvent(supabase, {
    eventName: "ebook_download",
    templateKey: TRIGGER_EBOOK_BAIXADO_KEY,
    buildText: buildTriggerEbookBaixado,
    triggerLabel: "ebook_baixado",
  });
}

// =================================================================
// TRIGGER: tinha streak >=3 dias e parou (2 dias sem bater)
// =================================================================

async function runTriggerStreakQuebrado(supabase: SupabaseClient) {
  // Tinha 3 dias seguidos ate anteontem (d-2, d-3, d-4) E NAO bateu d-0/d-1
  const d0 = brtDateString(0);
  const d1 = brtDateString(-1);
  const d2 = brtDateString(-2);
  const d3 = brtDateString(-3);
  const d4 = brtDateString(-4);

  const { data: completions } = await supabase
    .from("daily_completions")
    .select("user_id, date")
    .in("date", [d0, d1, d2, d3, d4]);

  // Conta dias do streak passado (d-2, d-3, d-4) e dias recentes (d-0, d-1)
  const pastDays = new Map<string, Set<string>>();
  const recentDays = new Map<string, Set<string>>();
  for (const c of (completions ?? []) as { user_id: string; date: string }[]) {
    if ([d2, d3, d4].includes(c.date)) {
      if (!pastDays.has(c.user_id)) pastDays.set(c.user_id, new Set());
      pastDays.get(c.user_id)!.add(c.date);
    }
    if ([d0, d1].includes(c.date)) {
      if (!recentDays.has(c.user_id)) recentDays.set(c.user_id, new Set());
      recentDays.get(c.user_id)!.add(c.date);
    }
  }

  // Streak = tinha 3 dias passados E nenhum dia recente
  const quebradoIds = Array.from(pastDays.entries())
    .filter(([uid, dates]) => dates.size === 3 && !recentDays.has(uid))
    .map(([uid]) => uid);

  if (quebradoIds.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .in("id", quebradoIds)
    .not("whatsapp", "is", null)
    .eq("plan_active", true);

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_STREAK_QUEBRADO_KEY, 24 * 30)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerStreakQuebrado({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_STREAK_QUEBRADO_KEY,
      text,
      metadata: { trigger: "streak_quebrado" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// TRIGGER: bateu meta mensal (faturamento >= meta_mensal_brl)
// =================================================================

async function runTriggerBateuMetaMensal(supabase: SupabaseClient) {
  // mes atual em BRT
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 3600_000);
  const ym = brt.toISOString().slice(0, 7); // YYYY-MM

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, meta_mensal_brl")
    .not("whatsapp", "is", null)
    .eq("plan_active", true)
    .not("meta_mensal_brl", "is", null)
    .gt("meta_mensal_brl", 0);

  type ProfileRow = {
    id: string;
    name: string | null;
    whatsapp: string;
    meta_mensal_brl: number;
  };
  const candidates = (profiles ?? []) as ProfileRow[];
  if (candidates.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const { data: revenues } = await supabase
    .from("monthly_revenue")
    .select("user_id, amount_brl")
    .in("user_id", candidates.map((c) => c.id))
    .eq("year_month", ym);

  const revByUser = new Map<string, number>();
  for (const r of (revenues ?? []) as { user_id: string; amount_brl: number }[]) {
    revByUser.set(r.user_id, Number(r.amount_brl));
  }

  let enqueued = 0;
  let skipped = 0;
  let found = 0;
  for (const c of candidates) {
    const fatu = revByUser.get(c.id) ?? 0;
    if (fatu < c.meta_mensal_brl) continue;
    found++;
    // Dedup por mes: nao manda 2 vezes no mesmo year_month
    const already = await alreadyReceivedThisMonth(
      supabase,
      c.id,
      TRIGGER_BATEU_META_MENSAL_KEY,
      ym,
    );
    if (already) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerBateuMetaMensal({
      firstName: c.name ?? "amiga",
      meta_brl: c.meta_mensal_brl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_BATEU_META_MENSAL_KEY,
      text,
      metadata: { trigger: "bateu_meta_mensal", year_month: ym },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found, enqueued, skipped };
}

async function alreadyReceivedThisMonth(
  supabase: SupabaseClient,
  userId: string,
  templateKey: string,
  yearMonth: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("whatsapp_outbox")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("template_key", templateKey)
    .eq("metadata->>year_month", yearMonth);
  return (count ?? 0) > 0;
}

// =================================================================
// TRIGGER: bateu rotina em 30 dos ultimos 30 dias (marco)
// =================================================================

async function runTriggerRotina30Dias(supabase: SupabaseClient) {
  // Janela: ultimos 30 dias BRT (inclui hoje)
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) dates.push(brtDateString(-i));

  const { data: completions } = await supabase
    .from("daily_completions")
    .select("user_id, date")
    .in("date", dates);

  const byUser = new Map<string, Set<string>>();
  for (const c of (completions ?? []) as { user_id: string; date: string }[]) {
    if (!byUser.has(c.user_id)) byUser.set(c.user_id, new Set());
    byUser.get(c.user_id)!.add(c.date);
  }

  // Pega quem tem EXATAMENTE 30 dias (= marco recente)
  const marcoIds = Array.from(byUser.entries())
    .filter(([, ds]) => ds.size >= 30)
    .map(([uid]) => uid);

  if (marcoIds.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .in("id", marcoIds)
    .not("whatsapp", "is", null)
    .eq("plan_active", true);

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    // Dedup 60d — nao manda de novo logo (60d garante uma vez por marco)
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_ROTINA_30DIAS_KEY, 24 * 60)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerRotina30Dias({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_ROTINA_30DIAS_KEY,
      text,
      metadata: { trigger: "rotina_30dias" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// RUN ALL TRIGGERS
// =================================================================

// =================================================================
// EXPIRE TRIALS — desativa contas com trial vencido
// =================================================================
//
// Sem isso, trial expirado mantem plan_active=true no banco e:
//   - Dashboard admin mostra contagem inflada de "ativas"
//   - Blast WhatsApp manda mensagem motivacional pra quem ja perdeu
//     acesso (gera frustracao — recebe "bora bater rotina" sem app)
//
// O middleware (proxy.ts) ja bloqueia acesso via hasActiveAccess() que
// checa plan_expires_at, entao aluna NAO consegue entrar — mas o banco
// fica desincronizado.
//
// Este job roda 1x/dia e sincroniza:
//   UPDATE plan_active=false, plan_status='inactive'
//   WHERE plan_status='trial' AND plan_expires_at <= now()
//
// Trigger plan_status_history captura cada mudanca automaticamente.
export async function expireTrials(): Promise<{ expired: number }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      plan_active: false,
      plan_status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("plan_status", "trial")
    .eq("plan_active", true)
    .lt("plan_expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    log.error({ err: error }, "[expire-trials] erro");
    return { expired: 0 };
  }
  return { expired: (data ?? []).length };
}

// =================================================================
// TRIGGER: pagante com assinatura encerrando em 1-3 dias
// =================================================================
async function runTriggerPlanoEncerrando3d(supabase: SupabaseClient) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";
  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 3600_000);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, whatsapp, plan_expires_at, plan_status")
    .not("whatsapp", "is", null)
    .in("plan_status", ["active", "late"])
    .not("plan_expires_at", "is", null)
    .gte("plan_expires_at", now.toISOString())
    .lte("plan_expires_at", in72h.toISOString());

  type Row = {
    id: string;
    name: string | null;
    email: string;
    whatsapp: string;
    plan_expires_at: string;
  };
  const targets = (profiles ?? []) as Row[];
  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_PLANO_ENCERRANDO_3D_KEY, 24 * 4)) {
      skipped++;
      continue;
    }
    const diasRestantes = Math.max(
      1,
      Math.ceil((new Date(c.plan_expires_at).getTime() - now.getTime()) / 86400_000),
    );
    const { text } = buildTriggerPlanoEncerrando3d({
      firstName: c.name ?? "amiga",
      diasRestantes,
      email: c.email,
      checkoutUrl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_PLANO_ENCERRANDO_3D_KEY,
      text,
      metadata: { trigger: "plano_encerrando_3d", dias_restantes: diasRestantes },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// TRIGGER: aluna em trial expirando em 1-3 dias
// =================================================================
async function runTriggerTrialExpirando3d(supabase: SupabaseClient) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";
  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 3600_000);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, whatsapp, plan_expires_at")
    .not("whatsapp", "is", null)
    .eq("plan_status", "trial")
    .eq("plan_active", true)
    .not("plan_expires_at", "is", null)
    .gte("plan_expires_at", now.toISOString())
    .lte("plan_expires_at", in72h.toISOString());

  type Row = {
    id: string;
    name: string | null;
    email: string;
    whatsapp: string;
    plan_expires_at: string;
  };
  const targets = (profiles ?? []) as Row[];
  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_TRIAL_EXPIRANDO_3D_KEY, 24 * 4)) {
      skipped++;
      continue;
    }
    const diasRestantes = Math.max(
      1,
      Math.ceil((new Date(c.plan_expires_at).getTime() - now.getTime()) / 86400_000),
    );
    const { text } = buildTriggerTrialExpirando3d({
      firstName: c.name ?? "amiga",
      diasRestantes,
      email: c.email,
      checkoutUrl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_TRIAL_EXPIRANDO_3D_KEY,
      text,
      metadata: { trigger: "trial_expirando_3d", dias_restantes: diasRestantes },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// TRIGGERS via plan_status_history (eventos pós-transição)
// =================================================================
//
// A tabela plan_status_history é alimentada por TRIGGER no UPDATE da
// profiles, então cada mudança de status fica registrada com from/to.
// Usamos last 24h pra capturar transições recentes — o cron de triggers
// roda 1x/dia, então 24h cobre a janela.
//
// Em todos: profile precisa ter whatsapp + opt_in. Dedup 7d pra não
// mandar várias mensagens se houver bounce + retomada na mesma semana.

type HistoryRow = {
  user_id: string;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
};

async function fetchProfilesById(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Array<{ id: string; name: string | null; email: string; whatsapp: string }>> {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, whatsapp")
    .in("id", ids)
    .not("whatsapp", "is", null);
  return ((data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string;
    whatsapp: string;
  }>);
}

// TRIGGER: trial recém-expirou (transição trial -> inactive nas últimas 24h)
async function runTriggerTrialExpirou(supabase: SupabaseClient) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: history } = await supabase
    .from("plan_status_history")
    .select("user_id, from_status, to_status, created_at")
    .eq("from_status", "trial")
    .eq("to_status", "inactive")
    .gte("created_at", since);

  const rows = (history ?? []) as HistoryRow[];
  if (rows.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const targets = await fetchProfilesById(supabase, ids);

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_TRIAL_EXPIROU_KEY, 24 * 7)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerTrialExpirou({
      firstName: c.name ?? "amiga",
      email: c.email,
      checkoutUrl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_TRIAL_EXPIROU_KEY,
      text,
      metadata: { trigger: "trial_expirou" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// TRIGGER: pagante teve plano cancelado/refundado/desativado
// (transição active/late -> canceled/refunded/inactive nas últimas 24h)
async function runTriggerPlanoCancelou(supabase: SupabaseClient) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: history } = await supabase
    .from("plan_status_history")
    .select("user_id, from_status, to_status, created_at")
    .in("from_status", ["active", "late"])
    .in("to_status", ["canceled", "refunded", "inactive"])
    .gte("created_at", since);

  const rows = (history ?? []) as HistoryRow[];
  if (rows.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const targets = await fetchProfilesById(supabase, ids);

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_PLANO_CANCELOU_KEY, 24 * 7)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerPlanoCancelou({
      firstName: c.name ?? "amiga",
      email: c.email,
      checkoutUrl,
    });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_PLANO_CANCELOU_KEY,
      text,
      metadata: { trigger: "plano_cancelou" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// TRIGGER: aluna reativou conta (qualquer estado inativo/cancelado -> active)
// Cobre: voltou após trial, renovou após refund/cancel, voltou após late.
async function runTriggerPlanoReativado(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: history } = await supabase
    .from("plan_status_history")
    .select("user_id, from_status, to_status, created_at")
    .in("from_status", ["inactive", "canceled", "refunded", "trial", "late"])
    .eq("to_status", "active")
    .gte("created_at", since);

  const rows = (history ?? []) as HistoryRow[];
  if (rows.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  // Só queremos REATIVAÇÕES, não primeira ativação após trial.
  // Trial -> active = renovou um trial pagando, conta como reativação.
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const targets = await fetchProfilesById(supabase, ids);

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_PLANO_REATIVADO_KEY, 24 * 7)) {
      skipped++;
      continue;
    }
    const { text } = buildTriggerPlanoReativado({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_PLANO_REATIVADO_KEY,
      text,
      metadata: { trigger: "plano_reativado" },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: targets.length, enqueued, skipped };
}

// =================================================================
// LEMBRETE NOTURNO DE CHECKIN (20:30 BRT)
// =================================================================
//
// Pega alunas opt_in + plan_active/admin que NAO bateram daily_completions
// de hoje (BRT) e manda lembrete carinhoso pra fechar o dia.
// Dedup 20h garante 1x/dia mesmo se cron rodar 2 vezes.
//
// NAO conta no weekly limit (motivacional eh outro fluxo; isso aqui eh
// utilidade noturna especifica que so dispara pra quem esqueceu).
export async function runLembreteCheckin(): Promise<{
  found: number;
  enqueued: number;
  skipped: number;
}> {
  const supabase = getSupabase();
  const today = brtDateString(0);

  const { data: completed } = await supabase
    .from("daily_completions")
    .select("user_id")
    .eq("date", today);

  const completedIds = new Set(
    ((completed ?? []) as { user_id: string }[]).map((r) => r.user_id),
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .not("whatsapp", "is", null)
    .eq("whatsapp_opt_in", true)
    .or("plan_active.eq.true,role.eq.admin");

  const candidates = ((profiles ?? []) as Array<{
    id: string;
    name: string | null;
    whatsapp: string;
  }>).filter((p) => !completedIds.has(p.id));

  if (candidates.length === 0) return { found: 0, enqueued: 0, skipped: 0 };

  let enqueued = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (await alreadyReceivedRecently(supabase, c.id, TRIGGER_LEMBRETE_CHECKIN_KEY, 20)) {
      skipped++;
      continue;
    }
    const { text } = buildLembreteCheckin({ firstName: c.name ?? "amiga" });
    const r = await enqueueOutbox(supabase, {
      userId: c.id,
      phone: c.whatsapp,
      templateKey: TRIGGER_LEMBRETE_CHECKIN_KEY,
      text,
      metadata: { trigger: "lembrete_checkin", date: today },
    });
    if (r.ok) enqueued++;
    else skipped++;
  }
  return { found: candidates.length, enqueued, skipped };
}

export async function runAllTriggers() {
  const supabase = getSupabase();
  const [
    dia1,
    sumiu,
    streak,
    primeiro_faturamento,
    streak_quebrado,
    primeiro_produto,
    primeiro_roteiro,
    bateu_meta,
    tour_completo,
    ebook_baixado,
    rotina_30dias,
    plano_encerrando,
    trial_expirando,
    trial_expirou,
    plano_cancelou,
    plano_reativado,
  ] = await Promise.all([
    runTriggerDia1NaoLogou(supabase),
    runTriggerSumiu7d(supabase),
    runTriggerStreak3(supabase),
    runTriggerPrimeiroFaturamento(supabase),
    runTriggerStreakQuebrado(supabase),
    runTriggerPrimeiroProduto(supabase),
    runTriggerPrimeiroRoteiro(supabase),
    runTriggerBateuMetaMensal(supabase),
    runTriggerTourCompleto(supabase),
    runTriggerEbookBaixado(supabase),
    runTriggerRotina30Dias(supabase),
    runTriggerPlanoEncerrando3d(supabase),
    runTriggerTrialExpirando3d(supabase),
    runTriggerTrialExpirou(supabase),
    runTriggerPlanoCancelou(supabase),
    runTriggerPlanoReativado(supabase),
  ]);
  return {
    dia1,
    sumiu,
    streak,
    primeiro_faturamento,
    streak_quebrado,
    primeiro_produto,
    primeiro_roteiro,
    bateu_meta,
    tour_completo,
    ebook_baixado,
    rotina_30dias,
    plano_encerrando,
    trial_expirando,
    trial_expirou,
    plano_cancelou,
    plano_reativado,
  };
}

// =================================================================
// BLAST MOTIVACIONAL DIARIO
// =================================================================
// Roda 1x/dia as 8h BRT. Pega TODAS as alunas plan_active=true OU admin,
// com whatsapp_opt_in=true, e enfileira proximo motivacional (rotation
// 365) pra cada uma. Cadencia 15s entre envios via scheduled_at.
//
// Mesma logica do botao "Disparar pra todas" do painel, mas automatica.
// Dedup garante que aluna nao recebe motivacional repetido (rotation
// pega o proximo template_key que ela ainda nao viu).

export async function runDailyMotivationalBlast(): Promise<{
  total_users: number;
  enqueued: number;
  skipped_no_phone: number;
  skipped_weekly: number;
  skipped_other: number;
}> {
  const supabase = getSupabase();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, plan_active, role")
    .not("whatsapp", "is", null)
    .eq("whatsapp_opt_in", true)
    .or("plan_active.eq.true,role.eq.admin");

  if (error) {
    log.error({ err: error }, "[daily-motivational] erro buscando profiles");
    return { total_users: 0, enqueued: 0, skipped_no_phone: 0, skipped_weekly: 0, skipped_other: 0 };
  }

  const users = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string | null,
    whatsapp: p.whatsapp as string | null,
  }));

  const today = brtDateString(0);
  const result = await enqueueMotivationalBlast(supabase, users, {
    campaignKey: `daily_${today}`,
  });

  return { total_users: users.length, ...result };
}

// =================================================================
// GROUP CLEANUP — avisa 24h antes + remove do grupo das alunas
// =================================================================
// Fase A: aluna com plano caido (canceled/refunded/inactive/chargeback)
//   -> manda aviso WhatsApp + marca profiles.group_removal_warned_at
// Fase B: warned_at + 24h passou -> remove dos grupos via Evolution
//   updateParticipant + marca profiles.group_removed_at
//
// Idempotente: trigger postgres zera as 2 colunas se aluna reativa
// (plan_active vira true), permitindo ciclo limpo se cancelar dnv.
//
// Roda hourly (setInterval no startWhatsAppWorker), tick imediato no
// startup pra cobrir restart de container.

const GROUP_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h
const GROUP_CLEANUP_WARN_DELAY_MS = 24 * 60 * 60 * 1000; // 24h entre warn e remove
const GROUP_CLEANUP_SLEEP_BETWEEN_GROUPS_MS = 2_000;
const GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS = 1_000;
const GROUP_CLEANUP_MAX_USERS_PER_TICK = 500;

// Lock declarado aqui (nao no bloco WORKER abaixo) porque
// runGroupCleanupWithLock o usa antes da declaracao do bloco WORKER.
let groupCleanupRunning = false;

const groupCleanupSleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

type GroupRemovalAction = "warned" | "removed" | "failed" | "skipped";

async function insertGroupAudit(
  supabase: SupabaseClient,
  userId: string,
  action: GroupRemovalAction,
  reason: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("group_removal_audit").insert({
    user_id: userId,
    action,
    reason,
    payload,
  });
  if (error) {
    log.warn(
      { err: error, userId, action, reason },
      "[group-cleanup] insert audit falhou (best-effort)",
    );
  }
}

// Parse + valida WHATSAPP_GROUP_JIDS do env. Filtra entries vazios,
// rejeita JIDs sem @g.us (com warning loud), e dedupe via Set.
function parseGroupJids(): string[] {
  const raw = process.env.WHATSAPP_GROUP_JIDS ?? "";
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const item of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (!item.endsWith("@g.us")) {
      invalid.push(item);
      continue;
    }
    if (seen.has(item)) continue;
    seen.add(item);
    valid.push(item);
  }
  if (invalid.length > 0) {
    log.warn(
      { invalid, valid_count: valid.length },
      "[group-cleanup] WHATSAPP_GROUP_JIDS contem JIDs invalidos (sem @g.us)",
    );
  }
  return valid;
}

export async function runGroupCleanup(): Promise<{
  warned: number;
  removed: number;
  failed: number;
  skipped: number;
  no_admin: number;
  candidates: number;
}> {
  const stats = {
    warned: 0,
    removed: 0,
    failed: 0,
    skipped: 0,
    no_admin: 0,
    candidates: 0,
  };

  const groupJids = parseGroupJids();
  if (groupJids.length === 0) {
    log.warn("[group-cleanup] WHATSAPP_GROUP_JIDS vazio, skip");
    return stats;
  }

  // FIX (review#3): pra remocao SEMPRE usa instancia default (a que eh
  // admin nos grupos), nao a sticky de marketing — sticky pode ser uma
  // instancia que NAO eh admin do grupo, gerando loop infinito de
  // 'instance_not_admin' nos logs.
  const adminInstance =
    process.env.WHATSAPP_DEFAULT_INSTANCE ?? "metodotts";

  const supabase = getSupabase();

  const { data: profilesData, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, name, whatsapp, plan_status, plan_active, role, whatsapp_opt_in, group_removal_warned_at, group_removed_at",
    )
    .eq("plan_active", false)
    .in("plan_status", ["canceled", "inactive", "refunded", "chargeback"])
    .not("whatsapp", "is", null)
    .is("group_removed_at", null)
    .limit(GROUP_CLEANUP_MAX_USERS_PER_TICK);

  if (pErr) {
    log.error({ err: pErr }, "[group-cleanup] erro buscar candidatos");
    return stats;
  }

  const candidates = (profilesData ?? []).filter(
    (p) => p.role !== "admin" && p.role !== "crm_agent",
  ) as Array<{
    id: string;
    name: string | null;
    whatsapp: string | null;
    plan_status: string | null;
    plan_active: boolean;
    role: string | null;
    whatsapp_opt_in: boolean;
    group_removal_warned_at: string | null;
    group_removed_at: string | null;
  }>;

  stats.candidates = candidates.length;
  if (candidates.length === 0) return stats;

  // FIX (incidente 2026-06-20): aluna pode ter 2 cadastros com o MESMO
  // whatsapp — um cancelado, outro ativo (recomprou apos refund com email
  // novo). Sem este check, removiamos pelo phone da cancelada e a aluna
  // ativa caia do grupo (mesmo numero, Evolution nao diferencia profile).
  // Carrega Set de phones que tem PELO MENOS 1 profile ativo. Se a
  // candidata tem phone nesse set, skip + marca como tratada (warned_at +
  // removed_at agora) pra nao reentrar no ciclo eternamente.
  const { data: activeData, error: aErr } = await supabase
    .from("profiles")
    .select("id, whatsapp")
    .eq("plan_active", true)
    .not("whatsapp", "is", null);
  if (aErr) {
    log.error({ err: aErr }, "[group-cleanup] erro buscar phones ativos");
    return stats;
  }
  const activeByPhone = new Map<string, string[]>();
  for (const row of activeData ?? []) {
    const norm = normalizePhoneBR(row.whatsapp as string | null);
    if (!norm) continue;
    const arr = activeByPhone.get(norm) ?? [];
    arr.push(row.id as string);
    activeByPhone.set(norm, arr);
  }

  log.info(
    { candidates: candidates.length, groupJids: groupJids.length },
    "[group-cleanup] inicio",
  );

  const now = new Date();
  const nowMs = now.getTime();

  for (const profile of candidates) {
    const phone = normalizePhoneBR(profile.whatsapp ?? null);
    if (!phone) {
      stats.skipped++;
      continue;
    }

    // PHONE OVERLAP: se este phone tambem pertence a outra profile com
    // plano ATIVO, NUNCA enviar warning nem remover (Evolution remove pelo
    // numero, aluna ativa sairia do grupo). Marca como tratada (warned_at
    // + removed_at = agora) pra sair do ciclo. Se a profile ativa cancelar
    // depois, ELA mesma sera processada normalmente — o phone vai sair do
    // Set activeByPhone na proxima execucao.
    const overlapIds = activeByPhone.get(phone);
    if (overlapIds && overlapIds.length > 0) {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          group_removal_warned_at: now.toISOString(),
          group_removed_at: now.toISOString(),
        })
        .eq("id", profile.id);
      if (updErr) {
        log.error(
          { err: updErr, userId: profile.id },
          "[group-cleanup] update phone_overlap skip falhou",
        );
        stats.failed++;
      } else {
        await insertGroupAudit(
          supabase,
          profile.id,
          "skipped",
          "phone_overlap_with_active",
          { active_profile_ids: overlapIds },
        );
        stats.skipped++;
      }
      await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
      continue;
    }

    // ====== ETAPA A: ainda nao avisada ======
    if (profile.group_removal_warned_at == null) {
      if (profile.whatsapp_opt_in === false) {
        const { error: updErr } = await supabase
          .from("profiles")
          .update({ group_removal_warned_at: now.toISOString() })
          .eq("id", profile.id);
        if (updErr) {
          log.warn(
            { err: updErr, userId: profile.id },
            "[group-cleanup] update warned_at (opt-out) falhou",
          );
          stats.failed++;
        } else {
          await insertGroupAudit(
            supabase,
            profile.id,
            "skipped",
            "opt_out_no_warning",
            {},
          );
          stats.skipped++;
        }
        await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
        continue;
      }

      // FIX (review#4): dedup defensivo — se warned_at falhou de
      // persistir em ciclo anterior mas enqueueOutbox rolou, este check
      // evita reenviar. Janela 23h porque tick eh hourly e queremos
      // garantir 1 aviso por ciclo de 24h.
      const recentlyWarned = await alreadyReceivedRecently(
        supabase,
        profile.id,
        TRIGGER_GROUP_REMOVAL_WARNING_KEY,
        23,
      );
      if (recentlyWarned) {
        log.info(
          { userId: profile.id },
          "[group-cleanup] aviso ja foi enviado nas ultimas 23h, marcando warned_at sem reenviar",
        );
        const { error: updErr } = await supabase
          .from("profiles")
          .update({ group_removal_warned_at: now.toISOString() })
          .eq("id", profile.id);
        if (updErr) {
          log.warn({ err: updErr, userId: profile.id }, "[group-cleanup] update warned_at (dedup) falhou");
          stats.failed++;
        } else {
          await insertGroupAudit(
            supabase,
            profile.id,
            "skipped",
            "warning_already_in_outbox",
            {},
          );
          stats.skipped++;
        }
        await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
        continue;
      }

      const { text } = buildTriggerGroupRemovalWarning({
        firstName: profile.name,
      });
      const enq = await enqueueOutbox(supabase, {
        userId: profile.id,
        phone,
        templateKey: TRIGGER_GROUP_REMOVAL_WARNING_KEY,
        text,
        metadata: { kind: "group_removal_warning" },
      });

      if (!enq.ok) {
        await insertGroupAudit(
          supabase,
          profile.id,
          "failed",
          `warn_enqueue_${enq.reason}`,
          {},
        );
        stats.failed++;
        await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
        continue;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ group_removal_warned_at: now.toISOString() })
        .eq("id", profile.id);
      if (updErr) {
        // Enqueue rolou mas UPDATE falhou. Proximo ciclo o dedup
        // defensivo (alreadyReceivedRecently) ja pega — nao vai
        // reenviar. Marca como failed pra alerta.
        log.error(
          { err: updErr, userId: profile.id, outbox_id: enq.outbox_id },
          "[group-cleanup] UPDATE warned_at falhou apos enqueue (dedup defensivo cobre proximo tick)",
        );
        await insertGroupAudit(
          supabase,
          profile.id,
          "failed",
          "warn_update_failed",
          { outbox_id: enq.outbox_id, error: updErr.message },
        );
        stats.failed++;
      } else {
        await insertGroupAudit(
          supabase,
          profile.id,
          "warned",
          "warning_enqueued",
          { outbox_id: enq.outbox_id },
        );
        stats.warned++;
      }
      await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
      continue;
    }

    // ====== ETAPA B: avisada — 24h ja passou? ======
    const warnedAtMs = new Date(profile.group_removal_warned_at).getTime();
    if (!Number.isFinite(warnedAtMs) || nowMs - warnedAtMs < GROUP_CLEANUP_WARN_DELAY_MS) {
      stats.skipped++;
      continue;
    }

    let anySuccess = false;
    let anyAlreadyOut = false;
    let anyNoAdmin = false;
    let anyEvoError = false;
    const perGroup: Array<Record<string, unknown>> = [];

    for (const groupJid of groupJids) {
      const result = await removeParticipantFromGroup({
        instanceName: adminInstance,
        groupJid,
        phone,
      });

      if (result.ok) {
        anySuccess = true;
        perGroup.push({ groupJid, ok: true });
      } else {
        const msg = (result.error ?? "").toLowerCase();
        const isAlreadyOut =
          msg.includes("not-in-group") ||
          msg.includes("not a participant") ||
          msg.includes("not in group") ||
          msg.includes("nao esta no grupo");
        // FIX (review#3): remover substring 'admin' generico — qualquer
        // erro com a palavra 'admin' (URL, stack trace, etc) virava
        // falso positivo. So matches especificos do Baileys/HTTP.
        const isNoAdmin =
          msg.includes("not-authorized") ||
          msg.includes("forbidden") ||
          msg.includes("evo_403");

        if (isAlreadyOut) {
          anyAlreadyOut = true;
          perGroup.push({ groupJid, ok: true, alreadyOut: true });
        } else if (isNoAdmin) {
          anyNoAdmin = true;
          perGroup.push({ groupJid, ok: false, reason: "no_admin" });
        } else {
          anyEvoError = true;
          perGroup.push({ groupJid, ok: false, reason: "evo_error", error: result.error });
        }
      }
      await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_GROUPS_MS);
    }

    // FIX (review#2 — BLOCKER): so marca removed_at se TODOS os grupos
    // resolveram (success ou already_out). Se algum no_admin/evo_error
    // pendente, fica como failed pra retry quando admin promover/Evolution
    // estabilizar. Sem isso, aluna ficava eternamente em grupo nao-admin.
    const allResolved =
      (anySuccess || anyAlreadyOut) && !anyNoAdmin && !anyEvoError;

    if (allResolved) {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ group_removed_at: now.toISOString() })
        .eq("id", profile.id);
      if (updErr) {
        log.error(
          { err: updErr, userId: profile.id },
          "[group-cleanup] UPDATE removed_at falhou (proximo ciclo retenta)",
        );
        await insertGroupAudit(supabase, profile.id, "failed", "remove_update_failed", {
          groups: perGroup,
          error: updErr.message,
        });
        stats.failed++;
      } else {
        await insertGroupAudit(
          supabase,
          profile.id,
          "removed",
          anyAlreadyOut && !anySuccess ? "already_out" : "removed_from_group",
          { groups: perGroup },
        );
        stats.removed++;
      }
    } else if (anyNoAdmin) {
      // FIX (review nit): log.warn em vez de log.error pra nao poluir
      // alerting com instancia nao admin recorrente (admin precisa
      // promover manualmente; audit ja persiste o estado).
      log.warn(
        { userId: profile.id, instanceName: adminInstance, perGroup },
        "[group-cleanup] instancia nao eh admin em algum grupo — promover manualmente",
      );
      await insertGroupAudit(
        supabase,
        profile.id,
        "failed",
        anySuccess || anyAlreadyOut ? "instance_not_admin_partial" : "instance_not_admin",
        { groups: perGroup },
      );
      stats.no_admin++;
    } else {
      await insertGroupAudit(supabase, profile.id, "failed", "evo_error", {
        groups: perGroup,
      });
      stats.failed++;
    }

    await groupCleanupSleep(GROUP_CLEANUP_SLEEP_BETWEEN_USERS_MS);
  }

  log.info({ stats }, "[group-cleanup] done");
  return stats;
}

// FIX (review#1 — BLOCKER): single source of truth pro lock anti-overlap.
// Tanto o cron tick quanto o endpoint manual passam por aqui — assim 2
// invocacoes concorrentes nao geram aviso duplicado.
export async function runGroupCleanupWithLock(): Promise<
  | {
      ok: true;
      warned: number;
      removed: number;
      failed: number;
      skipped: number;
      no_admin: number;
      candidates: number;
    }
  | { ok: false; reason: "already_running" }
> {
  if (groupCleanupRunning) {
    return { ok: false, reason: "already_running" };
  }
  groupCleanupRunning = true;
  try {
    const result = await runGroupCleanup();
    return { ok: true, ...result };
  } finally {
    groupCleanupRunning = false;
  }
}

// =================================================================
// WORKER (setInterval)
// =================================================================

let flushTimer: NodeJS.Timeout | null = null;
let triggersTimer: NodeJS.Timeout | null = null;
let expireTrialsTimer: NodeJS.Timeout | null = null;
let motivationalTimer: NodeJS.Timeout | null = null;
let checkinReminderTimer: NodeJS.Timeout | null = null;
let groupCleanupTimer: NodeJS.Timeout | null = null;
let flushRunning = false;
let expireRunning = false;
// groupCleanupRunning declarado mais acima (perto de runGroupCleanupWithLock)

export function startWhatsAppWorker() {
  if (process.env.WHATSAPP_WORKER_ENABLED === "false") {
    log.info("[whatsapp-worker] desabilitado via WHATSAPP_WORKER_ENABLED=false");
    return;
  }

  log.info(`[whatsapp-worker] iniciando — flush a cada ${FLUSH_INTERVAL_MS}ms`);

  // Flush a cada 1 min
  flushTimer = setInterval(() => {
    if (flushRunning) return; // anti-overlap
    flushRunning = true;
    void (async () => {
      try {
        const supabase = getSupabase();
        const stats = await flushOutbox(supabase);
        if (stats.processed > 0) {
          log.info(
            `[whatsapp-flush] processed=${stats.processed} sent=${stats.sent} failed=${stats.failed} skipped=${stats.skipped}`,
          );
        }
      } catch (err) {
        log.error({ err }, "[whatsapp-flush] erro");
      } finally {
        flushRunning = false;
      }
    })();
  }, FLUSH_INTERVAL_MS);

  // Triggers diarios — dispara 1x por dia entre 9h-10h BRT.
  // Checa a cada 5min (em vez de 1h) pra cobrir startup em qualquer momento.
  // Backfill: se o container subiu DEPOIS das 9h e o dia ainda nao
  // foi processado, dispara imediato ate as 23h (limite janela envio).
  let lastTriggersDay = "";

  const tickTriggers = async () => {
    try {
      const now = new Date();
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;
      const today = brtDateString(0);
      // Janela alvo: 9h BRT. Backfill: se subiu depois das 9h e ainda nao
      // rodou hoje, roda no proximo tick (entre 9h-22h).
      const inWindow = brtHour >= 9 && brtHour < 23;
      const shouldRun = inWindow && lastTriggersDay !== today;
      if (!shouldRun) return;
      lastTriggersDay = today;
      log.info("[whatsapp-triggers] disparando run diario");
      const result = await runAllTriggers();
      log.info({ result }, "[whatsapp-triggers] done");
    } catch (err) {
      log.error({ err }, "[whatsapp-triggers] erro");
    }
  };

  // Tick imediato no startup (cobre o caso "subiu depois das 9h"),
  // depois a cada 5 minutos.
  void tickTriggers();
  triggersTimer = setInterval(() => void tickTriggers(), 5 * 60 * 1000);

  // Blast motivacional diario as 8h BRT. Mesma logica de "1x/dia entre 8h-23h
  // com backfill" dos triggers. Pega TODAS opt_in alunas, escalonado 15s.
  let lastMotivationalDay = "";
  const tickMotivational = async () => {
    try {
      const now = new Date();
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;
      const today = brtDateString(0);
      const inWindow = brtHour >= 8 && brtHour < 23;
      const shouldRun = inWindow && lastMotivationalDay !== today;
      if (!shouldRun) return;
      lastMotivationalDay = today;
      log.info("[daily-motivational] disparando blast diario");
      const result = await runDailyMotivationalBlast();
      log.info({ result }, "[daily-motivational] done");
    } catch (err) {
      log.error({ err }, "[daily-motivational] erro");
    }
  };
  void tickMotivational();
  motivationalTimer = setInterval(() => void tickMotivational(), 5 * 60 * 1000);

  // Lembrete noturno de checkin: dispara a partir das 20:30 BRT, 1x/dia.
  // Pega quem opt_in + plan_active e NAO bateu daily_completions de hoje.
  // Backfill: se subiu depois das 20:30, roda no proximo tick (limite 23h).
  let lastCheckinReminderDay = "";
  const tickCheckinReminder = async () => {
    try {
      const now = new Date();
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;
      const brtMinutes = now.getUTCMinutes();
      const minutesPastMidnight = brtHour * 60 + brtMinutes;
      const today = brtDateString(0);
      // Janela: 20:30 BRT em diante ate 22:55 (queremos parar antes de 23h)
      const inWindow = minutesPastMidnight >= 20 * 60 + 30 && brtHour < 23;
      const shouldRun = inWindow && lastCheckinReminderDay !== today;
      if (!shouldRun) return;
      lastCheckinReminderDay = today;
      log.info("[lembrete-checkin] disparando lembrete noturno");
      const result = await runLembreteCheckin();
      log.info({ result }, "[lembrete-checkin] done");
    } catch (err) {
      log.error({ err }, "[lembrete-checkin] erro");
    }
  };
  void tickCheckinReminder();
  checkinReminderTimer = setInterval(() => void tickCheckinReminder(), 5 * 60 * 1000);

  // Expira trials a cada 30 minutos (independente dos triggers diarios).
  // Mantem dashboard, blast e KPIs sempre sincronizados — assim que um
  // trial vence, em ate 30min ele cai pra inactive automaticamente.
  // Anti-overlap: se ainda esta rodando da iteracao anterior, pula.
  const tickExpireTrials = async () => {
    if (expireRunning) return;
    expireRunning = true;
    try {
      const result = await expireTrials();
      if (result.expired > 0) {
        log.info({ expired: result.expired }, "[expire-trials] desativou trials vencidos");
      }
    } catch (err) {
      log.error({ err }, "[expire-trials] erro");
    } finally {
      expireRunning = false;
    }
  };
  // Tick imediato no startup pra limpar qualquer atraso, depois cada 30min
  void tickExpireTrials();
  expireTrialsTimer = setInterval(() => void tickExpireTrials(), 30 * 60 * 1000);

  // Group cleanup hourly: avisa 24h antes + remove do grupo das alunas
  // com plano cancelado. Anti-overlap via runGroupCleanupWithLock —
  // mesmo lock compartilhado com endpoint manual /whatsapp/group-cleanup/run.
  const tickGroupCleanup = async () => {
    try {
      const result = await runGroupCleanupWithLock();
      if (!result.ok) return; // already_running -> skip silencioso
      if (result.warned > 0 || result.removed > 0 || result.failed > 0 || result.no_admin > 0) {
        log.info({ result }, "[group-cleanup] tick done");
      }
    } catch (err) {
      log.error({ err }, "[group-cleanup] erro");
    }
  };
  void tickGroupCleanup();
  groupCleanupTimer = setInterval(() => void tickGroupCleanup(), GROUP_CLEANUP_INTERVAL_MS);
}

export function stopWhatsAppWorker() {
  if (flushTimer) clearInterval(flushTimer);
  if (triggersTimer) clearInterval(triggersTimer);
  if (expireTrialsTimer) clearInterval(expireTrialsTimer);
  if (motivationalTimer) clearInterval(motivationalTimer);
  if (checkinReminderTimer) clearInterval(checkinReminderTimer);
  if (groupCleanupTimer) clearInterval(groupCleanupTimer);
  flushTimer = null;
  triggersTimer = null;
  expireTrialsTimer = null;
  motivationalTimer = null;
  checkinReminderTimer = null;
  groupCleanupTimer = null;
}

// =================================================================
// HTTP HANDLERS (chamados por server.ts)
// =================================================================

export async function handleBlast(body: {
  mode?: string;
  test_phone?: string;
  test_name?: string;
  admin_user_id?: string;
}) {
  const supabase = getSupabase();

  if (body.mode === "test_admin") {
    const phone = (body.test_phone ?? "").trim();
    const name = (body.test_name ?? "admin").trim();
    const adminId = body.admin_user_id;
    if (!phone) return { ok: false, error: "missing_test_phone" };
    if (!adminId) return { ok: false, error: "missing_admin_user_id" };

    const entry = await pickNextMotivational(supabase, adminId);
    const text = renderMotivational(entry, { firstName: name });
    const r = await enqueueOutbox(supabase, {
      userId: adminId,
      phone,
      templateKey: entry.key,
      text,
      metadata: { campaign: "test_admin", theme: entry.theme },
      skipWeeklyLimit: true,
      skipOptInCheck: true,
    });
    if (!r.ok) {
      return {
        ok: false,
        reason: r.reason,
        template_key: entry.key,
        preview: text,
      };
    }
    return {
      ok: true,
      outbox_id: r.outbox_id,
      template_key: entry.key,
      theme: entry.theme,
      preview: text,
      sticky_assigned: r.sticky_assigned,
      note: "Mensagem enfileirada. Worker processa em até 1 min.",
    };
  }

  if (body.mode === "all_active") {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, whatsapp, plan_active, role")
      .not("whatsapp", "is", null)
      .eq("whatsapp_opt_in", true)
      .or("plan_active.eq.true,role.eq.admin");

    if (error) return { ok: false, error: error.message };

    const users = (profiles ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string | null,
      whatsapp: p.whatsapp as string | null,
    }));

    const campaign = `blast_${Date.now()}`;
    const result = await enqueueMotivationalBlast(supabase, users, { campaignKey: campaign });

    return {
      ok: true,
      campaign,
      total_users: users.length,
      ...result,
      note: `${result.enqueued} mensagens enfileiradas. Worker processa em background com cadência de 15s.`,
    };
  }

  return { ok: false, error: "invalid_mode" };
}

export async function handleStats() {
  const supabase = getSupabase();

  const todayStart = new Date();
  todayStart.setUTCHours(3, 0, 0, 0);
  if (todayStart.getTime() > Date.now()) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }
  const weekStart = new Date(Date.now() - 7 * 86400_000);

  const [
    usersWithWhatsapp,
    usersTotal,
    sentToday,
    sentWeek,
    pendingNow,
    failedWeek,
    recent,
    instances,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("whatsapp", "is", null)
      .eq("whatsapp_opt_in", true)
      .or("plan_active.eq.true,role.eq.admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("plan_active.eq.true,role.eq.admin"),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", todayStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", weekStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select(
        "id, user_id, template_key, status, phone, sent_at, created_at, error, message_text:text",
      )
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("whatsapp_instances")
      .select("id, name, display_name, is_active, priority, daily_limit, purpose")
      .order("priority", { ascending: true }),
  ]);

  type RawRecent = {
    id: string;
    user_id: string;
    template_key: string;
    status: string;
    phone: string;
    sent_at: string | null;
    created_at: string;
    error: string | null;
    message_text: string;
  };

  const rawRecent = (recent.data as RawRecent[] | null) ?? [];

  // Busca dados dos profiles em query separada (mais robusto que JOIN)
  const userIds = Array.from(new Set(rawRecent.map((r) => r.user_id)));
  const profilesById = new Map<string, { name: string | null; email: string }>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    for (const p of (profs ?? []) as { id: string; name: string | null; email: string }[]) {
      profilesById.set(p.id, { name: p.name, email: p.email });
    }
  }

  const recentRows = rawRecent.map((r) => {
    const p = profilesById.get(r.user_id);
    return {
      id: r.id,
      user_id: r.user_id,
      template_key: r.template_key,
      status: r.status,
      phone: r.phone,
      sent_at: r.sent_at,
      created_at: r.created_at,
      error: r.error,
      text: r.message_text,
      user_name: p?.name ?? null,
      user_email: p?.email ?? null,
    };
  });

  return {
    users_with_whatsapp: usersWithWhatsapp.count ?? 0,
    users_total: usersTotal.count ?? 0,
    sent_today: sentToday.count ?? 0,
    sent_week: sentWeek.count ?? 0,
    pending_now: pendingNow.count ?? 0,
    failed_week: failedWeek.count ?? 0,
    recent: recentRows,
    instances: instances.data ?? [],
  };
}

export async function handleFlushNow() {
  const supabase = getSupabase();
  // Admin clicando "Processar agora" -> ignora janela de horario (intencional)
  const stats = await flushOutbox(supabase, FLUSH_BATCH_SIZE, { bypassWindow: true });
  return { ok: true, ...stats, ran_at: new Date().toISOString() };
}

