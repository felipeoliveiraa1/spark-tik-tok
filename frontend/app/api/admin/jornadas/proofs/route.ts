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
 * GET /api/admin/jornadas/proofs?status=pending|all
 * Fila de revisao. Default mostra pending + auto_approved baixa-conf.
 * Cada item vem com signed URL da imagem (5min).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") ?? "pending";

  let query = supabase
    .from("journey_proofs")
    .select(`
      id, user_id, journey_id, image_path, file_name, file_size_bytes,
      ocr_text, ocr_confidence, ocr_detected_sales, status,
      rejection_reason, reviewed_by, reviewed_at, created_at,
      profiles!inner(id, name, email, avatar_url),
      journeys!inner(slug, title)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter === "pending") {
    query = query.in("status", ["pending", "auto_approved"]);
  } else if (statusFilter === "approved") {
    query = query.in("status", ["approved", "auto_approved"]);
  } else if (statusFilter === "rejected") {
    query = query.eq("status", "rejected");
  }
  // status=all -> sem filtro

  const { data, error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });

  type Row = {
    id: string;
    user_id: string;
    journey_id: string;
    image_path: string;
    file_name: string | null;
    file_size_bytes: number | null;
    ocr_text: string | null;
    ocr_confidence: number | null;
    ocr_detected_sales: number | null;
    status: string;
    rejection_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    profiles: { id: string; name: string | null; email: string; avatar_url: string | null }
      | Array<{ id: string; name: string | null; email: string; avatar_url: string | null }>
      | null;
    journeys: { slug: string; title: string }
      | Array<{ slug: string; title: string }>
      | null;
  };

  const items = await Promise.all(
    ((data ?? []) as unknown as Row[]).map(async (row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const journey = Array.isArray(row.journeys) ? row.journeys[0] : row.journeys;

      const { data: signed } = await supabase.storage
        .from("journey-proofs")
        .createSignedUrl(row.image_path, 300); // 5min

      return {
        id: row.id,
        status: row.status,
        ocr_confidence: row.ocr_confidence,
        ocr_detected_sales: row.ocr_detected_sales,
        ocr_text: row.ocr_text,
        rejection_reason: row.rejection_reason,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        image_signed_url: signed?.signedUrl ?? null,
        file_name: row.file_name,
        student: {
          id: profile?.id ?? "",
          name: profile?.name ?? null,
          email: profile?.email ?? "",
          avatar_url: profile?.avatar_url ?? null,
        },
        journey: {
          slug: journey?.slug ?? "",
          title: journey?.title ?? "",
        },
      };
    }),
  );

  return json({ proofs: items });
}
