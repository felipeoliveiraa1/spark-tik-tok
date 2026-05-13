import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Aceita UUID interno (id) OU source_video_id (numérico do TikTok).
  // Quando Gemini gera o link errado, ainda assim acha o registro.
  const lookupColumn = UUID_RE.test(id) ? "id" : "source_video_id";

  const { data, error } = await supabase
    .from("saved_virals")
    .select("*")
    .eq(lookupColumn, id)
    .maybeSingle();

  if (error) {
    console.error("[api/virais GET]", { id, lookupColumn, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ video: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lookupColumn = UUID_RE.test(id) ? "id" : "source_video_id";

  const { data, error } = await supabase
    .from("saved_virals")
    .delete()
    .eq(lookupColumn, id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
