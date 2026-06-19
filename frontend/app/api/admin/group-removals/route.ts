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

function maskWhatsapp(input: string | null): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 6) return input;
  return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
}

type Status = "all" | "warned" | "ready_to_remove" | "removed" | "pending_warn";

/**
 * GET /api/admin/group-removals
 *
 * Query params:
 *   status: all | pending_warn | warned | ready_to_remove | removed (default: all)
 *   search: busca por nome ou email (ilike)
 *   limit: 1..200 (default 50)
 *   offset: paginacao
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);

  const statusRaw = (searchParams.get("status") ?? "all") as Status;
  const status: Status = ["all", "pending_warn", "warned", "ready_to_remove", "removed"].includes(
    statusRaw,
  )
    ? statusRaw
    : "all";
  const search = (searchParams.get("search") ?? "").trim();
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  let query = supabase
    .from("profiles")
    .select(
      "id, name, email, whatsapp, plan_status, plan_active, plan_canceled_at, plan_expires_at, group_removal_warned_at, group_removed_at, role",
      { count: "exact" },
    )
    .eq("plan_active", false)
    .in("plan_status", ["canceled", "inactive", "refunded", "chargeback"]);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status === "removed") {
    query = query.not("group_removed_at", "is", null);
  } else if (status === "warned") {
    query = query.not("group_removal_warned_at", "is", null).is("group_removed_at", null);
  } else if (status === "ready_to_remove") {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query
      .not("group_removal_warned_at", "is", null)
      .is("group_removed_at", null)
      .lte("group_removal_warned_at", cutoff);
  } else if (status === "pending_warn") {
    query = query.is("group_removal_warned_at", null).is("group_removed_at", null);
  }

  query = query
    .order("group_removed_at", { ascending: false, nullsFirst: false })
    .order("group_removal_warned_at", { ascending: false, nullsFirst: false })
    .order("plan_canceled_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return json({ error: error.message }, { status: 500 });

  // Filtra staff em memoria (Supabase nao tem syntax limpa pra NOT IN)
  const filteredRows = (data ?? []).filter(
    (p) => p.role !== "admin" && p.role !== "crm_agent",
  );

  // Busca ultimo audit por user pra mostrar reason atual
  const userIds = filteredRows.map((p) => p.id as string);
  const auditByUser = new Map<
    string,
    { action: string; reason: string | null; created_at: string }
  >();
  if (userIds.length > 0) {
    const { data: audits } = await supabase
      .from("group_removal_audit")
      .select("user_id, action, reason, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    for (const a of audits ?? []) {
      const uid = a.user_id as string;
      if (!auditByUser.has(uid)) {
        auditByUser.set(uid, {
          action: a.action as string,
          reason: (a.reason as string | null) ?? null,
          created_at: a.created_at as string,
        });
      }
    }
  }

  const now = Date.now();
  const items = filteredRows.map((p) => {
    const warnedAt = p.group_removal_warned_at as string | null;
    const removedAt = p.group_removed_at as string | null;
    const warnedMs = warnedAt ? new Date(warnedAt).getTime() : null;
    const computedStatus: Exclude<Status, "all"> = removedAt
      ? "removed"
      : warnedAt && warnedMs !== null && now - warnedMs >= 24 * 60 * 60 * 1000
        ? "ready_to_remove"
        : warnedAt
          ? "warned"
          : "pending_warn";
    return {
      id: p.id as string,
      name: (p.name as string | null) ?? null,
      email: p.email as string,
      whatsapp_masked: maskWhatsapp(p.whatsapp as string | null),
      plan_status: p.plan_status as string | null,
      plan_canceled_at: p.plan_canceled_at as string | null,
      plan_expires_at: p.plan_expires_at as string | null,
      group_removal_warned_at: warnedAt,
      group_removed_at: removedAt,
      status: computedStatus,
      last_audit: auditByUser.get(p.id as string) ?? null,
    };
  });

  return json({ items, total: count ?? items.length, limit, offset });
}
