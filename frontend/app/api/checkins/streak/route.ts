import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  isActiveCheckin,
  todayBrazil,
  type CheckinRow,
} from "@/lib/checkin-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/checkins/streak
 *
 * Calcula streak combinando 2 fontes:
 *   - daily_completions (novo modelo dinâmico, dia foi "concluído")
 *   - daily_checkins (legacy, fallback enquanto a aluna não migrou)
 *
 * Critério de "dia ativo": presente em qualquer das duas.
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = todayBrazil();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoIso = yearAgo.toISOString().slice(0, 10);

  const [newRes, legacyRes] = await Promise.all([
    supabase
      .from("daily_completions")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", yearAgoIso)
      .order("date", { ascending: false }),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", yearAgoIso)
      .order("date", { ascending: false }),
  ]);

  if (newRes.error) {
    return NextResponse.json({ error: newRes.error.message }, { status: 500 });
  }
  if (legacyRes.error) {
    return NextResponse.json({ error: legacyRes.error.message }, { status: 500 });
  }

  const newDates = new Set((newRes.data ?? []).map((r) => r.date as string));
  const legacyDates = new Set(
    ((legacyRes.data ?? []) as CheckinRow[]).filter(isActiveCheckin).map((r) => r.date),
  );
  const activeDates = new Set([...newDates, ...legacyDates]);

  const todayDone = activeDates.has(today);
  const cursor = new Date(today + "T00:00:00Z");
  if (!todayDone) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let current = 0;
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest
  const sortedActive = [...activeDates].sort();
  let longest = 0;
  let runLen = 0;
  let prev: Date | null = null;
  for (const iso of sortedActive) {
    const d = new Date(iso + "T00:00:00Z");
    if (prev) {
      const diffDays = Math.round((d.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) runLen += 1;
      else {
        if (runLen > longest) longest = runLen;
        runLen = 1;
      }
    } else runLen = 1;
    prev = d;
  }
  if (runLen > longest) longest = runLen;

  const lastCheckin =
    (newRes.data ?? [])[0]?.date ?? (legacyRes.data ?? [])[0]?.date ?? null;

  return NextResponse.json({
    current_streak: current,
    longest_streak: longest,
    total_checkins: activeDates.size,
    today_done: todayDone,
    last_checkin: lastCheckin,
    // alias retrocompatível
    streak: current,
    current,
  });
}
