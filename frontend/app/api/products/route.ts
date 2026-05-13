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
    .from("products")
    .select("id, name, image_url, category, target_audience, price_range, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

type CreateBody = {
  name?: string;
  image_url?: string | null;
  category?: string | null;
  target_audience?: string | null;
  pain_points?: unknown;
  strengths?: unknown;
  price_range?: string | null;
  competitors?: unknown;
  raw_analysis?: unknown;
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

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      image_url: body.image_url ?? null,
      category: body.category ?? null,
      target_audience: body.target_audience ?? null,
      pain_points: body.pain_points ?? null,
      strengths: body.strengths ?? null,
      price_range: body.price_range ?? null,
      competitors: body.competitors ?? null,
      raw_analysis: body.raw_analysis ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
