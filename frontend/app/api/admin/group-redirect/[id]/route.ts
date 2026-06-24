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
 * PATCH /api/admin/group-redirect/[id]
 * body: { label?, url?, cap_count? (null pra remover), is_active?, sort_order?, reset_count? }
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  if (typeof body.label === "string") {
    const label = body.label.trim();
    if (!label || label.length > 80) {
      return json({ error: "label invalido" }, { status: 400 });
    }
    update.label = label;
  }
  if (typeof body.url === "string") {
    const url = body.url.trim();
    if (!url.match(/^https?:\/\//)) {
      return json({ error: "url precisa comecar com http(s)://" }, { status: 400 });
    }
    update.url = url;
  }
  if (body.cap_count === null) {
    update.cap_count = null;
  } else if (typeof body.cap_count === "number" && body.cap_count > 0) {
    update.cap_count = Math.floor(body.cap_count);
  }
  if (typeof body.is_active === "boolean") {
    update.is_active = body.is_active;
  }
  if (typeof body.sort_order === "number") {
    update.sort_order = Math.floor(body.sort_order);
  }
  if (body.reset_count === true) {
    update.click_count = 0;
  }

  if (Object.keys(update).length === 0) {
    return json({ error: "nada pra atualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("group_redirect_links")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ link: data });
}

/**
 * DELETE /api/admin/group-redirect/[id]
 * Soft delete: marca is_active=false. Mantem clicks pra historico.
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!id) return json({ error: "missing id" }, { status: 400 });

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("group_redirect_links")
    .update({ is_active: false })
    .eq("id", id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
