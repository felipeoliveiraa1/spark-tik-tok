import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const niche = url.searchParams.get("niche");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 100);

  const admin = getSupabaseAdmin();
  let query = admin
    .from("viral_videos")
    .select(
      "id, url, creator, thumbnail_url, posted_at, country, niche, views, likes, estimated_revenue_brl, product_name, hook_preview, last_seen_at",
    )
    .order("views", { ascending: false })
    .limit(limit);

  if (country) query = query.eq("country", country.toUpperCase());
  if (niche) query = query.eq("niche", niche);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ virais: data ?? [] });
}
