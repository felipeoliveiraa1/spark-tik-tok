import { NextResponse } from "next/server";
import { getVyralTranscription, ScraperClientError } from "@/lib/scraper-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { videoId?: string };
  try {
    body = (await request.json()) as { videoId?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.videoId) return NextResponse.json({ error: "missing_videoId" }, { status: 400 });

  try {
    const result = await getVyralTranscription(body.videoId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = err instanceof ScraperClientError && err.status ? err.status : 502;
    return NextResponse.json({ error: "scraper_unavailable", message }, { status });
  }
}
