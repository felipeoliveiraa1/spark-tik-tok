import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/auth-crm";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/crm";

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

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ("status" in body) {
    const s = String(body.status);
    if (!LEAD_STATUSES.includes(s as LeadStatus)) {
      return json({ error: "invalid_status" }, { status: 400 });
    }
    patch.status = s;
  }

  if ("admin_note" in body) {
    const note = body.admin_note;
    patch.admin_note = typeof note === "string" ? note.trim() || null : null;
  }

  if ("assigned_to" in body) {
    const a = body.assigned_to;
    patch.assigned_to = typeof a === "string" && a.trim() ? a.trim() : null;
  }

  if (Object.keys(patch).length === 0) {
    return json({ error: "empty_patch" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return json({ error: error.message }, { status: 500 });
  if (!data) return json({ error: "not_found" }, { status: 404 });
  return json({ ok: true, lead: data });
}

// Delete continua so admin (crm_agent nao apaga). Verifica explicitamente.
export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  if (guard.role !== "admin") {
    return json({ error: "forbidden_role" }, { status: 403 });
  }
  const { supabase } = guard;
  const { id } = await params;

  const { error, data } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return json({ error: "not_found" }, { status: 404 });
  }
  return json({ ok: true });
}
