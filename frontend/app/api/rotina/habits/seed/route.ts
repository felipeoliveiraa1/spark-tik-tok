import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rotina/habits/seed
 * Reseed do template Yara — adiciona qualquer hábito do template que
 * a aluna não tenha (preserva os custom e os já editados).
 *
 * Idempotente: usa on conflict (user_id, slug) do nothing.
 */
export async function POST() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("seed_yara_template", { p_user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Retorna a lista atualizada pra UI consumir direto
  const { data: habits } = await supabase
    .from("user_habits")
    .select("id, slug, label, emoji, category, order_index, is_active")
    .eq("user_id", user.id)
    .order("order_index", { ascending: true });

  return NextResponse.json({ ok: true, habits: habits ?? [] });
}
