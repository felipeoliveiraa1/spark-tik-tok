import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ao-vivo/progress
 * Body: { live_id, completed? }
 * Marca uma live como assistida (replay) pela aluna.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { live_id?: string; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.live_id || typeof body.live_id !== "string") {
    return NextResponse.json({ error: "missing_live_id" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    live_id: body.live_id,
    completed: body.completed ?? true,
    watched_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("live_progress")
    .upsert(payload, { onConflict: "user_id,live_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/**
 * GET /api/ao-vivo/progress
 * Retorna o que a aluna ja marcou como assistido.
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("live_progress")
    .select("live_id, completed, watched_at")
    .order("watched_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data ?? [] });
}
