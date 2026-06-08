import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/auth-crm";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE_HEADERS });
}

export async function GET() {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const last30Start = new Date(Date.now() - 30 * 86_400_000);

  const [byStatusRes, last7Res, last30Res, byAgentRes, recentEventsRes] =
    await Promise.all([
      // Contagem por status (geral)
      supabase.from("leads").select("status"),
      // Leads novos nos ultimos 7 dias
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
      // Eventos status_change nos ultimos 30 dias (pra calcular conversao)
      supabase
        .from("leads")
        .select("status, created_at")
        .gte("created_at", last30Start.toISOString()),
      // Distribuicao por agente atribuido
      supabase
        .from("leads")
        .select("assigned_to, status")
        .not("assigned_to", "is", null),
      // Eventos recentes (atividade)
      supabase
        .from("lead_events")
        .select("id, kind, actor_id, created_at, payload, lead_id")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const byStatus: Record<LeadStatus, number> = LEAD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = 0;
      return acc;
    },
    {} as Record<LeadStatus, number>,
  );
  for (const row of (byStatusRes.data ?? []) as { status: string }[]) {
    if ((LEAD_STATUSES as readonly string[]).includes(row.status)) {
      byStatus[row.status as LeadStatus]++;
    }
  }

  // Conversao (ultimos 30d): % convertidos / total
  const last30 = (last30Res.data ?? []) as { status: string }[];
  const total30 = last30.length;
  const converted30 = last30.filter((l) => l.status === "convertido").length;
  const lost30 = last30.filter((l) => l.status === "perdido").length;
  const conversionRate = total30 > 0 ? converted30 / total30 : 0;

  // Por agente
  const byAgent: Record<string, Record<LeadStatus, number>> = {};
  for (const row of (byAgentRes.data ?? []) as Array<{
    assigned_to: string;
    status: string;
  }>) {
    if (!byAgent[row.assigned_to]) {
      byAgent[row.assigned_to] = LEAD_STATUSES.reduce(
        (acc, s) => {
          acc[s] = 0;
          return acc;
        },
        {} as Record<LeadStatus, number>,
      );
    }
    if ((LEAD_STATUSES as readonly string[]).includes(row.status)) {
      byAgent[row.assigned_to][row.status as LeadStatus]++;
    }
  }

  // Hidrata nomes dos agentes
  const agentIds = Object.keys(byAgent);
  let agentsById = new Map<string, { name: string | null; email: string }>();
  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", agentIds);
    for (const a of (agents ?? []) as Array<{
      id: string;
      name: string | null;
      email: string;
    }>) {
      agentsById.set(a.id, { name: a.name, email: a.email });
    }
  }

  const agents = agentIds.map((id) => ({
    id,
    name: agentsById.get(id)?.name ?? null,
    email: agentsById.get(id)?.email ?? null,
    by_status: byAgent[id],
    total: Object.values(byAgent[id]).reduce((a, b) => a + b, 0),
  }));

  return json({
    by_status: byStatus,
    last_7_days: last7Res.count ?? 0,
    last_30_days: {
      total: total30,
      converted: converted30,
      lost: lost30,
      conversion_rate: conversionRate,
    },
    by_agent: agents,
    recent_events: recentEventsRes.data ?? [],
  });
}
