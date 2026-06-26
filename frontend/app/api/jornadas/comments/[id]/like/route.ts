import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { XP_RULES } from "@/lib/journey/xp-rules";

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

async function recomputeLikeCount(
  supabase: ReturnType<typeof getServiceClient>,
  commentId: string,
): Promise<number> {
  const { count } = await supabase
    .from("journey_comment_likes")
    .select("user_id", { count: "exact", head: true })
    .eq("comment_id", commentId);
  const total = count ?? 0;
  await supabase
    .from("journey_comments")
    .update({ like_count: total })
    .eq("id", commentId);
  return total;
}

/**
 * POST /api/jornadas/comments/[id]/like — adiciona like (idempotente)
 */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = getServiceClient();

  // Insert idempotente (PK composta evita duplicata)
  const { error: insErr } = await supabase
    .from("journey_comment_likes")
    .insert({ comment_id: id, user_id: user.id });
  // 23505 = unique violation -> ja existe, OK
  if (insErr && insErr.code !== "23505") {
    return json({ error: insErr.message }, { status: 500 });
  }
  const isNew = !insErr;

  const total = await recomputeLikeCount(supabase, id);

  // XP pro autor do comentario (apenas se eh like NOVO E nao for self-like)
  if (isNew) {
    const { data: comment } = await supabase
      .from("journey_comments")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();
    if (comment && comment.user_id !== user.id) {
      await supabase.from("journey_xp_events").insert({
        user_id: comment.user_id,
        kind: "comment_liked",
        ref_id: id,
        xp_amount: XP_RULES.comment_received_like,
      });
    }
  }

  return json({ ok: true, like_count: total, liked: true });
}

/**
 * DELETE /api/jornadas/comments/[id]/like — remove like
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = getServiceClient();

  await supabase
    .from("journey_comment_likes")
    .delete()
    .eq("comment_id", id)
    .eq("user_id", user.id);

  const total = await recomputeLikeCount(supabase, id);
  return json({ ok: true, like_count: total, liked: false });
}
