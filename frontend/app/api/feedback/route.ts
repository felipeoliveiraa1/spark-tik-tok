import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { trackEvent } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackType = "bug" | "suggestion";

function clean(s: unknown, min: number, max: number): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (t.length < min || t.length > max) return null;
  return t;
}

/**
 * POST /api/feedback → cria um novo report (bug ou sugestao)
 *   body: { type: 'bug' | 'suggestion', title: string, description: string,
 *           page_url?: string, user_agent?: string }
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const type = body.type === "bug" || body.type === "suggestion"
    ? (body.type as FeedbackType)
    : null;
  if (!type) return NextResponse.json({ error: "invalid_type" }, { status: 400 });

  const title = clean(body.title, 3, 120);
  if (!title) return NextResponse.json({ error: "invalid_title" }, { status: 400 });

  const description = clean(body.description, 5, 2000);
  if (!description) return NextResponse.json({ error: "invalid_description" }, { status: 400 });

  const page_url = typeof body.page_url === "string" ? body.page_url.slice(0, 500) : null;
  const user_agent = typeof body.user_agent === "string" ? body.user_agent.slice(0, 500) : null;

  const { data, error } = await supabase
    .from("user_feedback")
    .insert({
      user_id: user.id,
      type,
      title,
      description,
      page_url,
      user_agent,
    })
    .select("id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void trackEvent(user.id, "feedback_submit", { type, title });

  return NextResponse.json({ id: data.id, created_at: data.created_at }, { status: 201 });
}
