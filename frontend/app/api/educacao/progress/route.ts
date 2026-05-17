import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registra/atualiza progresso da aluna numa videoaula.
 * Body: { video_id, progress_seconds?, completed? }
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { video_id?: string; progress_seconds?: number; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.video_id || typeof body.video_id !== "string") {
    return NextResponse.json({ error: "missing_video_id" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    video_id: body.video_id,
    progress_seconds: typeof body.progress_seconds === "number" ? body.progress_seconds : 0,
    completed: !!body.completed,
    watched_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("education_progress")
    .upsert(payload, { onConflict: "user_id,video_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("education_progress")
    .select("video_id, progress_seconds, completed, watched_at")
    .order("watched_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data ?? [] });
}
