import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/auth-crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const NO_CACHE_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE_HEADERS });
}

export async function GET(_request: Request, { params }: Params) {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;
  const { id } = await params;

  const { data: events, error } = await supabase
    .from("lead_events")
    .select("id, lead_id, actor_id, kind, payload, created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return json({ error: error.message }, { status: 500 });

  // Hidrata nomes dos atores (sem JOIN — query separada eh mais robusto)
  const actorIds = Array.from(
    new Set(
      (events ?? []).map((e) => e.actor_id).filter(Boolean),
    ),
  ) as string[];

  let actorsById = new Map<string, { name: string | null; email: string }>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", actorIds);
    for (const a of (actors ?? []) as Array<{
      id: string;
      name: string | null;
      email: string;
    }>) {
      actorsById.set(a.id, { name: a.name, email: a.email });
    }
  }

  const hydrated = (events ?? []).map((e) => {
    const actor = e.actor_id ? actorsById.get(e.actor_id) : null;
    return {
      ...e,
      actor_name: actor?.name ?? actor?.email ?? null,
    };
  });

  return json({ events: hydrated });
}

export async function POST(request: Request, { params }: Params) {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = String(body.kind ?? "");
  if (!["note", "contact_attempt"].includes(kind)) {
    return json({ error: "invalid_kind" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return json({ error: "missing_text" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lead_events")
    .insert({
      lead_id: id,
      actor_id: user.id,
      kind,
      payload: { text },
    })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true, event: data });
}
