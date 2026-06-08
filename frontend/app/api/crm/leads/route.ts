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

export async function GET(request: Request) {
  const guard = await requireCrmAccess();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const sellingParam = url.searchParams.get("selling");
  const search = (url.searchParams.get("search") ?? "").trim();
  const assignedTo = url.searchParams.get("assigned_to");

  let query = supabase
    .from("leads")
    .select(
      "id, nome, telefone, tiktok_handle, already_selling, revenue_range, utm_source, utm_medium, utm_campaign, utm_content, status, admin_note, assigned_to, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (status && LEAD_STATUSES.includes(status as LeadStatus)) {
    query = query.eq("status", status);
  }
  if (sellingParam === "yes") {
    query = query.eq("already_selling", true);
  } else if (sellingParam === "no") {
    query = query.eq("already_selling", false);
  }
  if (assignedTo === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (assignedTo && assignedTo !== "all") {
    query = query.eq("assigned_to", assignedTo);
  }
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(
      `nome.ilike.%${escaped}%,telefone.ilike.%${escaped}%,tiktok_handle.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ leads: data ?? [] });
}
