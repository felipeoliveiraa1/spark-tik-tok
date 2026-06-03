import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const column = UUID_RE.test(id) ? "id" : "slug";
  const { data, error } = await supabase
    .from("education_videos")
    .select("*")
    .eq(column, id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Carrega modulo + irmãos (lições do mesmo modulo, ordenadas) pra navegação
  let mod = null;
  let siblings: Array<{
    id: string;
    slug: string;
    title: string;
    kind: string;
    order_index: number;
  }> = [];
  if (data.module_id) {
    const [modRes, sibsRes] = await Promise.all([
      supabase
        .from("education_modules")
        .select("id, slug, title, subtitle, accent, order_index")
        .eq("id", data.module_id)
        .maybeSingle(),
      supabase
        .from("education_videos")
        .select("id, slug, title, kind, order_index")
        .eq("module_id", data.module_id)
        .eq("is_published", true)
        .order("order_index", { ascending: true }),
    ]);
    mod = modRes.data;
    siblings = sibsRes.data ?? [];
  }

  return NextResponse.json({
    video: {
      ...data,
      cover_url:
        data.cover_url ||
        (data.kind === "video" && data.youtube_id ? youtubeThumbUrl(data.youtube_id, "hq") : null),
    },
    module: mod,
    siblings,
  });
}

const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "kind",
  "body_md",
  "checklist_items",
  "cover_url",
  "duration_seconds",
  "order_index",
  "is_published",
  "module_id",
  "file_url",
  "file_name",
  "file_size_bytes",
] as const;

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in body) patch[k] = body[k];
  }

  // youtube_url ou youtube_id também podem ser atualizados
  if ("youtube_url" in body || "youtube_id" in body) {
    const raw = (body.youtube_url ?? body.youtube_id) as string | null | undefined;
    const yid = extractYoutubeId(raw ?? null);
    if (!yid) {
      return NextResponse.json({ error: "invalid_youtube" }, { status: 400 });
    }
    patch.youtube_id = yid;
  }

  if (typeof body.slug === "string" && body.slug.trim()) {
    patch.slug = body.slug.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const column = UUID_RE.test(id) ? "id" : "slug";
  const { data, error } = await supabase
    .from("education_videos")
    .update(patch)
    .eq(column, id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const column = UUID_RE.test(id) ? "id" : "slug";
  const { data, error } = await supabase
    .from("education_videos")
    .delete()
    .eq(column, id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
