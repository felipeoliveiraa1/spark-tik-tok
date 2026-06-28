import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { XP_RULES } from "@/lib/journey/xp-rules";
import { stageFromCompletedCount } from "@/lib/journey/character-stage";
import { evaluateBadgesForUser } from "@/lib/journey/badge-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/jornadas/[slug]/lesson/[lessonId]/complete
 *
 * Marca aula como concluida. Valida ordem linear (aulas anteriores precisam
 * estar completas). Soma XP. Atualiza journey_progress (current_lesson_id +
 * xp_total). Insere journey_xp_events pra audit.
 *
 * Idempotente: chamar 2x nao soma XP 2x.
 */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ slug: string; lessonId: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { slug, lessonId } = await ctx.params;
  const supabase = getServiceClient();

  // 1) Resolve jornada + valida aula pertence a ela
  const { data: lesson, error: lErr } = await supabase
    .from("journey_lessons")
    .select("id, journey_id, module_id, order_index, xp_reward, journeys!inner(slug)")
    .eq("id", lessonId)
    .maybeSingle();
  if (lErr || !lesson) return json({ error: "lesson not found" }, { status: 404 });
  const journeyRel = lesson.journeys as unknown as { slug: string } | { slug: string }[];
  const journeySlug = Array.isArray(journeyRel) ? journeyRel[0]?.slug : journeyRel?.slug;
  if (journeySlug !== slug) {
    return json({ error: "lesson does not belong to journey" }, { status: 400 });
  }

  // 2) Idempotencia: ja completada?
  const { data: existing } = await supabase
    .from("journey_lesson_progress")
    .select("completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existing?.completed) {
    return json({ ok: true, already_completed: true });
  }

  // 3) Valida ordem:
  //    - Sem module_id (legacy): aula N+1 trava ate N completar (regra global da jornada)
  //    - Com module_id: prev_in_module deve estar completed + modulo anterior all_complete
  const lessonModuleId = (lesson as { module_id: string | null }).module_id;
  if (!lessonModuleId) {
    // Legacy global
    const { data: priorLessons } = await supabase
      .from("journey_lessons")
      .select("id")
      .eq("journey_id", lesson.journey_id)
      .lt("order_index", lesson.order_index)
      .eq("is_published", true);
    const priorIds = (priorLessons ?? []).map((l) => l.id as string);
    if (priorIds.length > 0) {
      const { data: priorCompleted } = await supabase
        .from("journey_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", priorIds)
        .eq("completed", true);
      if ((priorCompleted?.length ?? 0) < priorIds.length) {
        return json({ error: "complete previous lessons first" }, { status: 409 });
      }
    }
  } else {
    // Scoped: gate inter-modulo + sequencial dentro do modulo

    // 3a) Busca todos os modulos publicados da jornada (ordenados)
    const { data: allModules } = await supabase
      .from("journey_modules")
      .select("id, order_index")
      .eq("journey_id", lesson.journey_id)
      .eq("is_published", true)
      .order("order_index", { ascending: true });
    const modules = allModules ?? [];
    const currentModule = modules.find((m) => m.id === lessonModuleId);
    if (!currentModule) {
      return json({ error: "module unpublished or deleted" }, { status: 409 });
    }

    // 3b) Modulo anterior deve estar 100% completo
    const prevModule = modules.find(
      (m) => m.order_index < currentModule.order_index,
    );
    const earlierModules = modules.filter((m) => m.order_index < currentModule.order_index);
    for (const m of earlierModules) {
      const { data: mLessons } = await supabase
        .from("journey_lessons")
        .select("id")
        .eq("module_id", m.id)
        .eq("is_published", true);
      const mLessonIds = (mLessons ?? []).map((l) => l.id as string);
      if (mLessonIds.length === 0) continue; // modulo vazio nao bloqueia
      const { data: mCompleted } = await supabase
        .from("journey_lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("lesson_id", mLessonIds);
      if ((mCompleted?.length ?? 0) < mLessonIds.length) {
        return json(
          { error: "complete previous module first", blocked_by_module: m.id },
          { status: 409 },
        );
      }
    }
    // prevModule eh usado so pra existir referencia; reusamos earlierModules acima
    void prevModule;

    // 3c) Dentro do modulo atual, prev_in_module deve estar completed
    const { data: priorInModule } = await supabase
      .from("journey_lessons")
      .select("id")
      .eq("module_id", lessonModuleId)
      .lt("order_index", lesson.order_index)
      .eq("is_published", true);
    const priorIds = (priorInModule ?? []).map((l) => l.id as string);
    if (priorIds.length > 0) {
      const { data: priorCompleted } = await supabase
        .from("journey_lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", priorIds)
        .eq("completed", true);
      if ((priorCompleted?.length ?? 0) < priorIds.length) {
        return json(
          { error: "complete previous lessons in this module first" },
          { status: 409 },
        );
      }
    }
  }

  // 4) Marca completa (upsert idempotente)
  const nowIso = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("journey_lesson_progress")
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: nowIso,
    });
  if (upErr) return json({ error: upErr.message }, { status: 500 });

  // 5) XP event + atualiza journey_progress
  const xpEarned = lesson.xp_reward ?? XP_RULES.lesson_complete;
  await supabase.from("journey_xp_events").insert({
    user_id: user.id,
    kind: "lesson_complete",
    ref_id: lessonId,
    xp_amount: xpEarned,
  });

  // Upsert journey_progress somando XP
  const { data: prog } = await supabase
    .from("journey_progress")
    .select("xp_total, status")
    .eq("user_id", user.id)
    .eq("journey_id", lesson.journey_id)
    .maybeSingle();

  const newXp = (prog?.xp_total ?? 0) + xpEarned;
  await supabase.from("journey_progress").upsert({
    user_id: user.id,
    journey_id: lesson.journey_id,
    current_lesson_id: lessonId,
    xp_total: newXp,
    started_at: prog ? undefined : nowIso,
  });

  // Stage derivado (jornadas completadas)
  const { count: completedJourneys } = await supabase
    .from("journey_progress")
    .select("journey_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");
  const characterStage = stageFromCompletedCount(completedJourneys ?? 0);

  // Avalia badges — pode conceder primeira-aula, madrugadora, coruja,
  // maratonista, consistente, etc. Fire-and-forget se quiser performance
  // mas aqui aguardamos pra retornar os badges no response.
  let awardedBadges: Awaited<ReturnType<typeof evaluateBadgesForUser>> = [];
  try {
    awardedBadges = await evaluateBadgesForUser(supabase, {
      userId: user.id,
      eventKind: "lesson_complete",
    });
  } catch (err) {
    console.warn("[complete] badge engine error:", err);
  }

  return json({
    ok: true,
    xp_earned: xpEarned,
    xp_total: newXp,
    character_stage: characterStage,
    badges_awarded: awardedBadges,
  });
}
