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
 * GET /api/me/journey-notifications — lista 50 mais recentes + count unread
 */
export async function GET() {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const supabase = getServiceClient();

  const [listRes, unreadRes] = await Promise.all([
    supabase
      .from("journey_notifications")
      .select("id, kind, title, body, icon_url, ref_url, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("journey_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return json({
    notifications: listRes.data ?? [],
    unread_count: unreadRes.count ?? 0,
  });
}

/**
 * POST /api/me/journey-notifications/mark-read
 * body: { ids?: string[] } — sem ids marca TODAS como lidas
 */
export async function POST(request: Request) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as { ids?: string[] };

  const nowIso = new Date().toISOString();
  let query = supabase
    .from("journey_notifications")
    .update({ read_at: nowIso })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in("id", body.ids);
  }
  const { error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
