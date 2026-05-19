import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let query = supabase
    .from("live_events")
    .select(
      "id, slug, title, description, cover_url, youtube_id, starts_at, ends_at, duration_minutes, is_published, created_at",
    )
    .order("starts_at", { ascending: false });

  if (!(includeUnpublished && isAdmin)) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    events:
      data?.map((v) => ({
        ...v,
        cover_url: v.cover_url || (v.youtube_id ? youtubeThumbUrl(v.youtube_id, "hq") : null),
      })) ?? [],
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

  for (const k of ["slug", "title", "starts_at"] as const) {
    if (typeof body[k] !== "string" || !(body[k] as string).trim()) {
      return NextResponse.json({ error: `missing_${k}` }, { status: 400 });
    }
  }

  const youtubeRaw = typeof body.youtube_url === "string" ? body.youtube_url : body.youtube_id;
  const youtubeId = extractYoutubeId(typeof youtubeRaw === "string" ? youtubeRaw : null);
  if (!youtubeId) {
    return NextResponse.json({ error: "invalid_youtube" }, { status: 400 });
  }

  const payload = {
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    description: typeof body.description === "string" ? body.description.trim() : null,
    cover_url: typeof body.cover_url === "string" ? body.cover_url : null,
    youtube_id: youtubeId,
    starts_at: new Date(String(body.starts_at)).toISOString(),
    ends_at: body.ends_at ? new Date(String(body.ends_at)).toISOString() : null,
    duration_minutes: typeof body.duration_minutes === "number" ? body.duration_minutes : null,
    is_published: typeof body.is_published === "boolean" ? body.is_published : true,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("live_events")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    const status = error.message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true, item: data });
}
