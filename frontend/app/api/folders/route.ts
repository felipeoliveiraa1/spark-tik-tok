import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = { name?: string };

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("conversation_folders")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("conversation_folders")
    .insert({ user_id: user.id, name, sort_order: nextOrder })
    .select("id, name, is_default, sort_order, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
