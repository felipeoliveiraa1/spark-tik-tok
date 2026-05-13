import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
type PatchBody = { name?: string };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const { data, error } = await supabase
    .from("conversation_folders")
    .update({ name })
    .eq("id", id)
    .select("id, name, is_default, sort_order, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: folder } = await supabase
    .from("conversation_folders")
    .select("is_default")
    .eq("id", id)
    .maybeSingle();

  if (!folder) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (folder.is_default) return NextResponse.json({ error: "cannot_delete_default" }, { status: 400 });

  const { data: defaultFolder } = await supabase
    .from("conversation_folders")
    .select("id")
    .eq("is_default", true)
    .maybeSingle();

  if (defaultFolder) {
    await supabase
      .from("conversations")
      .update({ folder_id: defaultFolder.id })
      .eq("folder_id", id);
  }

  const { error } = await supabase.from("conversation_folders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
