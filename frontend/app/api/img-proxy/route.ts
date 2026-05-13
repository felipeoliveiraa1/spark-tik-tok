import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ALLOWED_HOSTS = new Set([
  "storage.googleapis.com",
  "p16-sign-va.tiktokcdn.com",
  "p16-sign.tiktokcdn-us.com",
  "p77-sign-va.tiktokcdn.com",
  "p9-sign-va.tiktokcdn.com",
  "vyral.com.br",
  "www.vyral.com.br",
  "app.vyral.com.br",
]);

const BROWSER_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
};

/**
 * Proxy de imagens externas que podem ter problema de CORS/referrer/expiração
 * (ex: thumbnails de virais com URL signed do GCS). O cliente chama
 * /api/img-proxy?url=<URL> e a gente faz fetch server-side, devolve com
 * cache-control generoso pra browsers não baterem de novo.
 *
 * Allowlist de hosts pra evitar virar open proxy.
 */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new NextResponse("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse(`host not allowed: ${target.hostname}`, { status: 403 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: BROWSER_HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse(`upstream ${res.status}`, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        // 1h de cache no browser + CDN (Vercel Edge cacheia também)
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "fetch failed",
      { status: 502 },
    );
  }
}
