import { NextResponse } from "next/server";
import {
  alreadyReceivedRecently,
  enqueueOutbox,
  getServiceClient,
} from "@/lib/whatsapp-campaigns";
import {
  TRIGGER_DIA1_NAO_LOGOU_KEY,
  TRIGGER_SUMIU_7D_KEY,
  TRIGGER_STREAK_3_KEY,
  buildTriggerDia1NaoLogou,
  buildTriggerSumiu7d,
  buildTriggerStreak3,
} from "@/lib/whatsapp-templates/motivational";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/whatsapp-triggers
 *
 * 1x por dia (Vercel cron). Varre 3 triggers e enfileira mensagens
 * pra quem se qualifica:
 *
 *   - dia1_nao_logou: criou conta ha 24-48h e nunca fez login
 *   - sumiu_7d:       last_seen_at entre 7 e 14 dias atras
 *   - streak_3:       bateu rotina nos ultimos 3 dias consecutivos
 *
 * Cada trigger tem dedup proprio (ja recebeu nas ultimas N horas?
 * pula). Limite semanal de 3 msgs/aluna eh checado no enqueueOutbox.
 */

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return true;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  const dia1 = await runTriggerDia1NaoLogou(supabase);
  const sumiu = await runTriggerSumiu7d(supabase);
  const streak = await runTriggerStreak3(supabase);

  return NextResponse.json({
    ok: true,
    ran_at: new Date().toISOString(),
    dia1_nao_logou: dia1,
    sumiu_7d: sumiu,
    streak_3: streak,
  });
}

// =================================================================
// TRIGGER 1: comprou ha 24-48h e nunca logou
// =================================================================

async function runTriggerDia1NaoLogou(supabase: ReturnType<typeof getServiceClient>) {
  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/login`
    : "https://www.metodotts.app/login";

  // Profiles criados entre 24h e 48h atras, com whatsapp, plan ativo
  const from = new Date(Date.now() - 48 * 3600_000).toISOString();
  const to = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp, created_at")
    .not("whatsapp", "is", null)
    .or("plan_active.eq.true,plan_status.eq.trial")
    .gte("created_at", from)
    .lte("created_at", to);

  // Pra cada uma, checa se logou alguma vez (admin.listUsers eh caro, faz uma so)
  const candidates = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];
  if (candidates.length === 0) {
    return { found: 0, enqueued: 0, skipped: 0 };
  }

  // Usa admin api: lista users e cruza
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const candidateIds = new Set(candidates.map((c) => c.id));
  const loggedInIds = new Set<string>();
  try {
    const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.last_sign_in_at && candidateIds.has(u.id)) {
        loggedInIds.add(u.id);
      }
    }
  } catch {
    // Falhou — sai sem fazer nada (melhor não enviar do que enviar errado)
    return { found: candidates.length, enqueued: 0, skipped: candidates.length, error: "list_users_failed" };
  }

  const targets = candidates.filter((c) => !loggedInIds.has(c.id));
  let enqueued = 0;
  let skipped = 0;

  for (const c of targets) {
    const already = await alreadyReceivedRecently(
      supabase,
      c.id,
      TRIGGER_DIA1_NAO_LOGOU_KEY,
      24 * 30, // 30 dias de dedup
    );
    if (already) {
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

// =================================================================
// TRIGGER 2: sumiu 7d (last_seen_at entre 7 e 14 dias)
// =================================================================

async function runTriggerSumiu7d(supabase: ReturnType<typeof getServiceClient>) {
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
    const already = await alreadyReceivedRecently(
      supabase,
      c.id,
      TRIGGER_SUMIU_7D_KEY,
      24 * 30,
    );
    if (already) {
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

// =================================================================
// TRIGGER 3: bateu rotina 3 dias seguidos (HOJE, ONTEM, ANTEONTEM)
// =================================================================

async function runTriggerStreak3(supabase: ReturnType<typeof getServiceClient>) {
  // Pega daily_completions dos ultimos 3 dias
  const d0 = brtDateString(0);
  const d1 = brtDateString(-1);
  const d2 = brtDateString(-2);

  const { data: completions } = await supabase
    .from("daily_completions")
    .select("user_id, date")
    .in("date", [d0, d1, d2]);

  // Conta dias por user
  const byUser = new Map<string, Set<string>>();
  for (const c of (completions ?? []) as { user_id: string; date: string }[]) {
    if (!byUser.has(c.user_id)) byUser.set(c.user_id, new Set());
    byUser.get(c.user_id)!.add(c.date);
  }

  // Streak completo = bateu nos 3 dias
  const streakUserIds = Array.from(byUser.entries())
    .filter(([, dates]) => dates.size === 3)
    .map(([uid]) => uid);

  if (streakUserIds.length === 0) {
    return { found: 0, enqueued: 0, skipped: 0 };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, whatsapp")
    .in("id", streakUserIds)
    .not("whatsapp", "is", null);

  const targets = (profiles ?? []) as { id: string; name: string | null; whatsapp: string }[];

  let enqueued = 0;
  let skipped = 0;
  for (const c of targets) {
    // Dedup 30 dias — se ja recebeu, nao manda de novo cedo
    const already = await alreadyReceivedRecently(
      supabase,
      c.id,
      TRIGGER_STREAK_3_KEY,
      24 * 30,
    );
    if (already) {
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
// HELPERS
// =================================================================

function brtDateString(deltaDays: number): string {
  const now = new Date();
  // Converte pra BRT (UTC-3) — sem horario de verao
  const brt = new Date(now.getTime() - 3 * 3600_000);
  brt.setUTCDate(brt.getUTCDate() + deltaDays);
  return brt.toISOString().slice(0, 10);
}
