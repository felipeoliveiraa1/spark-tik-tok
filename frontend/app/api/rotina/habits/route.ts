import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE_HEADERS });
}

/**
 * GET /api/rotina/habits → lista os hábitos da aluna logada
 * POST /api/rotina/habits → cria novo hábito custom
 * Body: { slug?, label, emoji?, category?, order_index? }
 *
 * Includes inativos (campo is_active no retorno) pra UI mostrar só ativos.
 */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_habits")
    .select("id, slug, label, emoji, category, order_index, is_active, scheduled_time")
    .eq("user_id", user.id)
    .order("order_index", { ascending: true });

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ habits: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.label !== "string" || !body.label.trim()) {
    return json({ error: "missing_label" }, { status: 400 });
  }

  const label = String(body.label).trim();
  const slug = typeof body.slug === "string" && body.slug ? slugify(body.slug) : slugify(label);

  const category = (typeof body.category === "string" ? body.category : "custom") as
    | "trabalho"
    | "pessoal"
    | "resultado"
    | "custom";
  if (!["trabalho", "pessoal", "resultado", "custom"].includes(category)) {
    return json({ error: "invalid_category" }, { status: 400 });
  }

  // Próximo order_index
  const { data: last } = await supabase
    .from("user_habits")
    .select("order_index")
    .eq("user_id", user.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.order_index as number) ?? -1) + 1;

  // scheduled_time: opcional, formato "HH:MM"
  let scheduled_time: string | null = null;
  if (body.scheduled_time !== undefined && body.scheduled_time !== null && body.scheduled_time !== "") {
    if (typeof body.scheduled_time !== "string" || !/^[0-2][0-9]:[0-5][0-9]$/.test(body.scheduled_time)) {
      return json({ error: "invalid_scheduled_time" }, { status: 400 });
    }
    scheduled_time = body.scheduled_time;
  }

  const payload = {
    user_id: user.id,
    slug,
    label,
    emoji: typeof body.emoji === "string" && body.emoji ? body.emoji : "✨",
    category,
    order_index: typeof body.order_index === "number" ? body.order_index : nextOrder,
    is_active: true,
    scheduled_time,
  };

  const { data, error } = await supabase
    .from("user_habits")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    const status = error.message.includes("duplicate") ? 409 : 500;
    return json({ error: error.message }, { status });
  }
  return json({ ok: true, habit: data });
}
