import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LessonRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  kind: "video" | "rich" | "checklist";
  youtube_id: string | null;
  body_md: string | null;
  checklist_items: unknown;
  cover_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_published: boolean;
  module_id: string | null;
  created_at: string;
};

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  accent: string | null;
  order_index: number;
  is_published: boolean;
};

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get("all") === "1";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  // Modulos
  let modQuery = supabase
    .from("education_modules")
    .select("id, slug, title, subtitle, description, cover_url, accent, order_index, is_published")
    .order("order_index", { ascending: true });
  if (!(includeUnpublished && isAdmin)) {
    modQuery = modQuery.eq("is_published", true);
  }

  // Aulas
  let lessonQuery = supabase
    .from("education_videos")
    .select(
      "id, slug, title, description, category, kind, youtube_id, body_md, checklist_items, cover_url, duration_seconds, order_index, is_published, module_id, created_at",
    )
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });
  if (!(includeUnpublished && isAdmin)) {
    lessonQuery = lessonQuery.eq("is_published", true);
  }

  const [modsRes, lessonsRes] = await Promise.all([modQuery, lessonQuery]);
  if (modsRes.error) {
    return NextResponse.json({ error: modsRes.error.message }, { status: 500 });
  }
  if (lessonsRes.error) {
    return NextResponse.json({ error: lessonsRes.error.message }, { status: 500 });
  }

  const modules = (modsRes.data ?? []) as ModuleRow[];
  const lessons = (lessonsRes.data ?? []) as LessonRow[];

  // Enriquecer cover dos videos com thumb do YouTube quando faltar
  const enrichedLessons = lessons.map((l) => ({
    ...l,
    cover_url:
      l.cover_url ||
      (l.kind === "video" && l.youtube_id ? youtubeThumbUrl(l.youtube_id, "hq") : null),
  }));

  // Aulas agrupadas por modulo
  const lessonsByModule = new Map<string, LessonRow[]>();
  const orphans: LessonRow[] = [];
  for (const l of enrichedLessons) {
    if (l.module_id) {
      const arr = lessonsByModule.get(l.module_id) ?? [];
      arr.push(l);
      lessonsByModule.set(l.module_id, arr);
    } else {
      orphans.push(l);
    }
  }

  const modulesWithLessons = modules.map((m) => ({
    ...m,
    lessons: (lessonsByModule.get(m.id) ?? []).sort(
      (a, b) => a.order_index - b.order_index,
    ),
  }));

  return NextResponse.json({
    modules: modulesWithLessons,
    // Backwards compat — /admin/educacao ainda consome lista flat
    videos: enrichedLessons,
    orphan_lessons: orphans,
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase, user } = guard;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  for (const k of ["slug", "title"] as const) {
    if (typeof body[k] !== "string" || !(body[k] as string).trim()) {
      return NextResponse.json({ error: `missing_${k}` }, { status: 400 });
    }
  }

  const kind = (typeof body.kind === "string" ? body.kind : "video") as
    | "video"
    | "rich"
    | "checklist";
  if (!["video", "rich", "checklist"].includes(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  let youtubeId: string | null = null;
  if (kind === "video") {
    const youtubeRaw =
      typeof body.youtube_url === "string" ? body.youtube_url : body.youtube_id;
    youtubeId = extractYoutubeId(typeof youtubeRaw === "string" ? youtubeRaw : null);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "invalid_youtube", message: "youtube_url ou youtube_id válido é obrigatório pra aula video" },
        { status: 400 },
      );
    }
  }

  const payload = {
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    description: typeof body.description === "string" ? body.description.trim() : null,
    category: typeof body.category === "string" ? body.category.trim() : null,
    kind,
    youtube_id: youtubeId,
    body_md: typeof body.body_md === "string" ? body.body_md : null,
    checklist_items: Array.isArray(body.checklist_items) ? body.checklist_items : null,
    cover_url: typeof body.cover_url === "string" ? body.cover_url : null,
    duration_seconds: typeof body.duration_seconds === "number" ? body.duration_seconds : null,
    order_index: typeof body.order_index === "number" ? body.order_index : 0,
    is_published: typeof body.is_published === "boolean" ? body.is_published : true,
    module_id: typeof body.module_id === "string" ? body.module_id : null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("education_videos")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    const status = error.message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true, item: data });
}
