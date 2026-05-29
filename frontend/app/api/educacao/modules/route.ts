import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/educacao/modules — cria novo módulo (admin)
 * Body: { slug, title, subtitle?, description?, cover_url?, accent?, order_index?, is_published? }
 */
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

  for (const k of ["slug", "title"] as const) {
    if (typeof body[k] !== "string" || !(body[k] as string).trim()) {
      return NextResponse.json({ error: `missing_${k}` }, { status: 400 });
    }
  }

  const accent = typeof body.accent === "string" ? body.accent : "rose";
  if (!["rose", "peach", "lilac"].includes(accent)) {
    return NextResponse.json({ error: "invalid_accent" }, { status: 400 });
  }

  const payload = {
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : null,
    description: typeof body.description === "string" ? body.description.trim() : null,
    cover_url: typeof body.cover_url === "string" ? body.cover_url.trim() : null,
    accent,
    order_index: typeof body.order_index === "number" ? body.order_index : 0,
    is_published: typeof body.is_published === "boolean" ? body.is_published : true,
  };

  const { data, error } = await supabase
    .from("education_modules")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    const status = error.message.includes("duplicate") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true, item: data });
}
