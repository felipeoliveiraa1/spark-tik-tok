import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/revenue?months=12
 * Retorna histórico de faturamento mensal da aluna (últimos N meses, default 12).
 *
 * POST /api/revenue
 * Body: { year_month: "YYYY-MM", amount_brl: number, notes?: string }
 * Upsert do registro do mês.
 */

const YM_RE = /^[0-9]{4}-[0-9]{2}$/;

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const months = Math.max(1, Math.min(36, Number(searchParams.get("months") ?? 12)));

  const { data, error } = await supabase
    .from("monthly_revenue")
    .select("year_month, amount_brl, notes, updated_at")
    .eq("user_id", user.id)
    .order("year_month", { ascending: false })
    .limit(months);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ revenue: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { year_month?: string; amount_brl?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.year_month || !YM_RE.test(body.year_month)) {
    return NextResponse.json({ error: "invalid_year_month" }, { status: 400 });
  }
  if (typeof body.amount_brl !== "number" || body.amount_brl < 0) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    year_month: body.year_month,
    amount_brl: body.amount_brl,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 240) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("monthly_revenue")
    .upsert(payload, { onConflict: "user_id,year_month" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
