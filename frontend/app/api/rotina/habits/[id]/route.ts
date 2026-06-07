import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Headers anti-cache pra Android Chrome/PWA/SW nao cachear PATCH/DELETE.
// iOS Safari respeita cache: 'no-store' do fetch; Android as vezes ignora
// se o response nao tiver Cache-Control explicito.
const NO_CACHE_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE_HEADERS });
}

const EDITABLE = [
  "label",
  "emoji",
  "category",
  "order_index",
  "is_active",
  "scheduled_time",
] as const;

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
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

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) patch[k] = body[k];

  if (patch.category && !["trabalho", "pessoal", "resultado", "custom"].includes(patch.category as string)) {
    return json({ error: "invalid_category" }, { status: 400 });
  }

  // scheduled_time: aceita null (limpa), "" (vira null) ou "HH:MM" valido
  if ("scheduled_time" in patch) {
    const v = patch.scheduled_time;
    if (v === null || v === "") {
      patch.scheduled_time = null;
    } else if (typeof v !== "string" || !/^[0-2][0-9]:[0-5][0-9]$/.test(v)) {
      return json({ error: "invalid_scheduled_time" }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return json({ error: "empty_patch" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_habits")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  if (error) return json({ error: error.message }, { status: 500 });
  if (!data) return json({ error: "not_found" }, { status: 404 });
  return json({ ok: true, habit: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { error, data } = await supabase
    .from("user_habits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) return json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0)
    return json({ error: "not_found" }, { status: 404 });
  return json({ ok: true });
}
