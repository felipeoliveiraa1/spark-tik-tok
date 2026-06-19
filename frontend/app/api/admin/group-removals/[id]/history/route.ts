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
 * GET /api/admin/group-removals/[id]/history
 * Historico completo de audits da aluna (ate 100 ultimas linhas).
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, name, email, plan_status, plan_canceled_at, group_removal_warned_at, group_removed_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (pErr) return json({ error: pErr.message }, { status: 500 });
  if (!profile) return json({ error: "not found" }, { status: 404 });

  const { data: events, error: eErr } = await supabase
    .from("group_removal_audit")
    .select("id, action, reason, payload, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (eErr) return json({ error: eErr.message }, { status: 500 });

  return json({ profile, events: events ?? [] });
}
