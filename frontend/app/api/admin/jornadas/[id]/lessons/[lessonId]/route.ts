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
 * PATCH /api/admin/jornadas/[id]/lessons/[lessonId]
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; lessonId: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lessonId } = await ctx.params;
  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const allowed = [
    "title",
    "description",
    "kind",
    "youtube_id",
    "body_md",
    "checklist_items",
    "file_url",
    "file_name",
    "file_size_bytes",
    "cover_url",
    "order_index",
    "xp_reward",
    "requires_proof",
    "map_x",
    "map_y",
    "is_published",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return json({ error: "nada pra atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journey_lessons")
    .update(update)
    .eq("id", lessonId)
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ lesson: data });
}

/**
 * DELETE /api/admin/jornadas/[id]/lessons/[lessonId]
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; lessonId: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lessonId } = await ctx.params;
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("journey_lessons")
    .delete()
    .eq("id", lessonId);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
