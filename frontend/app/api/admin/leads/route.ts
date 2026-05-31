import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads → lista leads com filtros
 *   ?status=new|contacted|converted|dismissed
 *   ?selling=yes|no
 *   ?q=busca (nome/telefone/tiktok)
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const selling = url.searchParams.get("selling");
  const q = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("leads")
    .select(
      "id, nome, telefone, tiktok_handle, already_selling, revenue_range, utm_source, utm_medium, utm_campaign, utm_content, status, admin_note, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (
    status === "new" ||
    status === "contacted" ||
    status === "converted" ||
    status === "dismissed"
  ) {
    query = query.eq("status", status);
  }
  if (selling === "yes") query = query.eq("already_selling", true);
  if (selling === "no") query = query.eq("already_selling", false);
  if (q) {
    query = query.or(
      `nome.ilike.%${q}%,telefone.ilike.%${q}%,tiktok_handle.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}
