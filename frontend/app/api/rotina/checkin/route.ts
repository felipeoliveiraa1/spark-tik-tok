import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/rotina/checkin?date=YYYY-MM-DD → estado de hoje
 *   Retorna: { date, habits: [...], checked: [habit_id...], completion: {...}|null }
 *   Se completion existe, dia tá trancado.
 *
 * POST /api/rotina/checkin
 *   Body: { habit_id, done, date? }
 *   Toggle de marcação. Bloqueado se já tem completion no dia.
 */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();

  const [habitsRes, checksRes, completionRes] = await Promise.all([
    supabase
      .from("user_habits")
      .select("id, slug, label, emoji, category, order_index, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("habit_checkins")
      .select("habit_id, done")
      .eq("user_id", user.id)
      .eq("date", date),
    supabase
      .from("daily_completions")
      .select("date, completed_at, habits_done, habits_total")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
  ]);

  if (habitsRes.error) return NextResponse.json({ error: habitsRes.error.message }, { status: 500 });
  if (checksRes.error) return NextResponse.json({ error: checksRes.error.message }, { status: 500 });

  const checked = new Set(
    (checksRes.data ?? []).filter((r) => r.done).map((r) => r.habit_id as string),
  );

  return NextResponse.json({
    date,
    habits: habitsRes.data ?? [],
    checked: Array.from(checked),
    completion: completionRes.data ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { habit_id?: string; done?: boolean; date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.habit_id || typeof body.habit_id !== "string") {
    return NextResponse.json({ error: "missing_habit_id" }, { status: 400 });
  }
  const date = body.date || todayISO();

  // Bloqueia se dia já foi concluído
  const { data: completion } = await supabase
    .from("daily_completions")
    .select("date")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  if (completion) {
    return NextResponse.json({ error: "day_already_completed" }, { status: 409 });
  }

  const done = body.done ?? true;

  if (done) {
    const { error } = await supabase
      .from("habit_checkins")
      .upsert(
        {
          user_id: user.id,
          habit_id: body.habit_id,
          date,
          done: true,
        },
        { onConflict: "user_id,habit_id,date" },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Untoggle = delete
    const { error } = await supabase
      .from("habit_checkins")
      .delete()
      .eq("user_id", user.id)
      .eq("habit_id", body.habit_id)
      .eq("date", date);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
