import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}

const EDITABLE = [
  "name",
  "image_url",
  "category",
  "target_audience",
  "pain_points",
  "strengths",
  "price_range",
  "competitors",
  "differentiators",
  "objections",
  "emotional_triggers",
  "usage_moments",
  "content_angles",
  "hook_ideas",
  "seasonality",
] as const;

/**
 * PATCH — atualiza um produto da aluna. RLS garante que ela só edita os
 * próprios produtos. Aceita merge de arrays via flag append (default true
 * pra pain_points/strengths/competitors) — útil quando a IA quer "agregar"
 * info sem sobrescrever.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Quando append=true (default), arrays são MERGADOS com o que já existe
  // em vez de sobrescrever. Pra forçar substituição, passa append:false.
  const append = body.append !== false;

  // Lê o produto atual pra merge de arrays
  const { data: current, error: readErr } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    const incoming = body[k];
    const existing = (current as Record<string, unknown>)[k];
    if (Array.isArray(incoming) && Array.isArray(existing) && append) {
      // Merge dedup pra arrays
      const merged = Array.from(new Set([...(existing as string[]), ...(incoming as string[])]));
      patch[k] = merged;
    } else {
      patch[k] = incoming;
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, product: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
