import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Admin pode listar inclusive os não publicados; aluna só vê publicados.
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "1";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("news")
    .select("id, slug, category, title, excerpt, cover_url, reading_minutes, is_new, published_at")
    .order("published_at", { ascending: false });

  if (!(includeAll && isAdmin)) {
    query = query.lte("published_at", new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ news: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const required = ["slug", "title", "category"] as const;
  for (const k of required) {
    if (typeof body[k] !== "string" || !(body[k] as string).trim()) {
      return NextResponse.json({ error: `missing_${k}` }, { status: 400 });
    }
  }

  const payload = {
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    category: String(body.category).trim(),
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : null,
    cover_url: typeof body.cover_url === "string" ? body.cover_url : null,
    body_md: typeof body.body_md === "string" ? body.body_md : null,
    reading_minutes: typeof body.reading_minutes === "number" ? body.reading_minutes : 3,
    is_new: typeof body.is_new === "boolean" ? body.is_new : true,
    published_at:
      typeof body.published_at === "string" ? body.published_at : new Date().toISOString(),
  };

  const { data, error } = await supabase.from("news").insert(payload).select("*").single();
  if (error) {
    const status = error.message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true, item: data });
}
