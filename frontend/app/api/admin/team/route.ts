import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * GET /api/admin/team — lista admins e crm_agents
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at")
    .in("role", ["admin", "crm_agent"])
    .order("created_at", { ascending: false });
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ members: data ?? [] });
}

/**
 * POST /api/admin/team — cria novo membro da equipe (admin ou crm_agent)
 * body: { email, password, name, role: 'admin' | 'crm_agent' }
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return json({ error: "invalid_email" }, { status: 400 });
  }
  const password =
    typeof body.password === "string" && body.password.length >= 8
      ? body.password
      : null;
  if (!password) {
    return json({ error: "password_min_8" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const role =
    body.role === "admin" || body.role === "crm_agent" ? body.role : "crm_agent";

  const svc = getServiceClient();

  const { data: existing } = await svc
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    // So promove role (sem mexer em senha)
    const { error: updErr } = await svc
      .from("profiles")
      .update({ role, name: name || null })
      .eq("id", existing.id);
    if (updErr) return json({ error: updErr.message }, { status: 500 });
    return json({ ok: true, mode: "updated_role", id: existing.id });
  }

  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createErr || !created.user) {
    return json(
      { error: `createUser failed: ${createErr?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  const { error: updErr } = await svc
    .from("profiles")
    .update({
      name: name || null,
      role,
      // Esses sao membros internos, nao tem plano de aluna
      plan_active: false,
      plan_status: "inactive",
    })
    .eq("id", created.user.id);

  if (updErr) {
    return json({ error: updErr.message }, { status: 500 });
  }

  return json({ ok: true, mode: "created", id: created.user.id });
}
