import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { trackEvent } from "@/lib/track";
// Data no fuso do Brasil — UTC fazia rotina concluida apos 21h BRT virar
// "amanha" e travava o dia seguinte.
import { todayBrazil as todayISO } from "@/lib/checkin-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rotina/checkin/complete
 * Body: { date? } default = hoje
 * Conclui o dia: cria registro em daily_completions com snapshot de habits.
 * Bloqueia novos toggles em /api/rotina/checkin pra esse dia.
 *
 * DELETE /api/rotina/checkin/complete?date=YYYY-MM-DD
 * Destranca o dia (caso aluna se arrependa) — opcional.
 */

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let date = todayISO();
  try {
    const body = (await request.json().catch(() => ({}))) as { date?: string };
    if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      date = body.date;
    }
  } catch {
    /* default mantém */
  }

  // Conta total e feitos pra snapshot
  const [habitsRes, checksRes] = await Promise.all([
    supabase
      .from("user_habits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("habit_checkins")
      .select("habit_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("done", true),
  ]);

  const habitsTotal = habitsRes.count ?? 0;
  const habitsDone = checksRes.count ?? 0;

  const { data, error } = await supabase
    .from("daily_completions")
    .upsert(
      {
        user_id: user.id,
        date,
        habits_done: habitsDone,
        habits_total: habitsTotal,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    )
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void trackEvent(user.id, "routine_check", {
    date,
    habits_done: habitsDone,
    habits_total: habitsTotal,
    all_done: habitsTotal > 0 && habitsDone === habitsTotal,
  });

  return NextResponse.json({ ok: true, completion: data });
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();

  const { error } = await supabase
    .from("daily_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
