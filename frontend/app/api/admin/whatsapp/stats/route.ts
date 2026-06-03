import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getServiceClient } from "@/lib/whatsapp-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp/stats
 * Retorna KPIs + ultimas 30 mensagens da outbox pra UI admin.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();

  const todayStart = new Date();
  todayStart.setUTCHours(3, 0, 0, 0);
  if (todayStart.getTime() > Date.now()) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }
  const weekStart = new Date(Date.now() - 7 * 86400_000);

  const [
    usersWithWhatsapp,
    usersTotal,
    sentToday,
    sentWeek,
    pendingNow,
    failedWeek,
    recent,
    instances,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("whatsapp", "is", null)
      .or("plan_active.eq.true,role.eq.admin"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .or("plan_active.eq.true,role.eq.admin"),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", todayStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", weekStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("whatsapp_outbox")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("whatsapp_outbox")
      .select(
        "id, user_id, template_key, status, phone, sent_at, created_at, error, profiles!whatsapp_outbox_user_id_fkey(name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("whatsapp_instances")
      .select("id, name, display_name, is_active, priority, daily_limit, purpose")
      .order("priority", { ascending: true }),
  ]);

  type RawRecent = {
    id: string;
    user_id: string;
    template_key: string;
    status: string;
    phone: string;
    sent_at: string | null;
    created_at: string;
    error: string | null;
    profiles:
      | { name: string | null; email: string }
      | { name: string | null; email: string }[]
      | null;
  };

  const recentRows = ((recent.data as RawRecent[] | null) ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      user_id: r.user_id,
      template_key: r.template_key,
      status: r.status,
      phone: r.phone,
      sent_at: r.sent_at,
      created_at: r.created_at,
      error: r.error,
      user_name: p?.name ?? null,
      user_email: p?.email ?? null,
    };
  });

  return NextResponse.json({
    users_with_whatsapp: usersWithWhatsapp.count ?? 0,
    users_total: usersTotal.count ?? 0,
    sent_today: sentToday.count ?? 0,
    sent_week: sentWeek.count ?? 0,
    pending_now: pendingNow.count ?? 0,
    failed_week: failedWeek.count ?? 0,
    recent: recentRows,
    instances: instances.data ?? [],
  });
}
