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

const LESSON_KINDS = ["video", "rich", "checklist", "ebook"] as const;

/**
 * POST /api/admin/jornadas/[id]/lessons — cria aula na jornada
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id: journeyId } = await ctx.params;
  const supabase = getServiceClient();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const kind = body.kind as string | undefined;

  if (!slug || !slug.match(/^[a-z0-9-]+$/)) {
    return json({ error: "slug invalido (a-z, 0-9, hifens)" }, { status: 400 });
  }
  if (!title) return json({ error: "title obrigatorio" }, { status: 400 });
  if (!kind || !LESSON_KINDS.includes(kind as (typeof LESSON_KINDS)[number])) {
    return json({ error: "kind invalido" }, { status: 400 });
  }
  if (kind === "video" && typeof body.youtube_id !== "string") {
    return json({ error: "youtube_id obrigatorio pra kind=video" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journey_lessons")
    .insert({
      journey_id: journeyId,
      slug,
      title,
      description: typeof body.description === "string" ? body.description : null,
      kind,
      youtube_id: typeof body.youtube_id === "string" ? body.youtube_id : null,
      body_md: typeof body.body_md === "string" ? body.body_md : null,
      checklist_items: body.checklist_items ?? null,
      file_url: typeof body.file_url === "string" ? body.file_url : null,
      file_name: typeof body.file_name === "string" ? body.file_name : null,
      file_size_bytes: typeof body.file_size_bytes === "number" ? body.file_size_bytes : null,
      cover_url: typeof body.cover_url === "string" ? body.cover_url : null,
      order_index: typeof body.order_index === "number" ? body.order_index : 100,
      xp_reward: typeof body.xp_reward === "number" ? body.xp_reward : 10,
      requires_proof: body.requires_proof === true,
      map_x: typeof body.map_x === "number" ? body.map_x : null,
      map_y: typeof body.map_y === "number" ? body.map_y : null,
      is_published: body.is_published !== false,
    })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ lesson: data }, { status: 201 });
}
