import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();

  const [{ data: video, error: videoErr }, { data: transcription }] = await Promise.all([
    admin.from("viral_videos").select("*").eq("id", id).maybeSingle(),
    admin.from("viral_transcriptions").select("*").eq("video_id", id).maybeSingle(),
  ]);

  if (videoErr) return NextResponse.json({ error: videoErr.message }, { status: 500 });
  if (!video) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ video, transcription });
}
