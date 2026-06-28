import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { stageFromCompletedCount } from "@/lib/journey/character-stage";

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
 * GET /api/jornadas — lista jornadas que a aluna pode ver:
 * - Admin: TODAS as publicadas (mesmo is_admin_only=true)
 * - Aluna: so as is_published=true AND is_admin_only=false
 *
 * Retorna com progresso da aluna em cada jornada (xp_total, status,
 * lessons_completed_count) e stage atual do personagem.
 */
export async function GET() {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await auth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const supabase = getServiceClient();

  let query = supabase
    .from("journeys")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (!isAdmin) {
    query = query.eq("is_admin_only", false);
  }

  const { data: journeys, error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });

  // Progresso da aluna por jornada
  const journeyIds = (journeys ?? []).map((j) => j.id as string);
  const fallbackIds = journeyIds.length > 0 ? journeyIds : ["00000000-0000-0000-0000-000000000000"];
  const [progressRes, lessonCountsRes, completedLessonsRes, moduleCountsRes] = await Promise.all([
    supabase
      .from("journey_progress")
      .select("journey_id, xp_total, status, completed_at, started_at, current_lesson_id")
      .eq("user_id", user.id)
      .in("journey_id", fallbackIds),
    supabase
      .from("journey_lessons")
      .select("journey_id, id")
      .in("journey_id", fallbackIds)
      .eq("is_published", true),
    supabase
      .from("journey_lesson_progress")
      .select("lesson_id, completed, journey_lessons!inner(journey_id)")
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("journey_modules")
      .select("journey_id, id")
      .in("journey_id", fallbackIds)
      .eq("is_published", true),
  ]);

  const progressByJourney = new Map<string, {
    xp_total: number;
    status: string;
    completed_at: string | null;
    started_at: string | null;
    current_lesson_id: string | null;
  }>();
  for (const row of (progressRes.data ?? []) as Array<{
    journey_id: string;
    xp_total: number;
    status: string;
    completed_at: string | null;
    started_at: string | null;
    current_lesson_id: string | null;
  }>) {
    progressByJourney.set(row.journey_id, row);
  }

  const lessonsByJourney = new Map<string, number>();
  for (const row of (lessonCountsRes.data ?? []) as Array<{ journey_id: string }>) {
    lessonsByJourney.set(row.journey_id, (lessonsByJourney.get(row.journey_id) ?? 0) + 1);
  }

  const completedByJourney = new Map<string, number>();
  type CompletedRow = { journey_lessons: { journey_id: string } | { journey_id: string }[] | null };
  for (const row of (completedLessonsRes.data ?? []) as unknown as CompletedRow[]) {
    const jl = row.journey_lessons;
    const journeyId = Array.isArray(jl) ? jl[0]?.journey_id : jl?.journey_id;
    if (!journeyId) continue;
    completedByJourney.set(journeyId, (completedByJourney.get(journeyId) ?? 0) + 1);
  }

  const completedCount = Array.from(progressByJourney.values()).filter(
    (p) => p.status === "completed",
  ).length;
  const characterStage = stageFromCompletedCount(completedCount);

  const modulesByJourney = new Map<string, number>();
  for (const row of (moduleCountsRes.data ?? []) as Array<{ journey_id: string }>) {
    modulesByJourney.set(row.journey_id, (modulesByJourney.get(row.journey_id) ?? 0) + 1);
  }

  const items = (journeys ?? []).map((j) => {
    const prog = progressByJourney.get(j.id as string);
    const totalLessons = lessonsByJourney.get(j.id as string) ?? 0;
    const completedLessons = completedByJourney.get(j.id as string) ?? 0;
    const totalModules = modulesByJourney.get(j.id as string) ?? 0;
    return {
      ...j,
      progress: prog ?? null,
      lesson_count: totalLessons,
      lessons_completed: completedLessons,
      module_count: totalModules,
      pct_complete:
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    };
  });

  return json({
    journeys: items,
    me: {
      character_stage: characterStage,
      journeys_completed: completedCount,
      is_admin: isAdmin,
    },
  });
}
