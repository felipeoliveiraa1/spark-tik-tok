import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/admin/group-removals/stats
 * Contadores agregados pra header da pagina.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const baseCounter = () =>
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("plan_active", false)
      .in("plan_status", ["canceled", "inactive", "refunded", "chargeback"]);

  const [pendingWarn, warnedAwaiting, readyToRemove, removedTotal, removedLast7d, failedActive] =
    await Promise.all([
      // Cancelada e ainda nao avisada
      baseCounter()
        .is("group_removal_warned_at", null)
        .is("group_removed_at", null),
      // Avisada mas ainda nao passou 24h
      baseCounter()
        .not("group_removal_warned_at", "is", null)
        .is("group_removed_at", null)
        .gt("group_removal_warned_at", cutoff24h),
      // Avisada ha >=24h, pronta pra remocao (proximo tick)
      baseCounter()
        .not("group_removal_warned_at", "is", null)
        .is("group_removed_at", null)
        .lte("group_removal_warned_at", cutoff24h),
      // Total removidas (historico)
      baseCounter().not("group_removed_at", "is", null),
      // Removidas nos ultimos 7d
      baseCounter()
        .not("group_removed_at", "is", null)
        .gte("group_removed_at", cutoff7d),
      // Audit "failed" nas ultimas 24h
      supabase
        .from("group_removal_audit")
        .select("*", { count: "exact", head: true })
        .eq("action", "failed")
        .gte("created_at", cutoff24h),
    ]);

  return json({
    pending_warn: pendingWarn.count ?? 0,
    warned_awaiting_24h: warnedAwaiting.count ?? 0,
    ready_to_remove: readyToRemove.count ?? 0,
    removed_total: removedTotal.count ?? 0,
    removed_last_7d: removedLast7d.count ?? 0,
    failed_last_24h: failedActive.count ?? 0,
  });
}
