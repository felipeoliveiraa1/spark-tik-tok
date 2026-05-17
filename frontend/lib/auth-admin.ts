import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * Helper pra rotas de API que precisam de admin role.
 *
 * Uso:
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   const { supabase, user } = guard;
 *   ...
 */
export async function requireAdmin(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; user: { id: string } }
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
  if (!profile || profile.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, supabase, user: { id: user.id } };
}

/**
 * Check leve usado em páginas/server components — só retorna boolean.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin";
}
