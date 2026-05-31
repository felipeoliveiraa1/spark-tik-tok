import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = ["new", "contacted", "converted", "dismissed"] as const;
type Status = (typeof VALID_STATUS)[number];

/**
 * PATCH /api/admin/leads/[id] → atualiza status ou admin_note
 *   body: { status?: Status, admin_note?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ("status" in body) {
    const s = body.status;
    if (typeof s !== "string" || !VALID_STATUS.includes(s as Status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    patch.status = s;
  }
  if ("admin_note" in body) {
    const n = body.admin_note;
    if (n !== null && typeof n !== "string") {
      return NextResponse.json({ error: "invalid_admin_note" }, { status: 400 });
    }
    patch.admin_note = n === null ? null : (n as string).trim().slice(0, 2000) || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select(
      "id, nome, telefone, tiktok_handle, already_selling, revenue_range, status, admin_note, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

/**
 * DELETE /api/admin/leads/[id] → remove um lead
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
