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
 * GET /api/admin/trials
 *
 * Lista todas as alunas em trial ativo + KPIs por urgência.
 * Ordenadas pela data de expiracao mais proxima (urgencia).
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();

  const { data: trials, error } = await supabase
    .from("profiles")
    .select(
      "id, email, name, whatsapp, plan_status, plan_expires_at, created_at, last_seen_at",
    )
    .eq("plan_status", "trial")
    .eq("plan_active", true)
    .order("plan_expires_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    email: string;
    name: string | null;
    whatsapp: string | null;
    plan_status: string;
    plan_expires_at: string | null;
    created_at: string;
    last_seen_at: string | null;
  };

  const now = Date.now();
  const enriched = ((trials ?? []) as Row[]).map((r) => {
    const expiresAt = r.plan_expires_at ? new Date(r.plan_expires_at).getTime() : null;
    const hoursLeft = expiresAt ? Math.max(0, (expiresAt - now) / 3600_000) : null;
    const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null;
    const expired = expiresAt !== null && expiresAt < now;
    let urgency: "expired" | "today" | "soon" | "week" | "later";
    if (expiresAt === null) urgency = "later";
    else if (expired) urgency = "expired";
    else if (hoursLeft! < 24) urgency = "today";
    else if (hoursLeft! < 72) urgency = "soon"; // 1-3 dias
    else if (hoursLeft! < 168) urgency = "week"; // 4-7 dias
    else urgency = "later";

    return {
      ...r,
      hours_left: hoursLeft,
      days_left: daysLeft,
      expired,
      urgency,
    };
  });

  const kpis = {
    total: enriched.length,
    today: enriched.filter((r) => r.urgency === "today").length,
    soon: enriched.filter((r) => r.urgency === "soon").length,
    week: enriched.filter((r) => r.urgency === "week").length,
    later: enriched.filter((r) => r.urgency === "later").length,
    expired: enriched.filter((r) => r.urgency === "expired").length,
    com_whatsapp: enriched.filter((r) => r.whatsapp !== null).length,
  };

  return NextResponse.json({ trials: enriched, kpis });
}
