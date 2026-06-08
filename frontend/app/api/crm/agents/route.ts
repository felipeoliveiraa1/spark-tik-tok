import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/auth-crm";

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
 * Lista quem pode atender leads (admin + crm_agent). Usado nos filtros
 * "Atribuído a" e no dropdown de atribuicao do card de lead.
 */
export async function GET() {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .in("role", ["admin", "crm_agent"])
    .order("name", { ascending: true });
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ agents: data ?? [] });
}
