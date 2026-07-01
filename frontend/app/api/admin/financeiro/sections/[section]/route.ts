import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/financeiro/sections/[section]?search=&page=1&pageSize=50
 *
 * Retorna lista paginada de alunas por status financeiro.
 *
 * Sections:
 *   - renewals-upcoming  → prox. 30d pra renovar (plan_next_payment)
 *   - canceled           → plan_status='canceled' (ultimos 90d)
 *   - refunded           → plan_status='refunded' (all-time)
 *   - late               → plan_status='late' OU next_payment vencido
 *   - trial              → plan_status='trial' + trial_expiring
 *
 * Response: { rows: Row[], total: number, page: number, pageSize: number }
 */

const SECTIONS = ["renewals-upcoming", "canceled", "refunded", "late", "trial"] as const;
type Section = (typeof SECTIONS)[number];

function isSection(s: string): s is Section {
  return (SECTIONS as readonly string[]).includes(s);
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  plan_status: string | null;
  plan_active: boolean | null;
  plan_next_payment: string | null;
  plan_renewed_at: string | null;
  plan_canceled_at: string | null;
  plan_expires_at: string | null;
  created_at: string;
  role: string | null;
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ section: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { section: sec } = await ctx.params;
  if (!isSection(sec)) {
    return NextResponse.json({ error: "invalid section" }, { status: 400 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    200,
    Math.max(10, parseInt(url.searchParams.get("pageSize") ?? "50", 10)),
  );

  const svc = getServiceClient();
  const nowIso = new Date().toISOString();
  const now = new Date(nowIso);
  const in30d = new Date(now.getTime() + 30 * 86400000).toISOString();
  const days90Ago = new Date(now.getTime() - 90 * 86400000).toISOString();
  const days14Ago = new Date(now.getTime() - 14 * 86400000).toISOString();
  const in3d = new Date(now.getTime() + 3 * 86400000).toISOString();

  let query = svc
    .from("profiles")
    .select(
      "id, email, name, whatsapp, plan_status, plan_active, plan_next_payment, plan_renewed_at, plan_canceled_at, plan_expires_at, created_at, role",
      { count: "exact" },
    )
    .or("role.is.null,role.neq.admin");

  switch (sec) {
    case "renewals-upcoming":
      query = query
        .in("plan_status", ["active", "late"])
        .eq("plan_active", true)
        .gte("plan_next_payment", nowIso)
        .lte("plan_next_payment", in30d)
        .order("plan_next_payment", { ascending: true });
      break;
    case "canceled":
      query = query
        .eq("plan_status", "canceled")
        .gte("plan_canceled_at", days90Ago)
        .order("plan_canceled_at", { ascending: false });
      break;
    case "refunded":
      query = query
        .eq("plan_status", "refunded")
        .order("plan_canceled_at", { ascending: false });
      break;
    case "late":
      // late = plan_status=late OU (active + next_payment vencido nos ultimos 14d)
      query = query
        .in("plan_status", ["active", "late"])
        .eq("plan_active", true)
        .lt("plan_next_payment", nowIso)
        .gte("plan_next_payment", days14Ago)
        .order("plan_next_payment", { ascending: true });
      break;
    case "trial":
      // Trial expirando <=3d
      query = query
        .eq("plan_status", "trial")
        .eq("plan_active", true)
        .lte("plan_expires_at", in3d)
        .gte("plan_expires_at", nowIso)
        .order("plan_expires_at", { ascending: true });
      break;
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data as ProfileRow[]) ?? [];

  // Enriquecimento: pra renewals-upcoming, adiciona dias_ate_renovar
  const enriched = rows.map((r) => {
    const daysUntilRenewal = r.plan_next_payment
      ? Math.round(
          (new Date(r.plan_next_payment).getTime() - now.getTime()) / 86400000,
        )
      : null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      whatsapp: r.whatsapp,
      plan_status: r.plan_status,
      plan_next_payment: r.plan_next_payment,
      plan_canceled_at: r.plan_canceled_at,
      plan_expires_at: r.plan_expires_at,
      plan_renewed_at: r.plan_renewed_at,
      created_at: r.created_at,
      days_until_renewal: daysUntilRenewal,
    };
  });

  return NextResponse.json({
    section: sec,
    rows: enriched,
    total: count ?? 0,
    page,
    pageSize,
  });
}
