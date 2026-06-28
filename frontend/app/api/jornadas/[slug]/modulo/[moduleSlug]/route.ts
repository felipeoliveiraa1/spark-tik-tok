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
 * GET /api/jornadas/[slug]/modulo/[moduleSlug] — detalhe do modulo
 *
 * Retorna: { journey, module, lessons (com completed/locked scoped ao modulo),
 *           prev_module, next_module, all_complete }.
 *
 * Locked dentro do modulo: aula N+1 trava ate N completar (sequencial scoped).
 * O modulo INTEIRO esta locked se modulo anterior nao esta 100% completo — nesse
 * caso retornamos 403 (front redireciona pro hub).
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string; moduleSlug: string }> },
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

  const { slug, moduleSlug } = await ctx.params;
  const supabase = getServiceClient();

  // 1) Jornada
  const { data: journey, error: jErr } = await supabase
    .from("journeys")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (jErr) return json({ error: jErr.message }, { status: 500 });
  if (!journey) return json({ error: "not found" }, { status: 404 });

  if (!isAdmin && journey.is_admin_only) {
    return json({ error: "forbidden" }, { status: 403 });
  }
  if (!journey.is_published && !isAdmin) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  // 2) Modulo + todos os modulos da jornada (pra calcular prev/next + gate)
  const { data: allModules, error: mErr } = await supabase
    .from("journey_modules")
    .select("*")
    .eq("journey_id", journey.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (mErr) return json({ error: mErr.message }, { status: 500 });

  const modules = allModules ?? [];
  const currentModule = modules.find((m) => m.slug === moduleSlug);
  if (!currentModule) return json({ error: "module not found" }, { status: 404 });

  const currentIdx = modules.findIndex((m) => m.id === currentModule.id);
  const prevModule = currentIdx > 0 ? modules[currentIdx - 1] : null;
  const nextModule = currentIdx < modules.length - 1 ? modules[currentIdx + 1] : null;

  // 3) Aulas do modulo
  const { data: lessons, error: lErr } = await supabase
    .from("journey_lessons")
    .select("*")
    .eq("module_id", currentModule.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (lErr) return json({ error: lErr.message }, { status: 500 });

  const moduleLessons = lessons ?? [];
  const lessonIds = moduleLessons.map((l) => l.id as string);

  // 4) Progresso (do modulo + modulo anterior pra gate)
  const prevModuleLessonsRes = prevModule
    ? await supabase
        .from("journey_lessons")
        .select("id")
        .eq("module_id", prevModule.id)
        .eq("is_published", true)
    : { data: [], error: null };

  const prevModuleLessonIds = (prevModuleLessonsRes.data ?? []).map((l) => l.id as string);

  const allRelevantLessonIds = [...lessonIds, ...prevModuleLessonIds];

  const [progressRes, lessonProgressRes, proofRes] = await Promise.all([
    supabase
      .from("journey_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("journey_id", journey.id)
      .maybeSingle(),
    allRelevantLessonIds.length > 0
      ? supabase
          .from("journey_lesson_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", user.id)
          .in("lesson_id", allRelevantLessonIds)
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

  const completedSet = new Set<string>();
  const completedAtMap = new Map<string, string | null>();
  for (const row of (lessonProgressRes.data ?? []) as Array<{
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
  }>) {
    if (row.completed) completedSet.add(row.lesson_id);
    completedAtMap.set(row.lesson_id, row.completed_at);
  }

  // 5) Modulo anterior esta 100% completo?
  const prevModuleAllComplete =
    !prevModule ||
    prevModuleLessonIds.length === 0 ||
    prevModuleLessonIds.every((id) => completedSet.has(id));

  const moduleLocked = !prevModuleAllComplete;

  // 6) Enriquece lessons com completed + locked scoped
  const lessonsWithState = moduleLessons.map((l, idx) => {
    const completed = completedSet.has(l.id as string);
    let locked = false;
    if (moduleLocked) {
      locked = !completed;
    } else if (idx > 0) {
      const prevId = moduleLessons[idx - 1]?.id as string;
      const prevDone = completedSet.has(prevId);
      locked = !completed && !prevDone;
    }
    return {
      ...l,
      module_slug: currentModule.slug,
      module_title: currentModule.title,
      completed,
      completed_at: completedAtMap.get(l.id as string) ?? null,
      locked,
    };
  });

  const completedInModule = lessonsWithState.filter((l) => l.completed).length;
  const allComplete =
    moduleLessons.length > 0 && completedInModule === moduleLessons.length;

  return json({
    journey,
    module: {
      ...currentModule,
      lesson_count: moduleLessons.length,
      lessons_completed: completedInModule,
      pct_complete:
        moduleLessons.length === 0
          ? 0
          : Math.round((completedInModule / moduleLessons.length) * 100),
      all_complete: allComplete,
      locked: moduleLocked,
    },
    lessons: lessonsWithState,
    prev_module: prevModule
      ? { id: prevModule.id, slug: prevModule.slug, title: prevModule.title }
      : null,
    next_module: nextModule
      ? { id: nextModule.id, slug: nextModule.slug, title: nextModule.title }
      : null,
    progress: progressRes.data ?? null,
    proof: proofRes.data ?? null,
  });
}
