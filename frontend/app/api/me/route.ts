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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, niche, plan_active, must_reset_password, role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ profile });
}

/**
 * PATCH /api/me — atualiza dados do perfil da aluna.
 * Aceita: name (string), niche (string).
 * Não permite editar email, plan_active, role — esses são gerenciados
 * por outras rotas (webhook Kiwify, admin).
 */
export async function PATCH(request: Request) {
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

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const trimmed = body.name.trim().slice(0, 80);
    patch.name = trimmed || null;
  }
  if (typeof body.niche === "string") {
    const trimmed = body.niche.trim().slice(0, 80);
    patch.niche = trimmed || null;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, email, name, niche, plan_active, must_reset_password, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
