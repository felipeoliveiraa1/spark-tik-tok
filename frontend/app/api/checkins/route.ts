import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { CheckinRow, Mood } from "@/lib/checkin-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/checkins?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   ou
 * GET /api/checkins?date=YYYY-MM-DD   (um dia específico)
 *
 * Sem params, retorna os últimos 30 check-ins.
 */
export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Single day
  if (date) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checkin: data ?? null });
  }

  // Range
  let query = supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (!from && !to) query = query.limit(30);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checkins: data ?? [] });
}

/**
 * POST /api/checkins
 *   body: payload completo de CheckinRow (sem id/user_id).
 *
 * UPSERT: se já tem row pra (user_id, date), atualiza. Senão insere.
 * Garante que os contadores não vão negativo e que o mood/energy são válidos.
 */
type IncomingBody = Partial<CheckinRow>;

function sanitizeCount(v: unknown, max = 99): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(Math.round(v), max));
}

function sanitizeMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

const MOOD_VALUES: Mood[] = ["great", "good", "okay", "tough", "rough"];

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const date = body.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const energy =
    typeof body.energy_level === "number" &&
    body.energy_level >= 1 &&
    body.energy_level <= 5
      ? body.energy_level
      : null;
  const mood =
    body.mood && MOOD_VALUES.includes(body.mood) ? body.mood : null;

  const payload = {
    user_id: user.id,
    date,
    videos_posted: sanitizeCount(body.videos_posted, 99),
    videos_recorded: sanitizeCount(body.videos_recorded, 99),
    live_chat_done: !!body.live_chat_done,
    live_shop_done: !!body.live_shop_done,
    analytics_done: !!body.analytics_done,
    comms_done: !!body.comms_done,
    skincare_morning: !!body.skincare_morning,
    skincare_night: !!body.skincare_night,
    supplementation: !!body.supplementation,
    gym: !!body.gym,
    sleep_hygiene: !!body.sleep_hygiene,
    sales_brl: sanitizeMoney(body.sales_brl),
    commission_brl: sanitizeMoney(body.commission_brl),
    total_views:
      typeof body.total_views === "number" && body.total_views >= 0
        ? Math.round(body.total_views)
        : null,
    mood,
    energy_level: energy,
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : null,
  };

  const { data, error } = await supabase
    .from("daily_checkins")
    .upsert(payload, { onConflict: "user_id,date" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, checkin: data });
}
