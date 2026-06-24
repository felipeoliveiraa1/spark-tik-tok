import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt =
    process.env.IP_HASH_SALT ?? "metodotts-group-redirect-default-salt";
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .slice(0, 16);
}

/**
 * GET /grupo
 *
 * Round-robin entre grupos WhatsApp configurados em group_redirect_links.
 * RPC atomic pick_next_group_redirect garante balanceamento perfeito mesmo
 * sob acesso concorrente.
 *
 * Tracking de UTM (utm_source, utm_medium, utm_campaign, utm_content,
 * utm_term) + ip_hash (LGPD-safe). Insert do click eh fire-and-forget pra
 * nao bloquear o redirect.
 *
 * Se nenhum link ativo disponivel (todos desativados ou com cap atingido),
 * retorna 503 com mensagem amigavel.
 */
export async function GET(request: Request) {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc("pick_next_group_redirect");
  if (error) {
    console.error("[grupo] RPC error:", error.message);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        error: "no_active_group",
        message: "Nenhum grupo disponivel no momento. Tenta novamente em alguns minutos.",
      },
      { status: 503 },
    );
  }

  const row = data[0] as { id: string; url: string };
  const linkId = row.id;
  const targetUrl = row.url;

  const { searchParams } = new URL(request.url);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  // Fire-and-forget: nao bloqueia o redirect. Errors logam mas nao afetam UX.
  void supabase
    .from("group_redirect_clicks")
    .insert({
      link_id: linkId,
      ip_hash: hashIp(ip),
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      referer: request.headers.get("referer")?.slice(0, 500) ?? null,
      utm_source: searchParams.get("utm_source")?.slice(0, 100) ?? null,
      utm_medium: searchParams.get("utm_medium")?.slice(0, 100) ?? null,
      utm_campaign: searchParams.get("utm_campaign")?.slice(0, 100) ?? null,
      utm_content: searchParams.get("utm_content")?.slice(0, 100) ?? null,
      utm_term: searchParams.get("utm_term")?.slice(0, 100) ?? null,
    })
    .then(({ error: insErr }) => {
      if (insErr) {
        console.warn("[grupo] click insert failed:", insErr.message);
      }
    });

  return NextResponse.redirect(targetUrl, 302);
}
