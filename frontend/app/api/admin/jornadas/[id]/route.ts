import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { invalidateJourneyAccessCache } from "@/lib/journey/journey-access";

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
 * GET /api/admin/jornadas/[id] — detalhe da jornada com aulas
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const supabase = getServiceClient();

  const [journeyRes, lessonsRes] = await Promise.all([
    supabase.from("journeys").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("journey_lessons")
      .select("*")
      .eq("journey_id", id)
      .order("order_index", { ascending: true }),
  ]);

  if (journeyRes.error) return json({ error: journeyRes.error.message }, { status: 500 });
  if (!journeyRes.data) return json({ error: "not found" }, { status: 404 });

  return json({ journey: journeyRes.data, lessons: lessonsRes.data ?? [] });
}

/**
 * PATCH /api/admin/jornadas/[id] — atualizar campos da jornada
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  const allowed = [
    "title",
    "subtitle",
    "description",
    "character_stage",
    "character_name",
    "hero_color_a",
    "hero_color_b",
    "background_url",
    "order_index",
    "xp_required",
    "is_published",
    "is_admin_only",
  ] as const;

  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return json({ error: "nada pra atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journeys")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });

  // Invalida cache do gate em proxy.ts (mudou is_admin_only ou is_published)
  if ("is_admin_only" in update || "is_published" in update) {
    invalidateJourneyAccessCache();
  }

  return json({ journey: data });
}

/**
 * DELETE /api/admin/jornadas/[id]
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const supabase = getServiceClient();
  const { error } = await supabase.from("journeys").delete().eq("id", id);
  if (error) return json({ error: error.message }, { status: 500 });
  invalidateJourneyAccessCache();
  return json({ ok: true });
}
