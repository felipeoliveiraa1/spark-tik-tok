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
    .from("live_events")
    .select("*")
    .eq(column, id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    event: {
      ...data,
      cover_url: data.cover_url || (data.youtube_id ? youtubeThumbUrl(data.youtube_id, "max") : null),
    },
  });
}

const EDITABLE = [
  "title",
  "description",
  "cover_url",
  "starts_at",
  "ends_at",
  "duration_minutes",
  "is_published",
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
  for (const k of EDITABLE) {
    if (k in body) patch[k] = body[k];
  }
  if ("youtube_url" in body || "youtube_id" in body) {
    const raw = (body.youtube_url ?? body.youtube_id) as string | null | undefined;
    const yid = extractYoutubeId(raw ?? null);
    if (!yid) return NextResponse.json({ error: "invalid_youtube" }, { status: 400 });
    patch.youtube_id = yid;
  }
  if (typeof body.slug === "string" && body.slug.trim()) patch.slug = body.slug.trim();
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const column = UUID_RE.test(id) ? "id" : "slug";
  const { data, error } = await supabase
    .from("live_events")
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
    .from("live_events")
    .delete()
    .eq(column, id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
