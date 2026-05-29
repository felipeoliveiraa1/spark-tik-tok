import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/educacao/checklist?lesson_id=...
 * Retorna o estado da aluna nos itens do checklist daquela aula.
 *
 * POST /api/educacao/checklist
 * Body: { lesson_id, item_index, checked }
 * Atualiza um item específico do checklist.
 */

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lesson_id");
  if (!lessonId) {
    return NextResponse.json({ error: "missing_lesson_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lesson_check_states")
    .select("item_index, checked")
    .eq("lesson_id", lessonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ states: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { lesson_id?: string; item_index?: number; checked?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.lesson_id || typeof body.lesson_id !== "string") {
    return NextResponse.json({ error: "missing_lesson_id" }, { status: 400 });
  }
  if (typeof body.item_index !== "number" || body.item_index < 0) {
    return NextResponse.json({ error: "invalid_item_index" }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    lesson_id: body.lesson_id,
    item_index: body.item_index,
    checked: !!body.checked,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("lesson_check_states")
    .upsert(payload, { onConflict: "user_id,lesson_id,item_index" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
