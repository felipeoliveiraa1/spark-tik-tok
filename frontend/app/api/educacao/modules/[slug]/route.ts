import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { youtubeThumbUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: mod, error: modErr } = await supabase
    .from("education_modules")
    .select("id, slug, title, subtitle, description, cover_url, accent, order_index, is_published")
    .eq("slug", slug)
    .maybeSingle();
  if (modErr) return NextResponse.json({ error: modErr.message }, { status: 500 });
  if (!mod) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: lessons, error: lErr } = await supabase
    .from("education_videos")
    .select(
      "id, slug, title, description, kind, youtube_id, body_md, checklist_items, cover_url, duration_seconds, order_index, is_published",
    )
    .eq("module_id", mod.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  const enriched = (lessons ?? []).map((l) => ({
    ...l,
    cover_url:
      l.cover_url ||
      (l.kind === "video" && l.youtube_id ? youtubeThumbUrl(l.youtube_id, "hq") : null),
  }));

  return NextResponse.json({ module: mod, lessons: enriched });
}
