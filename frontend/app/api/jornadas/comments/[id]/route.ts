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
 * DELETE /api/jornadas/comments/[id]
 * Owner pode hard delete. Admin pode soft delete (status='hidden').
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

  const { data: comment } = await supabase
    .from("journey_comments")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!comment) return json({ error: "not found" }, { status: 404 });

  const { data: profile } = await auth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";
  const isOwner = comment.user_id === user.id;

  if (!isAdmin && !isOwner) {
    return json({ error: "forbidden" }, { status: 403 });
  }

  if (isOwner && !isAdmin) {
    // Owner: hard delete
    const { error } = await supabase.from("journey_comments").delete().eq("id", id);
    if (error) return json({ error: error.message }, { status: 500 });
  } else {
    // Admin: soft delete (status hidden)
    const { error } = await supabase
      .from("journey_comments")
      .update({ status: "hidden" })
      .eq("id", id);
    if (error) return json({ error: error.message }, { status: 500 });
  }

  return json({ ok: true });
}
