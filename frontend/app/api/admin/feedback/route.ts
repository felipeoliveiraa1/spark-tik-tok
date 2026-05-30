import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/feedback → lista todos os reports
 *   ?type=bug|suggestion (opcional)
 *   ?status=open|in_review|resolved|dismissed (opcional)
 *   ?q=busca (opcional, busca title/description)
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type");
  const statusFilter = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();

  let query = supabase
    .from("user_feedback")
    .select(
      "id, type, title, description, page_url, user_agent, status, admin_note, created_at, updated_at, user_id, profiles!user_feedback_user_id_fkey(name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (typeFilter === "bug" || typeFilter === "suggestion") {
    query = query.eq("type", typeFilter);
  }
  if (
    statusFilter === "open" ||
    statusFilter === "in_review" ||
    statusFilter === "resolved" ||
    statusFilter === "dismissed"
  ) {
    query = query.eq("status", statusFilter);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ feedback: data ?? [] });
}
