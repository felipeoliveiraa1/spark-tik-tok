import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { youtubeThumbUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const column = UUID_RE.test(slug) ? "id" : "slug";

  const { data: mod, error: modErr } = await supabase
    .from("education_modules")
    .select(
      "id, slug, title, subtitle, description, cover_url, accent, order_index, is_published",
    )
    .eq(column, slug)
    .maybeSingle();
  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 });
  if (!mod) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Admin pode ver não-publicadas
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  let lessonQuery = supabase
    .from("education_videos")
    .select(
      "id, slug, title, description, kind, youtube_id, body_md, checklist_items, cover_url, duration_seconds, order_index, is_published",
    )
    .eq("module_id", mod.id)
    .order("order_index", { ascending: true });
  if (!isAdmin) {
    lessonQuery = lessonQuery.eq("is_published", true);
  }

  const { data: lessons, error: lErr } = await lessonQuery;
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  const enriched = (lessons ?? []).map((l) => ({
    ...l,
    cover_url:
      l.cover_url ||
      (l.kind === "video" && l.youtube_id ? youtubeThumbUrl(l.youtube_id, "hq") : null),
  }));

  return NextResponse.json({ module: mod, lessons: enriched });
}

const EDITABLE_FIELDS = [
  "title",
  "subtitle",
  "description",
  "cover_url",
  "accent",
  "order_index",
  "is_published",
] as const;

export async function PATCH(request: Request, { params }: Params) {
  const { slug } = await params;
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
  if (typeof body.slug === "string" && body.slug.trim()) {
    patch.slug = body.slug.trim();
  }

  if (patch.accent && !["rose", "peach", "lilac"].includes(patch.accent as string)) {
    return NextResponse.json({ error: "invalid_accent" }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const column = UUID_RE.test(slug) ? "id" : "slug";
  const { data, error } = await supabase
    .from("education_modules")
    .update(patch)
    .eq(column, slug)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { slug } = await params;
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const column = UUID_RE.test(slug) ? "id" : "slug";

  // Verifica se tem aulas vinculadas — se sim, exige confirmação explicit via ?force=1
  const { data: mod } = await supabase
    .from("education_modules")
    .select("id")
    .eq(column, slug)
    .maybeSingle();
  if (!mod) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Aulas viram orphans (module_id = null) ao invés de deletar — preserva conteúdo
  await supabase
    .from("education_videos")
    .update({ module_id: null })
    .eq("module_id", mod.id);

  const { error } = await supabase
    .from("education_modules")
    .delete()
    .eq(column, slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
