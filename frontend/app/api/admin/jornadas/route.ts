import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

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
 * GET /api/admin/jornadas — lista jornadas com counts de aulas/alunas
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("journeys")
    .select(
      "id, slug, title, subtitle, description, character_stage, character_name, hero_color_a, hero_color_b, background_url, order_index, xp_required, is_published, is_admin_only, created_at, updated_at",
    )
    .order("order_index", { ascending: true });
  if (error) return json({ error: error.message }, { status: 500 });

  const ids = (data ?? []).map((j) => j.id as string);
  if (ids.length === 0) return json({ journeys: [] });

  const [lessonCounts, progressCounts] = await Promise.all([
    supabase
      .from("journey_lessons")
      .select("journey_id")
      .in("journey_id", ids),
    supabase
      .from("journey_progress")
      .select("journey_id, status")
      .in("journey_id", ids),
  ]);

  const lessonsByJourney = new Map<string, number>();
  for (const row of (lessonCounts.data ?? []) as { journey_id: string }[]) {
    lessonsByJourney.set(row.journey_id, (lessonsByJourney.get(row.journey_id) ?? 0) + 1);
  }
  const startedByJourney = new Map<string, number>();
  const completedByJourney = new Map<string, number>();
  for (const row of (progressCounts.data ?? []) as { journey_id: string; status: string }[]) {
    startedByJourney.set(row.journey_id, (startedByJourney.get(row.journey_id) ?? 0) + 1);
    if (row.status === "completed") {
      completedByJourney.set(row.journey_id, (completedByJourney.get(row.journey_id) ?? 0) + 1);
    }
  }

  const journeys = (data ?? []).map((j) => ({
    ...j,
    lesson_count: lessonsByJourney.get(j.id as string) ?? 0,
    students_started: startedByJourney.get(j.id as string) ?? 0,
    students_completed: completedByJourney.get(j.id as string) ?? 0,
  }));

  return json({ journeys });
}

/**
 * POST /api/admin/jornadas — cria jornada
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const character_stage = body.character_stage as string | undefined;

  if (!slug || !slug.match(/^[a-z0-9-]+$/)) {
    return json({ error: "slug invalido (a-z, 0-9, hifens)" }, { status: 400 });
  }
  if (!title) return json({ error: "title obrigatorio" }, { status: 400 });
  if (!character_stage || !["bebe", "adolescente", "adulta"].includes(character_stage)) {
    return json({ error: "character_stage invalido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journeys")
    .insert({
      slug,
      title,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : null,
      description: typeof body.description === "string" ? body.description : null,
      character_stage,
      character_name: typeof body.character_name === "string" ? body.character_name : null,
      hero_color_a: typeof body.hero_color_a === "string" ? body.hero_color_a : null,
      hero_color_b: typeof body.hero_color_b === "string" ? body.hero_color_b : null,
      background_url: typeof body.background_url === "string" ? body.background_url : null,
      order_index: typeof body.order_index === "number" ? body.order_index : 100,
      xp_required: typeof body.xp_required === "number" ? body.xp_required : 0,
      is_published: body.is_published === true,
      is_admin_only: body.is_admin_only !== false, // default true
    })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ journey: data }, { status: 201 });
}
