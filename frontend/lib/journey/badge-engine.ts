/**
 * Badge engine — avalia criterios e concede badges ao usuario.
 *
 * Chamada apos cada evento XP (complete aula, prova aprovada, comentario,
 * stage_reached, etc) dos endpoints. Idempotente: ja tem badge -> skip.
 *
 * criteria_json shapes esperados (seedados em 0039):
 *   { kind: 'lesson_complete', count: 1 }
 *   { kind: 'journey_complete', journey_index?: number, count?: number }
 *   { kind: 'proof_approved', count: 1 }
 *   { kind: 'proof_sum', threshold: number }
 *   { kind: 'comment_count', threshold: number }
 *   { kind: 'likes_received', threshold: number }
 *   { kind: 'lesson_time', hour_min: number, hour_max: number }
 *   { kind: 'daily_lessons', threshold: number }
 *   { kind: 'streak_days', threshold: number }
 *   { kind: 'stage_reached', stage: 'adolescente'|'adulta' }
 *   { kind: 'pioneer', threshold: number }
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type EvalContext = {
  userId: string;
  eventKind?:
    | "lesson_complete"
    | "comment_post"
    | "proof_approved"
    | "journey_complete"
    | "stage_reached";
  meta?: Record<string, unknown>;
};

export type AwardedBadge = {
  badge_id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  xp_bonus: number;
};

type BadgeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  xp_bonus: number;
  criteria_json: Record<string, unknown>;
  is_active: boolean;
};

/**
 * Avalia TODOS os badges ativos contra o estado atual do user.
 * Retorna os recem-concedidos (insert em user_badges + xp_events).
 */
export async function evaluateBadgesForUser(
  supabase: SupabaseClient,
  ctx: EvalContext,
): Promise<AwardedBadge[]> {
  // 1) Carrega badges ativos
  const { data: badges } = await supabase
    .from("badges")
    .select("id, slug, title, description, icon_url, rarity, xp_bonus, criteria_json, is_active")
    .eq("is_active", true);
  if (!badges || badges.length === 0) return [];

  // 2) Filtra os que o user JA tem (skip)
  const { data: alreadyEarned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", ctx.userId);
  const earnedSet = new Set(
    (alreadyEarned ?? []).map((r) => r.badge_id as string),
  );
  const pending = (badges as BadgeRow[]).filter((b) => !earnedSet.has(b.id));
  if (pending.length === 0) return [];

  // 3) Pra cada pendente, avalia criterio
  const awarded: AwardedBadge[] = [];
  for (const badge of pending) {
    const matches = await evaluateCriteria(supabase, ctx, badge.criteria_json);
    if (!matches) continue;

    // 4) Insert idempotente em user_badges
    const { error: insErr } = await supabase
      .from("user_badges")
      .insert({ user_id: ctx.userId, badge_id: badge.id });
    if (insErr) {
      // Provavelmente race condition (PK violation). Skip silencioso.
      continue;
    }

    // 5) Registra xp_event do bonus (se houver)
    if (badge.xp_bonus > 0) {
      await supabase.from("journey_xp_events").insert({
        user_id: ctx.userId,
        kind: "badge_earned",
        ref_id: badge.id,
        xp_amount: badge.xp_bonus,
      });
    }

    // 6) Notificacao in-app
    await supabase.from("journey_notifications").insert({
      user_id: ctx.userId,
      kind: "badge_earned",
      title: `Badge desbloqueada: ${badge.title}`,
      body: badge.description,
      icon_url: badge.icon_url,
      ref_url: "/jornadas",
    });

    awarded.push({
      badge_id: badge.id,
      slug: badge.slug,
      title: badge.title,
      description: badge.description,
      icon_url: badge.icon_url,
      rarity: badge.rarity,
      xp_bonus: badge.xp_bonus,
    });
  }

  return awarded;
}

async function evaluateCriteria(
  supabase: SupabaseClient,
  ctx: EvalContext,
  criteria: Record<string, unknown>,
): Promise<boolean> {
  const kind = criteria.kind as string;
  if (!kind) return false;

  switch (kind) {
    case "lesson_complete": {
      const need = Number(criteria.count ?? 1);
      const { count } = await supabase
        .from("journey_lesson_progress")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .eq("completed", true);
      return (count ?? 0) >= need;
    }
    case "journey_complete": {
      const need = Number(criteria.count ?? 1);
      const { count } = await supabase
        .from("journey_progress")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .eq("status", "completed");
      return (count ?? 0) >= need;
    }
    case "proof_approved": {
      const need = Number(criteria.count ?? 1);
      const { count } = await supabase
        .from("journey_proofs")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .in("status", ["approved", "auto_approved"]);
      return (count ?? 0) >= need;
    }
    case "proof_sum": {
      const threshold = Number(criteria.threshold ?? 0);
      const { data } = await supabase
        .from("journey_proofs")
        .select("ocr_detected_sales")
        .eq("user_id", ctx.userId)
        .in("status", ["approved", "auto_approved"]);
      const total = (data ?? []).reduce(
        (acc, r) => acc + Number(r.ocr_detected_sales ?? 0),
        0,
      );
      return total >= threshold;
    }
    case "comment_count": {
      const threshold = Number(criteria.threshold ?? 0);
      const { count } = await supabase
        .from("journey_comments")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .eq("status", "visible");
      return (count ?? 0) >= threshold;
    }
    case "likes_received": {
      const threshold = Number(criteria.threshold ?? 0);
      // Conta likes em comentarios desse user (cross-table)
      const { data: myComments } = await supabase
        .from("journey_comments")
        .select("like_count")
        .eq("user_id", ctx.userId)
        .eq("status", "visible");
      const total = (myComments ?? []).reduce(
        (acc, c) => acc + Number(c.like_count ?? 0),
        0,
      );
      return total >= threshold;
    }
    case "lesson_time": {
      const hourMin = Number(criteria.hour_min ?? 0);
      const hourMax = Number(criteria.hour_max ?? 24);
      // Verifica se completou alguma aula na janela BRT (UTC-3)
      const { data } = await supabase
        .from("journey_lesson_progress")
        .select("completed_at")
        .eq("user_id", ctx.userId)
        .eq("completed", true);
      if (!data || data.length === 0) return false;
      for (const row of data) {
        if (!row.completed_at) continue;
        const utcHour = new Date(row.completed_at).getUTCHours();
        const brtHour = (utcHour - 3 + 24) % 24;
        if (brtHour >= hourMin && brtHour < hourMax) return true;
      }
      return false;
    }
    case "daily_lessons": {
      const threshold = Number(criteria.threshold ?? 0);
      // Conta aulas completadas no mesmo dia (BRT)
      const { data } = await supabase
        .from("journey_lesson_progress")
        .select("completed_at")
        .eq("user_id", ctx.userId)
        .eq("completed", true);
      if (!data) return false;
      const byDay = new Map<string, number>();
      for (const row of data) {
        if (!row.completed_at) continue;
        const d = new Date(row.completed_at);
        d.setUTCHours(d.getUTCHours() - 3); // BRT
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      }
      for (const count of byDay.values()) {
        if (count >= threshold) return true;
      }
      return false;
    }
    case "streak_days": {
      const threshold = Number(criteria.threshold ?? 0);
      const { data } = await supabase
        .from("journey_lesson_progress")
        .select("completed_at")
        .eq("user_id", ctx.userId)
        .eq("completed", true)
        .order("completed_at", { ascending: true });
      if (!data) return false;
      const days = new Set<string>();
      for (const row of data) {
        if (!row.completed_at) continue;
        const d = new Date(row.completed_at);
        d.setUTCHours(d.getUTCHours() - 3);
        days.add(d.toISOString().slice(0, 10));
      }
      const sorted = [...days].sort();
      let streak = 1;
      let max = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]!);
        const curr = new Date(sorted[i]!);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff === 1) {
          streak++;
          if (streak > max) max = streak;
        } else {
          streak = 1;
        }
      }
      return max >= threshold;
    }
    case "stage_reached": {
      const targetStage = String(criteria.stage ?? "");
      const { count } = await supabase
        .from("journey_progress")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", ctx.userId)
        .eq("status", "completed");
      const completed = count ?? 0;
      const actual = completed >= 2 ? "adulta" : completed >= 1 ? "adolescente" : "bebe";
      return actual === targetStage;
    }
    case "pioneer": {
      const threshold = Number(criteria.threshold ?? 50);
      // Counta quantos usuarios ja interagiram com qualquer jornada (xp_event)
      const { data: distinctUsers } = await supabase
        .from("journey_xp_events")
        .select("user_id")
        .order("created_at", { ascending: true })
        .limit(threshold);
      if (!distinctUsers) return false;
      const earlyUsers = new Set<string>();
      for (const r of distinctUsers) earlyUsers.add(r.user_id as string);
      return earlyUsers.has(ctx.userId);
    }
    default:
      return false;
  }
}
