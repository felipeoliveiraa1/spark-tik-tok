import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

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
 * GET /api/jornadas/[slug] — detalhe da jornada com aulas e progresso
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await auth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const { slug } = await ctx.params;
  const supabase = getServiceClient();

  const { data: journey, error: jErr } = await supabase
    .from("journeys")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (jErr) return json({ error: jErr.message }, { status: 500 });
  if (!journey) return json({ error: "not found" }, { status: 404 });

  // Bloqueio: aluna nao pode ver jornada admin-only
  if (!isAdmin && journey.is_admin_only) {
    return json({ error: "forbidden" }, { status: 403 });
  }
  if (!journey.is_published && !isAdmin) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  // Gate sequencial server-side: aluna comum precisa ter jornada anterior
  // (por order_index) completed pra acessar. Mesma logica do enrichedJourneys
  // no hub /jornadas, replicada server-side pra evitar bypass via URL direta.
  // Admin ignora (preview).
  if (!isAdmin && journey.order_index > 100) {
    const { data: prevJourney } = await supabase
      .from("journeys")
      .select("id")
      .eq("is_published", true)
      .eq("is_admin_only", false)
      .lt("order_index", journey.order_index)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prevJourney?.id) {
      const { data: prevProgress } = await supabase
        .from("journey_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("journey_id", prevJourney.id)
        .maybeSingle();
      if (prevProgress?.status !== "completed") {
        return json(
          { error: "complete previous journey first" },
          { status: 403 },
        );
      }
    }
  }

  // Modulos publicados da jornada (pode ser vazio em jornadas legacy)
  const { data: modulesRaw, error: mErr } = await supabase
    .from("journey_modules")
    .select("*")
    .eq("journey_id", journey.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (mErr) return json({ error: mErr.message }, { status: 500 });

  const publishedModuleIds = new Set((modulesRaw ?? []).map((m) => m.id as string));

  // Aulas publicadas — exclui as cujo modulo pai esta unpublished
  // (modulo deletado/unpublish nao some com as aulas; elas viram orfas e
  // continuam visiveis se nao tinham modulo OU se modulo continua publicado).
  const { data: lessons, error: lErr } = await supabase
    .from("journey_lessons")
    .select("*")
    .eq("journey_id", journey.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (lErr) return json({ error: lErr.message }, { status: 500 });

  const filteredLessons = (lessons ?? []).filter((l) => {
    const moduleId = (l as { module_id?: string | null }).module_id;
    if (!moduleId) return true; // legacy aula sem modulo
    return publishedModuleIds.has(moduleId);
  });

  const lessonIds = filteredLessons.map((l) => l.id as string);

  const [progressRes, lessonProgressRes, proofRes] = await Promise.all([
    supabase
      .from("journey_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("journey_id", journey.id)
      .maybeSingle(),
    lessonIds.length > 0
      ? supabase
          .from("journey_lesson_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", user.id)
          .in("lesson_id", lessonIds)
      : { data: [], error: null },
    supabase
      .from("journey_proofs")
      .select("*")
      .eq("user_id", user.id)
      .eq("journey_id", journey.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const completedMap = new Map<string, { completed: boolean; completed_at: string | null }>();
  for (const row of (lessonProgressRes.data ?? []) as Array<{
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
  }>) {
    completedMap.set(row.lesson_id, { completed: row.completed, completed_at: row.completed_at });
  }

  // Indexa modulos pra enriquecer cada lesson com module_slug + module_title.
  // Tambem agrupa lessons por modulo pra calcular gate inter-modulo:
  // - Dentro do modulo: aula N+1 trava ate N completar (sequencial scoped)
  // - Entre modulos: M2 inteiro trava ate M1 100% completar (gate inter-modulo)
  // - Lessons sem module_id (legacy): comportamento global antigo
  type ModuleRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    week_number: number | null;
    order_index: number;
    unlock_days_after_start?: number | null;
  };
  const moduleById = new Map<string, ModuleRow>();
  for (const m of (modulesRaw ?? []) as ModuleRow[]) {
    moduleById.set(m.id, m);
  }

  // Time-based unlock: cada modulo pode ter unlock_days_after_start.
  // Calcula timestamp de desbloqueio baseado em journey_progress.started_at.
  // Se aluna nao comecou, todos os modulos com unlock_days>0 ficam locked
  // (UI mostra "abre apos voce comecar a jornada").
  const progressStartedAt = progressRes.data?.started_at as string | null | undefined;
  const startedAtMs = progressStartedAt ? new Date(progressStartedAt).getTime() : null;
  const nowMs = Date.now();
  const moduleTimeLocked = new Map<string, { locked: boolean; unlocksAt: string | null }>();
  for (const m of (modulesRaw ?? []) as ModuleRow[]) {
    const days = m.unlock_days_after_start ?? 0;
    if (days <= 0) {
      moduleTimeLocked.set(m.id, { locked: false, unlocksAt: null });
      continue;
    }
    if (startedAtMs === null) {
      // Aluna nao comecou — modulo trava ate ela completar a primeira aula
      moduleTimeLocked.set(m.id, { locked: true, unlocksAt: null });
      continue;
    }
    const unlocksAtMs = startedAtMs + days * 24 * 60 * 60 * 1000;
    moduleTimeLocked.set(m.id, {
      locked: nowMs < unlocksAtMs,
      unlocksAt: new Date(unlocksAtMs).toISOString(),
    });
  }

  const lessonsByModule = new Map<string, typeof filteredLessons>();
  for (const l of filteredLessons) {
    const moduleId = (l as { module_id?: string | null }).module_id ?? "__no_module__";
    const arr = lessonsByModule.get(moduleId) ?? [];
    arr.push(l);
    lessonsByModule.set(moduleId, arr);
  }

  // Pra cada modulo, calcula se esta TODO completo (gate pro proximo)
  const moduleAllComplete = new Map<string, boolean>();
  for (const [moduleId, mlessons] of lessonsByModule.entries()) {
    const allDone =
      mlessons.length > 0 &&
      mlessons.every((l) => completedMap.get(l.id as string)?.completed ?? false);
    moduleAllComplete.set(moduleId, allDone);
  }

  // Determina locked por aula:
  // 1. Se lesson sem module_id (legacy): regra global antiga
  // 2. Se com module_id: prev_in_module deve estar completed + modulo anterior all_complete
  const orderedModuleIds = (modulesRaw ?? []).map((m) => m.id as string);
  const lessonsWithState = filteredLessons.map((l, globalIdx) => {
    const completed = completedMap.get(l.id as string)?.completed ?? false;
    const moduleId = (l as { module_id?: string | null }).module_id ?? null;
    const moduleRow = moduleId ? moduleById.get(moduleId) ?? null : null;

    let locked = false;
    if (!moduleId) {
      // Legacy: aula N+1 trava ate N completar (regra global)
      const prevCompleted =
        globalIdx === 0
          ? true
          : completedMap.get(filteredLessons[globalIdx - 1]?.id as string)?.completed ?? false;
      locked = !completed && !prevCompleted;
    } else {
      // Scoped: gate inter-modulo + time-based + sequencial dentro do modulo
      const moduleOrderIdx = orderedModuleIds.indexOf(moduleId);
      const prevModuleId = moduleOrderIdx > 0 ? orderedModuleIds[moduleOrderIdx - 1] : null;
      const prevModuleDone = prevModuleId ? (moduleAllComplete.get(prevModuleId) ?? true) : true;
      const timeLocked = moduleTimeLocked.get(moduleId)?.locked ?? false;
      if (!prevModuleDone || timeLocked) {
        locked = !completed;
      } else {
        const inModule = lessonsByModule.get(moduleId) ?? [];
        const inModuleIdx = inModule.findIndex((x) => x.id === l.id);
        const prevInModuleCompleted =
          inModuleIdx <= 0
            ? true
            : completedMap.get(inModule[inModuleIdx - 1]?.id as string)?.completed ?? false;
        locked = !completed && !prevInModuleCompleted;
      }
    }

    return {
      ...l,
      module_id: moduleId,
      module_slug: moduleRow?.slug ?? null,
      module_title: moduleRow?.title ?? null,
      module_order_index: moduleRow?.order_index ?? null,
      completed,
      completed_at: completedMap.get(l.id as string)?.completed_at ?? null,
      locked,
    };
  });

  // Enriquece modules[] com lessons aninhadas + stats por modulo
  const modules = (modulesRaw ?? []).map((m) => {
    const mlessons = lessonsByModule.get(m.id as string) ?? [];
    const completedInModule = mlessons.filter(
      (l) => completedMap.get(l.id as string)?.completed ?? false,
    ).length;
    const moduleOrderIdx = orderedModuleIds.indexOf(m.id as string);
    const prevModuleId = moduleOrderIdx > 0 ? orderedModuleIds[moduleOrderIdx - 1] : null;
    const prevModuleDone = prevModuleId ? (moduleAllComplete.get(prevModuleId) ?? true) : true;
    const timeLock = moduleTimeLocked.get(m.id as string);
    const timeLocked = timeLock?.locked ?? false;
    return {
      ...m,
      lesson_count: mlessons.length,
      lessons_completed: completedInModule,
      pct_complete:
        mlessons.length === 0 ? 0 : Math.round((completedInModule / mlessons.length) * 100),
      all_complete: moduleAllComplete.get(m.id as string) ?? false,
      locked: !prevModuleDone || timeLocked,
      time_locked: timeLocked,
      unlocks_at: timeLock?.unlocksAt ?? null,
    };
  });

  const totalLessons = lessonsWithState.length;
  const completedLessons = lessonsWithState.filter((l) => l.completed).length;
  const allLessonsComplete = totalLessons > 0 && completedLessons === totalLessons;
  const allModulesComplete =
    modules.length > 0 && modules.every((m) => m.all_complete);

  return json({
    journey,
    modules,
    lessons: lessonsWithState,
    progress: progressRes.data ?? null,
    proof: proofRes.data ?? null,
    stats: {
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      pct_complete: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      all_lessons_complete: allLessonsComplete,
      module_count: modules.length,
      modules_completed: modules.filter((m) => m.all_complete).length,
      all_modules_complete: allModulesComplete,
    },
  });
}
