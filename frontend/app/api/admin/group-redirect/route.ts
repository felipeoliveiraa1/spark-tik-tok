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
 * GET /api/admin/group-redirect — lista links + stats agregadas
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();

  const { data: links, error: lErr } = await supabase
    .from("group_redirect_links")
    .select("id, label, url, click_count, cap_count, is_active, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (lErr) return json({ error: lErr.message }, { status: 500 });

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalClicks, last24h, last7d, byUtmSource] = await Promise.all([
    supabase.from("group_redirect_clicks").select("*", { count: "exact", head: true }),
    supabase
      .from("group_redirect_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoff24h),
    supabase
      .from("group_redirect_clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", cutoff7d),
    supabase
      .from("group_redirect_clicks")
      .select("utm_source")
      .gte("created_at", cutoff7d)
      .not("utm_source", "is", null)
      .limit(5000),
  ]);

  const utmCounts = new Map<string, number>();
  for (const row of (byUtmSource.data ?? []) as { utm_source: string }[]) {
    const key = row.utm_source.slice(0, 50);
    utmCounts.set(key, (utmCounts.get(key) ?? 0) + 1);
  }
  const top_utm_sources_7d = Array.from(utmCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([utm_source, total]) => ({ utm_source, total }));

  return json({
    links: links ?? [],
    stats: {
      clicks_total: totalClicks.count ?? 0,
      clicks_last_24h: last24h.count ?? 0,
      clicks_last_7d: last7d.count ?? 0,
      top_utm_sources_7d,
    },
  });
}

/**
 * POST /api/admin/group-redirect — cria novo link
 * body: { label, url, cap_count?, sort_order? }
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as {
    label?: unknown;
    url?: unknown;
    cap_count?: unknown;
    sort_order?: unknown;
  };

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!label || label.length > 80) {
    return json({ error: "label invalido (1-80 chars)" }, { status: 400 });
  }
  if (!url.match(/^https?:\/\//)) {
    return json({ error: "url precisa comecar com http(s)://" }, { status: 400 });
  }
  const cap_count =
    typeof body.cap_count === "number" && body.cap_count > 0
      ? Math.floor(body.cap_count)
      : null;
  const sort_order =
    typeof body.sort_order === "number" ? Math.floor(body.sort_order) : 100;

  const { data, error } = await supabase
    .from("group_redirect_links")
    .insert({ label, url, cap_count, sort_order })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ link: data }, { status: 201 });
}
