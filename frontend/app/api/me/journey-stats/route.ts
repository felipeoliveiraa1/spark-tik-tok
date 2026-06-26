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
 * GET /api/me/journey-stats
 *
 * Stats agregadas pro hud do jogo:
 *   - xp_total (soma de todos xp_events do user)
 *   - character_stage (derivado de COUNT(journey_progress.completed))
 *   - badges (lista de badges conquistadas)
 *   - journeys_completed_count
 *   - lessons_completed_count
 *   - proofs_approved_count
 */
export async function GET() {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const supabase = getServiceClient();

  const [xpRes, journeysRes, lessonsRes, proofsRes, badgesRes] = await Promise.all([
    supabase
      .from("journey_xp_events")
      .select("xp_amount")
      .eq("user_id", user.id),
    supabase
      .from("journey_progress")
      .select("status", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("journey_lesson_progress")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("journey_proofs")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["approved", "auto_approved"]),
    supabase
      .from("user_badges")
      .select("badge_id, earned_at, badges!inner(id, slug, title, description, icon_url, rarity, xp_bonus)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
  ]);

  const xpTotal = (xpRes.data ?? []).reduce(
    (acc, r) => acc + Number(r.xp_amount ?? 0),
    0,
  );
  const journeysCompleted = journeysRes.count ?? 0;
  const characterStage = stageFromCompletedCount(journeysCompleted);

  type BadgeNested = {
    earned_at: string;
    badges: {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      icon_url: string | null;
      rarity: string;
      xp_bonus: number;
    } | Array<{
      id: string;
      slug: string;
      title: string;
      description: string | null;
      icon_url: string | null;
      rarity: string;
      xp_bonus: number;
    }> | null;
  };
  const badges = ((badgesRes.data ?? []) as unknown as BadgeNested[]).map((row) => {
    const b = Array.isArray(row.badges) ? row.badges[0] : row.badges;
    return {
      slug: b?.slug ?? "",
      title: b?.title ?? "",
      description: b?.description ?? null,
      icon_url: b?.icon_url ?? null,
      rarity: b?.rarity ?? "common",
      xp_bonus: b?.xp_bonus ?? 0,
      earned_at: row.earned_at,
    };
  });

  return json({
    xp_total: xpTotal,
    character_stage: characterStage,
    journeys_completed_count: journeysCompleted,
    lessons_completed_count: lessonsRes.count ?? 0,
    proofs_approved_count: proofsRes.count ?? 0,
    badges,
  });
}
