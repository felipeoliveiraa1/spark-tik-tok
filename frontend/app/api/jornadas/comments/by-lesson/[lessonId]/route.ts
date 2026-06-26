import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { moderateComment } from "@/lib/journey/moderation";
import { XP_RULES } from "@/lib/journey/xp-rules";
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
 * GET /api/jornadas/comments/[lessonId] — lista comentarios visiveis
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ lessonId: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { lessonId } = await ctx.params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("journey_comments")
    .select(`
      id, lesson_id, user_id, parent_id, body, like_count, status, created_at, updated_at,
      profiles!inner(id, name, avatar_url)
    `)
    .eq("lesson_id", lessonId)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return json({ error: error.message }, { status: 500 });

  // Likes do user atual
  const commentIds = (data ?? []).map((c) => c.id as string);
  const { data: myLikes } = commentIds.length > 0
    ? await supabase
        .from("journey_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds)
    : { data: [] };
  const likedSet = new Set((myLikes ?? []).map((l) => l.comment_id as string));

  type CommentRow = {
    id: string;
    lesson_id: string;
    user_id: string;
    parent_id: string | null;
    body: string;
    like_count: number;
    status: string;
    created_at: string;
    updated_at: string;
    profiles: { id: string; name: string | null; avatar_url: string | null }
      | Array<{ id: string; name: string | null; avatar_url: string | null }>
      | null;
  };
  const comments = ((data ?? []) as unknown as CommentRow[]).map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      lesson_id: c.lesson_id,
      user_id: c.user_id,
      parent_id: c.parent_id,
      body: c.body,
      like_count: c.like_count,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author_name: profile?.name ?? "Aluna",
      author_avatar: profile?.avatar_url ?? null,
      liked_by_me: likedSet.has(c.id),
      is_mine: c.user_id === user.id,
    };
  });

  return json({ comments });
}

/**
 * POST /api/jornadas/comments/[lessonId] — cria comentario
 * body: { body: string, parent_id?: string }
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ lessonId: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { lessonId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as {
    body?: string;
    parent_id?: string;
  };

  const text = (body.body ?? "").trim();
  const mod = moderateComment(text);
  if (!mod.allowed) {
    return json({ error: "moderation", reason: mod.reason }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Se parent_id, pegar parent real (1 nivel — reply de reply vira reply
  // do comentario-pai, flatten)
  let parentId: string | null = body.parent_id ?? null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("journey_comments")
      .select("id, parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parent?.parent_id) parentId = parent.parent_id; // flatten
  }

  const { data, error } = await supabase
    .from("journey_comments")
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      parent_id: parentId,
      body: text,
    })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });

  // XP + badge engine
  await supabase.from("journey_xp_events").insert({
    user_id: user.id,
    kind: "comment_post",
    ref_id: data.id,
    xp_amount: XP_RULES.comment_post,
  });

  let awardedBadges: Awaited<ReturnType<typeof evaluateBadgesForUser>> = [];
  try {
    awardedBadges = await evaluateBadgesForUser(supabase, {
      userId: user.id,
      eventKind: "comment_post",
    });
  } catch (err) {
    console.warn("[comments] badge engine error:", err);
  }

  return json({
    comment: data,
    xp_earned: XP_RULES.comment_post,
    badges_awarded: awardedBadges,
  }, { status: 201 });
}
