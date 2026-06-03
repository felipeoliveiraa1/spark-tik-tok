import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { trackEvent } from "@/lib/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/track/ebook-download
 * Body: { lesson_id: string, file_name?: string }
 *
 * Registra o evento ebook_download na timeline da aluna. Chamado
 * pelo botao "Baixar PDF" no <EbookCard /> antes do download comecar.
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { lesson_id?: string; file_name?: string };
  try {
    body = (await request.json()) as { lesson_id?: string; file_name?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lessonId = typeof body.lesson_id === "string" ? body.lesson_id.slice(0, 80) : null;
  if (!lessonId) {
    return NextResponse.json({ error: "missing_lesson_id" }, { status: 400 });
  }

  void trackEvent(user.id, "ebook_download", {
    lesson_id: lessonId,
    file_name: typeof body.file_name === "string" ? body.file_name.slice(0, 200) : null,
  });

  return NextResponse.json({ ok: true });
}
