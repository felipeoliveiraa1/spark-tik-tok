import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista os virais que a aluna salvou na biblioteca dela.
 * Filtros opcionais: country (BR|US), niche.
 */
export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const niche = url.searchParams.get("niche");

  let query = supabase
    .from("saved_virals")
    .select(
      "id, source_video_id, url, thumbnail_url, rank, creator, creator_avatar_url, country, niche, caption, hook, views, likes, comments, shares, estimated_revenue_brl, product_name, product_shop_url, product_price_brl, saved_at",
    )
    .order("saved_at", { ascending: false });

  if (country) query = query.eq("country", country.toUpperCase());
  if (niche) query = query.eq("niche", niche);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ virais: data ?? [] });
}
