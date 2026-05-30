import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/me/tutorials → { seen: string[] }
 * Retorna a lista de keys de tour que a aluna ja completou.
 */
export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("tutorials_seen")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = Array.isArray(data?.tutorials_seen) ? (data!.tutorials_seen as string[]) : [];
  return NextResponse.json({ seen });
}

/**
 * POST /api/me/tutorials → body { key: string }
 * Adiciona a key ao array de tours vistos (idempotente).
 */
export async function POST(request: Request) {
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

  const key = typeof body.key === "string" ? body.key.trim().slice(0, 60) : "";
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });

  // Le array atual, adiciona se nao tiver, escreve de volta
  const { data: current } = await supabase
    .from("profiles")
    .select("tutorials_seen")
    .eq("id", user.id)
    .maybeSingle();

  const seen = Array.isArray(current?.tutorials_seen)
    ? (current!.tutorials_seen as string[])
    : [];

  if (seen.includes(key)) {
    return NextResponse.json({ seen });
  }

  const next = [...seen, key];
  const { error } = await supabase
    .from("profiles")
    .update({ tutorials_seen: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seen: next });
}

/**
 * DELETE /api/me/tutorials → body { key: string }
 * Remove a key do array (pra refazer tour). Idempotente.
 */
export async function DELETE(request: Request) {
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

  const key = typeof body.key === "string" ? body.key.trim().slice(0, 60) : "";
  if (!key) return NextResponse.json({ error: "missing_key" }, { status: 400 });

  const { data: current } = await supabase
    .from("profiles")
    .select("tutorials_seen")
    .eq("id", user.id)
    .maybeSingle();

  const seen = Array.isArray(current?.tutorials_seen)
    ? (current!.tutorials_seen as string[])
    : [];
  const next = seen.filter((k) => k !== key);

  if (next.length === seen.length) {
    return NextResponse.json({ seen });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tutorials_seen: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seen: next });
}
