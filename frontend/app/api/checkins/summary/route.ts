import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  calcAdherence,
  isActiveCheckin,
  type CheckinRow,
} from "@/lib/checkin-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/checkins/summary?period=7d|30d|month
 *
 * Retorna agregados do período + delta vs período anterior (mesmo tamanho).
 */

type Period = "7d" | "30d" | "month";

function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function periodWindow(period: Period): { from: string; to: string; prevFrom: string; prevTo: string } {
  const today = new Date();
  const to = toIso(today);

  if (period === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6); // 7 dias inclusive hoje
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - 6);
    return { from: toIso(from), to, prevFrom: toIso(prevFrom), prevTo: toIso(prevTo) };
  }

  if (period === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - 29);
    return { from: toIso(from), to, prevFrom: toIso(prevFrom), prevTo: toIso(prevTo) };
  }

  // month — mês corrente
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return {
    from: toIso(monthStart),
    to,
    prevFrom: toIso(prevMonthStart),
    prevTo: toIso(prevMonthEnd),
  };
}

function aggregate(rows: CheckinRow[]) {
  const totals = {
    days_with_checkin: rows.length,
    videos_posted: 0,
    videos_recorded: 0,
    live_chat_days: 0,
    live_shop_days: 0,
    analytics_days: 0,
    comms_days: 0,
    skincare_morning_days: 0,
    skincare_night_days: 0,
    supplementation_days: 0,
    gym_days: 0,
    sleep_hygiene_days: 0,
    sales_brl: 0,
    commission_brl: 0,
    total_views: 0,
    avg_adherence: 0,
    avg_energy: 0 as number | null,
  };

  let energyCount = 0;
  let energySum = 0;
  let adherenceSum = 0;

  for (const r of rows) {
    totals.videos_posted += r.videos_posted ?? 0;
    totals.videos_recorded += r.videos_recorded ?? 0;
    if (r.live_chat_done) totals.live_chat_days += 1;
    if (r.live_shop_done) totals.live_shop_days += 1;
    if (r.analytics_done) totals.analytics_days += 1;
    if (r.comms_done) totals.comms_days += 1;
    if (r.skincare_morning) totals.skincare_morning_days += 1;
    if (r.skincare_night) totals.skincare_night_days += 1;
    if (r.supplementation) totals.supplementation_days += 1;
    if (r.gym) totals.gym_days += 1;
    if (r.sleep_hygiene) totals.sleep_hygiene_days += 1;
    totals.sales_brl += Number(r.sales_brl ?? 0);
    totals.commission_brl += Number(r.commission_brl ?? 0);
    totals.total_views += r.total_views ?? 0;

    adherenceSum += calcAdherence(r);

    if (r.energy_level != null) {
      energyCount += 1;
      energySum += r.energy_level;
    }
  }

  totals.avg_adherence = rows.length ? Math.round(adherenceSum / rows.length) : 0;
  totals.avg_energy = energyCount > 0 ? Number((energySum / energyCount).toFixed(2)) : null;
  totals.sales_brl = Math.round(totals.sales_brl * 100) / 100;
  totals.commission_brl = Math.round(totals.commission_brl * 100) / 100;

  return totals;
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawPeriod = searchParams.get("period") ?? "7d";
  const period: Period = (["7d", "30d", "month"] as const).includes(rawPeriod as Period)
    ? (rawPeriod as Period)
    : "7d";

  const { from, to, prevFrom, prevTo } = periodWindow(period);

  // Busca ambos os períodos numa só query (depois separa)
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", prevFrom)
    .lte("date", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as CheckinRow[];
  const current = rows.filter((r) => r.date >= from && r.date <= to);
  const previous = rows.filter((r) => r.date >= prevFrom && r.date <= prevTo);

  return NextResponse.json({
    period,
    range: { from, to },
    previousRange: { from: prevFrom, to: prevTo },
    current: aggregate(current),
    previous: aggregate(previous),
    rows: current.filter(isActiveCheckin).map((r) => ({
      date: r.date,
      adherence: calcAdherence(r),
      videos_posted: r.videos_posted,
      sales_brl: r.sales_brl,
      commission_brl: r.commission_brl,
      mood: r.mood,
    })),
  });
}
