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

  // Aulas publicadas
  const { data: lessons, error: lErr } = await supabase
    .from("journey_lessons")
    .select("*")
    .eq("journey_id", journey.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (lErr) return json({ error: lErr.message }, { status: 500 });

  const lessonIds = (lessons ?? []).map((l) => l.id as string);

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

  // Adiciona flag completed + locked (linear: aula N+1 trava ate N completar)
  const lessonsWithState = (lessons ?? []).map((l, idx) => {
    const completed = completedMap.get(l.id as string)?.completed ?? false;
    const prevCompleted =
      idx === 0
        ? true
        : completedMap.get((lessons ?? [])[idx - 1]?.id as string)?.completed ?? false;
    return {
      ...l,
      completed,
      completed_at: completedMap.get(l.id as string)?.completed_at ?? null,
      locked: !completed && !prevCompleted,
    };
  });

  const totalLessons = lessonsWithState.length;
  const completedLessons = lessonsWithState.filter((l) => l.completed).length;
  const allLessonsComplete = totalLessons > 0 && completedLessons === totalLessons;

  return json({
    journey,
    lessons: lessonsWithState,
    progress: progressRes.data ?? null,
    proof: proofRes.data ?? null,
    stats: {
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      pct_complete: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      all_lessons_complete: allLessonsComplete,
    },
  });
}
