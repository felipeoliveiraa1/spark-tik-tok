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
import { log } from "./logger.js";
import {
  MOTIVATIONAL_LIBRARY,
  renderMotivational,
  TRIGGER_DIA1_NAO_LOGOU_KEY,
  TRIGGER_SUMIU_7D_KEY,
  TRIGGER_STREAK_3_KEY,
  buildTriggerDia1NaoLogou,
  buildTriggerSumiu7d,
  buildTriggerStreak3,
  type MotivationalEntry,
} from "./whatsapp-templates.js";

// =================================================================
// CONFIG
// =================================================================

export const BLAST_INTERVAL_MS = 4_500;
export const WEEKLY_MSG_LIMIT_PER_USER = 3;
export const HOUR_OPEN_BRT = 8;
export const HOUR_CLOSE_BRT = 22;
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
  if (!normalizedPhone) return { ok: false, reason: "phone_invalido" };

  if (!args.skipWeeklyLimit) {
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
): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  const now = new Date();
  if (!canSendNow(now)) return { processed: 0, sent: 0, failed: 0, skipped: 0 };

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

export async function runAllTriggers() {
  const supabase = getSupabase();
  const [dia1, sumiu, streak] = await Promise.all([
    runTriggerDia1NaoLogou(supabase),
    runTriggerSumiu7d(supabase),
    runTriggerStreak3(supabase),
  ]);
  return { dia1, sumiu, streak };
}

// =================================================================
// WORKER (setInterval)
// =================================================================

let flushTimer: NodeJS.Timeout | null = null;
let triggersTimer: NodeJS.Timeout | null = null;
let flushRunning = false;

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

  // Triggers diarios — checa a cada 1h se chegou a hora do disparo (9h BRT)
  let lastTriggersDay = "";
  triggersTimer = setInterval(() => {
    void (async () => {
      try {
        const now = new Date();
        const brtHour = (now.getUTCHours() - 3 + 24) % 24;
        const today = brtDateString(0);
        if (brtHour === 9 && lastTriggersDay !== today) {
          lastTriggersDay = today;
          log.info("[whatsapp-triggers] disparando run diario");
          const result = await runAllTriggers();
          log.info({ result }, "[whatsapp-triggers] done");
        }
      } catch (err) {
        log.error({ err }, "[whatsapp-triggers] erro");
      }
    })();
  }, 60 * 60 * 1000); // checa a cada 1h
}

export function stopWhatsAppWorker() {
  if (flushTimer) clearInterval(flushTimer);
  if (triggersTimer) clearInterval(triggersTimer);
  flushTimer = null;
  triggersTimer = null;
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
      note: `${result.enqueued} mensagens enfileiradas. Worker processa em background com cadência de 4.5s.`,
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
        "id, user_id, template_key, status, phone, sent_at, created_at, error, profiles!whatsapp_outbox_user_id_fkey(name, email)",
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
    profiles:
      | { name: string | null; email: string }
      | { name: string | null; email: string }[]
      | null;
  };

  const recentRows = ((recent.data as RawRecent[] | null) ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      user_id: r.user_id,
      template_key: r.template_key,
      status: r.status,
      phone: r.phone,
      sent_at: r.sent_at,
      created_at: r.created_at,
      error: r.error,
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
  const stats = await flushOutbox(supabase);
  return { ok: true, ...stats, ran_at: new Date().toISOString() };
}
