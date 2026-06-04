import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/admin/profile-history?id=<user_id>
 *
 * Retorna timeline completa de mudancas de plano da aluna (plan_status_history)
 * + dados do profile atual.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const [profileRes, historyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, name, whatsapp, plan_status, plan_active, plan_expires_at, plan_canceled_at, plan_renewed_at, created_at, had_trial, role",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("plan_status_history")
      .select("id, from_status, from_active, from_expires_at, to_status, to_active, to_expires_at, source, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 });
  }
  if (!profileRes.data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: profileRes.data,
    history: historyRes.data ?? [],
  });
}
