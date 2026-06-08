import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export type CrmRole = "admin" | "crm_agent";

/**
 * Helper pra rotas de API do CRM — aceita admin OU crm_agent.
 *
 * Uso:
 *   const guard = await requireCrmAccess();
 *   if (!guard.ok) return guard.response;
 *   const { supabase, user, role } = guard;
 */
export async function requireCrmAccess(): Promise<
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof getSupabaseServer>>;
      user: { id: string };
      role: CrmRole;
    }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }
  const role = profile?.role as string | undefined;
  if (role !== "admin" && role !== "crm_agent") {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, supabase, user: { id: user.id }, role: role as CrmRole };
}

/**
 * Check leve usado em server components. Retorna a role efetiva ou null.
 */
export async function getCurrentCrmRole(): Promise<CrmRole | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role as string | undefined;
  if (role === "admin" || role === "crm_agent") return role;
  return null;
}
