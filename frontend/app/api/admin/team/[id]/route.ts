import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

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

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * PATCH /api/admin/team/[id] — atualiza role do membro
 * body: { role: 'user' | 'crm_agent' | 'admin' }
 *
 * Setar role='user' efetivamente remove do time (mas mantem a conta).
 */
export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const role = body.role;
  if (role !== "user" && role !== "crm_agent" && role !== "admin") {
    return json({ error: "invalid_role" }, { status: 400 });
  }

  const svc = getServiceClient();
  const { data, error } = await svc
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id, role")
    .maybeSingle();
  if (error) return json({ error: error.message }, { status: 500 });
  if (!data) return json({ error: "not_found" }, { status: 404 });
  return json({ ok: true, profile: data });
}

/**
 * DELETE /api/admin/team/[id] — remove o usuário do Auth + profile (cascade).
 * Cuidado: apaga conta inteira. Pra so tirar do time, use PATCH role='user'.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  if (id === guard.user.id) {
    return json({ error: "cannot_delete_self" }, { status: 400 });
  }

  const svc = getServiceClient();
  const { error } = await svc.auth.admin.deleteUser(id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
