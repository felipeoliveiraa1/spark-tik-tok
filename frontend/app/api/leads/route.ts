import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVENUE_RANGES = ["ate_5k", "de_5k_a_20k", "de_20k_a_50k", "acima_50k"] as const;
type RevenueRange = (typeof REVENUE_RANGES)[number];

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanStr(s: unknown, min: number, max: number): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (t.length < min || t.length > max) return null;
  return t;
}

function cleanHandle(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().replace(/^@/, "");
  if (t.length < 2 || t.length > 60) return null;
  return t;
}

function cleanPhone(s: unknown): string | null {
  if (typeof s !== "string") return null;
  // Mantem apenas digitos pra validacao de tamanho, mas guarda formato original
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 20) return null;
  return s.trim().slice(0, 30);
}

/**
 * POST /api/leads — cria um novo lead a partir do formulario publico.
 * Sem auth (rota publica linkada na bio do TikTok).
 *
 *   body: {
 *     nome: string,
 *     telefone: string,
 *     tiktok_handle: string,
 *     already_selling: boolean,
 *     revenue_range?: 'ate_5k' | 'de_5k_a_20k' | 'de_20k_a_50k' | 'acima_50k',
 *     utm_source?, utm_medium?, utm_campaign?, utm_content?: string
 *   }
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const nome = cleanStr(body.nome, 2, 120);
  if (!nome) return NextResponse.json({ error: "invalid_nome" }, { status: 400 });

  const telefone = cleanPhone(body.telefone);
  if (!telefone) return NextResponse.json({ error: "invalid_telefone" }, { status: 400 });

  const tiktok_handle = cleanHandle(body.tiktok_handle);
  if (!tiktok_handle)
    return NextResponse.json({ error: "invalid_tiktok_handle" }, { status: 400 });

  if (typeof body.already_selling !== "boolean") {
    return NextResponse.json({ error: "invalid_already_selling" }, { status: 400 });
  }
  const already_selling = body.already_selling;

  let revenue_range: RevenueRange | null = null;
  if (already_selling) {
    const r = body.revenue_range;
    if (typeof r !== "string" || !REVENUE_RANGES.includes(r as RevenueRange)) {
      return NextResponse.json({ error: "invalid_revenue_range" }, { status: 400 });
    }
    revenue_range = r as RevenueRange;
  }

  const utm_source = typeof body.utm_source === "string" ? body.utm_source.slice(0, 100) : null;
  const utm_medium = typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 100) : null;
  const utm_campaign =
    typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 100) : null;
  const utm_content =
    typeof body.utm_content === "string" ? body.utm_content.slice(0, 100) : null;

  const user_agent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    null;

  // Service role pra fazer insert mesmo sem session (RLS allow_public_insert
  // tambem cobre, mas usar service evita problemas de cookies em request
  // anonimo).
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nome,
      telefone,
      tiktok_handle,
      already_selling,
      revenue_range,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      user_agent,
      ip,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
