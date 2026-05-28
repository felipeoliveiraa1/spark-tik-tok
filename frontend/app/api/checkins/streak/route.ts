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
 * Calcula:
 *   - current_streak: dias consecutivos com check-in ativo até hoje
 *     (ou até ontem se hoje ainda não foi feito).
 *   - longest_streak: maior sequência histórica.
 *   - total_checkins: total de check-ins ativos.
 *   - today_done: se hoje já tem check-in marcado.
 *
 * Critério "ativo": pelo menos 1 atividade marcada (não vazio).
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Busca até 365 dias pra trás — suficiente pra streaks realistas
  const today = todayBrazil();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoIso = yearAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", yearAgoIso)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CheckinRow[];
  const activeDates = new Set(
    rows.filter(isActiveCheckin).map((r) => r.date),
  );

  // current streak: começa de hoje (ou ontem se hoje não foi feito)
  // e conta consecutivos pra trás
  const todayDone = activeDates.has(today);
  let cursor = new Date(today + "T00:00:00Z");
  if (!todayDone) {
    // Se hoje não foi feito, começa de ontem (não quebra streak ainda)
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let current = 0;
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // longest streak: scan completo das datas ativas em ordem
  const sortedActive = [...activeDates].sort(); // ASC
  let longest = 0;
  let runLen = 0;
  let prev: Date | null = null;
  for (const iso of sortedActive) {
    const d = new Date(iso + "T00:00:00Z");
    if (prev) {
      const diffDays = Math.round((d.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        runLen += 1;
      } else {
        if (runLen > longest) longest = runLen;
        runLen = 1;
      }
    } else {
      runLen = 1;
    }
    prev = d;
  }
  if (runLen > longest) longest = runLen;

  // Last check-in date (mais recente)
  const lastCheckin = rows[0]?.date ?? null;

  return NextResponse.json({
    current_streak: current,
    longest_streak: longest,
    total_checkins: activeDates.size,
    today_done: todayDone,
    last_checkin: lastCheckin,
  });
}
