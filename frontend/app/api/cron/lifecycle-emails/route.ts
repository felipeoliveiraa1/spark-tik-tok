/**
 * /api/cron/lifecycle-emails
 * ─────────────────────────────────────────────────────────────────
 * Endpoint de cron diario que dispara emails do ciclo de vida da aluna:
 *   - Onboarding D+1 / D+3 / D+7 / D+14  (nudge pra usar o app)
 *   - Renewal 3d / 1d                      (aviso de cobranca proxima)
 *   - Winback D+3 / D+14 / D+30            (recuperacao apos cancelamento)
 *
 * Configuracao em vercel.json:
 * ```json
 * {
 *   "crons": [
 *     { "path": "/api/cron/lifecycle-emails", "schedule": "0 12 * * *" }
 *   ]
 * }
 * ```
 * Roda 1x/dia as 12h UTC = 9h BRT (evita disparar em horario ruim pra aluna).
 *
 * Seguranca: header `Authorization: Bearer $VERCEL_CRON_SECRET`. Vercel Cron
 * envia automaticamente; chamada externa sem o header retorna 401.
 *
 * Estrategia:
 *   - Executa cada etapa SEQUENCIAL (nao paralelo) pra respeitar rate limit
 *     do Resend (10 req/s no plano Pro) e nao explodir conexao do Supabase.
 *   - Cada disparo grava linha em `email_events` com `dedup_key` UNIQUE,
 *     entao mesmo se o cron rodar duas vezes no mesmo dia nao dispara duplicado.
 *   - Falha individual (1 email quebrado) NAO para o cron — loga e segue.
 *
 * Retorna:
 * ```json
 * { "processed": 42, "sent": 40, "errors": 2, "by_kind": { "onboarding_d1": {...}, ... } }
 * ```
 */

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resend";
import { buildOnboardingD1Email } from "@/lib/email-templates/onboarding-d1";
import { buildOnboardingD3Email } from "@/lib/email-templates/onboarding-d3";
import { buildOnboardingD7Email } from "@/lib/email-templates/onboarding-d7";
import { buildOnboardingD14Email } from "@/lib/email-templates/onboarding-d14";
import { buildRenewalIn3DaysEmail } from "@/lib/email-templates/renewal-3d";
import { buildRenewal1dEmail } from "@/lib/email-templates/renewal-1d";
import { buildWinbackD3Email } from "@/lib/email-templates/winback-d3";
import { buildWinbackD14Email } from "@/lib/email-templates/winback-d14";
import { buildWinbackD30Email } from "@/lib/email-templates/winback-d30";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Timeout maior — cron pode processar centenas de alunas em sequencia.
export const maxDuration = 300;

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────

/**
 * Delay entre envios pra ficar folgado no rate limit do Resend (10 req/s no Pro).
 * 300ms = ~3 req/s, seguro.
 */
const SEND_DELAY_MS = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.metodotts.app";
const LOGIN_URL = `${SITE_URL}/login`;

type Kind =
  | "onboarding_d1"
  | "onboarding_d3"
  | "onboarding_d7"
  | "onboarding_d14"
  | "renewal_3d"
  | "renewal_1d"
  | "winback_d3"
  | "winback_d14"
  | "winback_d30";

type KindStat = {
  candidates: number;
  sent: number;
  errors: number;
  skipped_dedup: number;
};

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | null;
  plan_next_payment: string | null;
  plan_status: string | null;
  plan_canceled_at: string | null;
};

// ─────────────────────────────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (!secret) {
    // Sem secret configurado, so aceita em dev local
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization") ?? "";
  // Vercel Cron manda "Bearer <secret>"; aceitamos tambem plain pra facilitar teste manual.
  if (header === `Bearer ${secret}`) return true;
  if (header === secret) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────
// Supabase (service role — bypassa RLS)
// ─────────────────────────────────────────────────────────────────

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─────────────────────────────────────────────────────────────────
// Helpers de tempo
// ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Janela de 1h atras a partir do ponto exato (agora - Nd). */
function windowNDaysAgo(days: number): { start: string; end: string } {
  const end = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Janela de 1h a frente a partir do ponto exato (agora + Nd). */
function windowNDaysAhead(days: number): { start: string; end: string } {
  const start = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** YYYY-MM-DD em UTC — usado no dedup_key pra garantir 1x/dia por kind. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────

const PROFILE_COLS =
  "id, email, name, created_at, plan_next_payment, plan_status, plan_canceled_at";

/**
 * Filtra da lista de candidatos os que ja receberam email desse kind
 * (baseado em email_events.kind ou dedup_key). Retorna so os que faltam receber.
 */
async function excludeAlreadySent(
  supa: SupabaseClient,
  candidates: Profile[],
  kind: Kind,
  useDailyDedup: boolean,
): Promise<Profile[]> {
  if (candidates.length === 0) return [];

  const ids = candidates.map((c) => c.id);

  if (useDailyDedup) {
    // Renewals/winbacks: dedup por dia (evita mandar 2x se cron rodar 2 vezes hoje)
    const today = todayKey();
    const dedupKeys = ids.map((id) => `${kind}:${id}:${today}`);
    const { data, error } = await supa
      .from("email_events")
      .select("dedup_key")
      .in("dedup_key", dedupKeys);
    if (error) {
      console.error(`[cron/lifecycle] excludeAlreadySent(${kind}) daily error`, error);
      return candidates; // fail-safe: nao remove ninguem, ainda tem UNIQUE no INSERT
    }
    const already = new Set((data ?? []).map((r) => r.dedup_key as string));
    return candidates.filter(
      (c) => !already.has(`${kind}:${c.id}:${today}`),
    );
  }

  // Onboarding: dedup por kind (uma vez na vida por aluna)
  const { data, error } = await supa
    .from("email_events")
    .select("profile_id")
    .eq("kind", kind)
    .in("profile_id", ids);
  if (error) {
    console.error(`[cron/lifecycle] excludeAlreadySent(${kind}) error`, error);
    return candidates;
  }
  const already = new Set((data ?? []).map((r) => r.profile_id as string));
  return candidates.filter((c) => !already.has(c.id));
}

/**
 * Filtra alunas que ja completaram pelo menos 1 aula (usado nos onboarding D+3+).
 * Se ja engajou, nao precisa levar cutucao — evita spam pra quem ta ativa.
 */
async function excludeActiveLearners(
  supa: SupabaseClient,
  candidates: Profile[],
): Promise<Profile[]> {
  if (candidates.length === 0) return [];
  const ids = candidates.map((c) => c.id);
  const { data, error } = await supa
    .from("journey_lesson_progress")
    .select("profile_id")
    .in("profile_id", ids)
    .not("completed_at", "is", null);
  if (error) {
    console.error("[cron/lifecycle] excludeActiveLearners error", error);
    return candidates;
  }
  const active = new Set((data ?? []).map((r) => r.profile_id as string));
  return candidates.filter((c) => !active.has(c.id));
}

// ─────────────────────────────────────────────────────────────────
// Send + track
// ─────────────────────────────────────────────────────────────────

type BuiltEmail = { subject: string; text: string; html: string };

/**
 * Envia 1 email e grava email_events. Idempotente via dedup_key UNIQUE:
 * se ja existir, o INSERT falha e NAO enviamos (proteção contra race).
 *
 * Estrategia: INSERT ANTES do send. Se INSERT der conflict, aborta. Se send
 * falhar, grava sent_at=null + meta.error pra permitir retry manual depois.
 */
async function sendAndTrack(
  supa: SupabaseClient,
  args: {
    profile: Profile;
    kind: Kind;
    dedupKey: string;
    built: BuiltEmail;
  },
): Promise<"sent" | "skipped_dedup" | "error"> {
  const { profile, kind, dedupKey, built } = args;
  if (!profile.email) return "error";

  // 1) reserva o slot (dedup atomica)
  const { error: insertErr } = await supa.from("email_events").insert({
    profile_id: profile.id,
    kind,
    dedup_key: dedupKey,
    sent_at: null,
    meta: { to: profile.email, subject: built.subject },
  });
  if (insertErr) {
    // 23505 = unique_violation → outro cron ja pegou
    if (insertErr.code === "23505") return "skipped_dedup";
    console.error(`[cron/lifecycle] insert email_events(${kind}) error`, insertErr);
    return "error";
  }

  // 2) manda o email
  const result = await sendEmail({
    to: profile.email,
    subject: built.subject,
    text: built.text,
    html: built.html,
    tags: [
      { name: "kind", value: kind },
      { name: "profile_id", value: profile.id },
    ],
  });

  // 3) atualiza sent_at + meta com resultado real
  if (result.ok) {
    await supa
      .from("email_events")
      .update({
        sent_at: new Date().toISOString(),
        meta: { to: profile.email, subject: built.subject, resend_id: result.id },
      })
      .eq("dedup_key", dedupKey);
    return "sent";
  } else {
    await supa
      .from("email_events")
      .update({
        meta: {
          to: profile.email,
          subject: built.subject,
          error: result.error,
          failed_at: new Date().toISOString(),
        },
      })
      .eq("dedup_key", dedupKey);
    console.error(
      `[cron/lifecycle] send(${kind}) failed for ${profile.email}: ${result.error}`,
    );
    return "error";
  }
}

/** Processa uma lista de candidatos SEQUENCIAL com delay entre envios. */
async function processBatch(
  supa: SupabaseClient,
  candidates: Profile[],
  kind: Kind,
  buildFor: (p: Profile) => BuiltEmail | null,
  dedupKeyFor: (p: Profile) => string,
  stats: KindStat,
): Promise<void> {
  for (const profile of candidates) {
    if (!profile.email) {
      stats.errors += 1;
      continue;
    }
    let built: BuiltEmail | null = null;
    try {
      built = buildFor(profile);
    } catch (err) {
      console.error(`[cron/lifecycle] build(${kind}) threw`, err);
      stats.errors += 1;
      continue;
    }
    if (!built) {
      stats.errors += 1;
      continue;
    }

    let outcome: "sent" | "skipped_dedup" | "error";
    try {
      outcome = await sendAndTrack(supa, {
        profile,
        kind,
        dedupKey: dedupKeyFor(profile),
        built,
      });
    } catch (err) {
      // Falha silenciosa: 1 email quebrado nao para o cron
      console.error(`[cron/lifecycle] sendAndTrack(${kind}) threw`, err);
      stats.errors += 1;
      await sleep(SEND_DELAY_MS);
      continue;
    }

    if (outcome === "sent") stats.sent += 1;
    else if (outcome === "skipped_dedup") stats.skipped_dedup += 1;
    else stats.errors += 1;

    await sleep(SEND_DELAY_MS);
  }
}

function emptyStat(): KindStat {
  return { candidates: 0, sent: 0, errors: 0, skipped_dedup: 0 };
}

// ─────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────

async function stepOnboardingDay(
  supa: SupabaseClient,
  day: 1 | 3 | 7 | 14,
  buildFn: (p: Profile) => BuiltEmail | null,
  filterActive: boolean,
): Promise<KindStat> {
  const kind: Kind = `onboarding_d${day}` as Kind;
  const stat = emptyStat();
  const { start, end } = windowNDaysAgo(day);

  const { data, error } = await supa
    .from("profiles")
    .select(PROFILE_COLS)
    .gte("created_at", start)
    .lte("created_at", end)
    .not("email", "is", null);

  if (error) {
    console.error(`[cron/lifecycle] query ${kind} error`, error);
    return stat;
  }

  let candidates = (data ?? []) as Profile[];
  stat.candidates = candidates.length;

  candidates = await excludeAlreadySent(supa, candidates, kind, false);
  if (filterActive) {
    candidates = await excludeActiveLearners(supa, candidates);
  }

  await processBatch(
    supa,
    candidates,
    kind,
    buildFn,
    (p) => `${kind}:${p.id}`, // uma vez na vida
    stat,
  );
  return stat;
}

async function stepRenewal(
  supa: SupabaseClient,
  daysAhead: 3 | 1,
  buildFn: (p: Profile) => BuiltEmail | null,
): Promise<KindStat> {
  const kind: Kind = `renewal_${daysAhead}d` as Kind;
  const stat = emptyStat();
  const { start, end } = windowNDaysAhead(daysAhead);

  const { data, error } = await supa
    .from("profiles")
    .select(PROFILE_COLS)
    .gte("plan_next_payment", start)
    .lte("plan_next_payment", end)
    .eq("plan_status", "active")
    .not("email", "is", null);

  if (error) {
    console.error(`[cron/lifecycle] query ${kind} error`, error);
    return stat;
  }

  let candidates = (data ?? []) as Profile[];
  stat.candidates = candidates.length;

  // Renewals: dedup POR DIA (pode mandar de novo mes que vem)
  candidates = await excludeAlreadySent(supa, candidates, kind, true);

  const today = todayKey();
  await processBatch(
    supa,
    candidates,
    kind,
    buildFn,
    (p) => `${kind}:${p.id}:${today}`,
    stat,
  );
  return stat;
}

async function stepWinback(
  supa: SupabaseClient,
  day: 3 | 14 | 30,
  buildFn: (p: Profile) => BuiltEmail | null,
): Promise<KindStat> {
  const kind: Kind = `winback_d${day}` as Kind;
  const stat = emptyStat();
  const { start, end } = windowNDaysAgo(day);

  const { data, error } = await supa
    .from("profiles")
    .select(PROFILE_COLS)
    .gte("plan_canceled_at", start)
    .lte("plan_canceled_at", end)
    .eq("plan_status", "canceled")
    .not("email", "is", null);

  if (error) {
    console.error(`[cron/lifecycle] query ${kind} error`, error);
    return stat;
  }

  let candidates = (data ?? []) as Profile[];
  stat.candidates = candidates.length;

  // Winback: dedup por kind (uma vez na vida por cancelamento — se voltar e cancelar de novo, nao rearma)
  candidates = await excludeAlreadySent(supa, candidates, kind, false);

  await processBatch(
    supa,
    candidates,
    kind,
    buildFn,
    (p) => `${kind}:${p.id}`,
    stat,
  );
  return stat;
}

// ─────────────────────────────────────────────────────────────────
// Builders (adapta o Profile -> input dos templates)
// ─────────────────────────────────────────────────────────────────

function firstNameOf(p: Profile): string {
  const first = (p.name ?? "").trim().split(/\s+/)[0];
  return first || (p.email ? p.email.split("@")[0] : "aluna");
}

function daysFromNow(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((then - now) / (24 * 60 * 60 * 1000)));
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((now - then) / (24 * 60 * 60 * 1000)));
}

// ─────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const supa = getServiceClient();
  const by_kind: Record<Kind, KindStat> = {
    onboarding_d1: emptyStat(),
    onboarding_d3: emptyStat(),
    onboarding_d7: emptyStat(),
    onboarding_d14: emptyStat(),
    renewal_3d: emptyStat(),
    renewal_1d: emptyStat(),
    winback_d3: emptyStat(),
    winback_d14: emptyStat(),
    winback_d30: emptyStat(),
  };

  // ─── ONBOARDING ────────────────────────────────────────────────
  // D+1: sempre (recem chegou, ainda nao teve tempo de engajar)
  by_kind.onboarding_d1 = await stepOnboardingDay(
    supa,
    1,
    (p) =>
      buildOnboardingD1Email({
        firstName: firstNameOf(p),
      }),
    false,
  );

  // D+3, D+7, D+14: so pra quem NAO engajou (sem aula completa)
  by_kind.onboarding_d3 = await stepOnboardingDay(
    supa,
    3,
    (p) =>
      buildOnboardingD3Email({
        firstName: firstNameOf(p),
      }),
    true,
  );

  by_kind.onboarding_d7 = await stepOnboardingDay(
    supa,
    7,
    (p) =>
      buildOnboardingD7Email({
        firstName: firstNameOf(p),
      }),
    true,
  );

  by_kind.onboarding_d14 = await stepOnboardingDay(
    supa,
    14,
    (p) =>
      buildOnboardingD14Email({
        firstName: firstNameOf(p),
      }),
    true,
  );

  // ─── RENEWAL ───────────────────────────────────────────────────
  by_kind.renewal_3d = await stepRenewal(supa, 3, (p) =>
    buildRenewalIn3DaysEmail({
      firstName: firstNameOf(p),
      nextPayment: p.plan_next_payment ?? "",
    }),
  );

  by_kind.renewal_1d = await stepRenewal(supa, 1, (p) =>
    buildRenewal1dEmail({
      firstName: firstNameOf(p),
      nextPayment: p.plan_next_payment ?? "",
    }),
  );

  // ─── WINBACK ───────────────────────────────────────────────────
  by_kind.winback_d3 = await stepWinback(supa, 3, (p) =>
    buildWinbackD3Email({
      firstName: firstNameOf(p),
    }),
  );

  by_kind.winback_d14 = await stepWinback(supa, 14, (p) =>
    buildWinbackD14Email({
      firstName: firstNameOf(p),
    }),
  );

  by_kind.winback_d30 = await stepWinback(supa, 30, (p) =>
    buildWinbackD30Email({
      firstName: firstNameOf(p),
    }),
  );

  // ─── Agregado ──────────────────────────────────────────────────
  let processed = 0;
  let sent = 0;
  let errors = 0;
  for (const stat of Object.values(by_kind)) {
    processed += stat.candidates;
    sent += stat.sent;
    errors += stat.errors;
  }

  const duration_ms = Date.now() - started;

  return NextResponse.json(
    {
      ok: true,
      processed,
      sent,
      errors,
      duration_ms,
      by_kind,
      ran_at: new Date().toISOString(),
    },
    { status: 200 },
  );
}
