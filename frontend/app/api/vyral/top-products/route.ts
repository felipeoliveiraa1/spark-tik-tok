import { NextResponse } from "next/server";
import { getVyralTopProducts, ScraperClientError } from "@/lib/scraper-client";
import type { VyralSearchInput } from "@scraper/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { country?: "BR" | "US"; niche?: VyralSearchInput["niche"] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const country = body.country ?? "BR";

  try {
    const result = await getVyralTopProducts({ country, niche: body.niche });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = err instanceof ScraperClientError && err.status ? err.status : 502;
    return NextResponse.json({ error: "scraper_unavailable", message }, { status });
  }
}
