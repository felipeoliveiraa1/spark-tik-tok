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
  pain_points?: string[] | null;
  strengths?: string[] | null;
  price_range?: string | null;
  competitors?: string[] | null;
  differentiators?: string[] | null;
  objections?: string[] | null;
  emotional_triggers?: string[] | null;
  usage_moments?: string[] | null;
  content_angles?: string[] | null;
  hook_ideas?: string[] | null;
  seasonality?: string | null;
  raw_analysis?: unknown;
};

// Sanitiza array de strings — remove vazios, trim, limita 8 itens.
function cleanArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 8);
  return cleaned.length > 0 ? cleaned : null;
}

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
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  // image_url só aceita https URLs (vem do /api/upload)
  const imageUrl =
    typeof body.image_url === "string" && /^https?:\/\//.test(body.image_url)
      ? body.image_url
      : null;

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: name.slice(0, 200),
      image_url: imageUrl,
      category: body.category?.trim().slice(0, 100) ?? null,
      target_audience: body.target_audience?.trim().slice(0, 500) ?? null,
      pain_points: cleanArray(body.pain_points),
      strengths: cleanArray(body.strengths),
      price_range: body.price_range?.trim().slice(0, 100) ?? null,
      competitors: cleanArray(body.competitors),
      differentiators: cleanArray(body.differentiators),
      objections: cleanArray(body.objections),
      emotional_triggers: cleanArray(body.emotional_triggers),
      usage_moments: cleanArray(body.usage_moments),
      content_angles: cleanArray(body.content_angles),
      hook_ideas: cleanArray(body.hook_ideas),
      seasonality: body.seasonality?.trim().slice(0, 300) ?? null,
      raw_analysis: body.raw_analysis ?? null,
    })
    .select("id, name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
