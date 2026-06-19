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
 * POST /api/admin/group-removals/[id]/restore
 *
 * Zera group_removal_warned_at + group_removed_at do perfil — usado quando
 * admin quer "desfazer" uma remocao automatica (ex: foi engano, plano vai
 * voltar). NAO re-adiciona a aluna ao grupo (Evolution exige convite),
 * isso fica manual.
 *
 * Insere audit kind='skipped' reason='admin_restore' com actor_id=admin
 * que clicou.
 */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const adminUserId = guard.user.id;

  const { id } = await ctx.params;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const supabase = getServiceClient();

  const { data: before } = await supabase
    .from("profiles")
    .select("id, name, group_removal_warned_at, group_removed_at")
    .eq("id", id)
    .maybeSingle();
  if (!before) return json({ error: "not found" }, { status: 404 });

  const { error: updErr } = await supabase
    .from("profiles")
    .update({
      group_removal_warned_at: null,
      group_removed_at: null,
    })
    .eq("id", id);
  if (updErr) return json({ error: updErr.message }, { status: 500 });

  const { error: auditErr } = await supabase.from("group_removal_audit").insert({
    user_id: id,
    action: "skipped",
    reason: "admin_restore",
    payload: {
      admin_user_id: adminUserId,
      previous_warned_at: before.group_removal_warned_at,
      previous_removed_at: before.group_removed_at,
    },
  });
  if (auditErr) {
    // UPDATE ja rolou — log o erro de audit mas nao falha o request
    console.warn("[admin/group-removals/restore] audit insert failed:", auditErr.message);
  }

  return json({ ok: true });
}
