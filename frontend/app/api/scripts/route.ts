import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("generated_scripts")
    .select("id, title, hooks, product_id, model, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scripts: data ?? [] });
}

type CreateBody = {
  product_id?: string | null;
  title?: string;
  hooks?: unknown;
  raw_output?: string;
  model?: string;
};

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

  if (!body.hooks || !Array.isArray(body.hooks)) {
    return NextResponse.json({ error: "hooks_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("generated_scripts")
    .insert({
      user_id: user.id,
      product_id: body.product_id ?? null,
      title: body.title?.trim() || "10 hooks",
      hooks: body.hooks,
      raw_output: body.raw_output ?? null,
      model: body.model ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
