import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_FIELDS =
  "id, email, name, niche, plan_active, plan_status, must_reset_password, role, avatar_url, bio, instagram_handle, tiktok_handle, cidade_uf, meta_mensal_brl, ranking_opt_in, whatsapp, whatsapp_opt_in, created_at, language";

// Normaliza telefone BR pra formato Evolution (55 + DDD + numero, so digitos)
function normalizeWhatsapp(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  let d = trimmed.replace(/\D/g, "");
  if (!d) return null;
  // Ja em formato 55XXXXXXXXXXX
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  // Sem codigo pais — adiciona 55
  if (d.length === 10 || d.length === 11) return `55${d}`;
  // Outros tamanhos validos
  if (d.length >= 12 && d.length <= 14) return d;
  return null;
}

function clean(s: unknown, maxLen: number): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, maxLen);
  return t || null;
}

function cleanHandle(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().replace(/^@/, "").slice(0, 40);
  return t || null;
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ profile });
}

/**
 * PATCH /api/me — atualiza dados do perfil da aluna.
 * Aceita: name, niche, bio, instagram_handle, tiktok_handle, cidade_uf,
 * meta_mensal_brl, ranking_opt_in.
 * Não permite editar email, plan_active, role, avatar_url (esse vai por
 * /api/me/avatar).
 */
export async function PATCH(request: Request) {
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

  const patch: Record<string, unknown> = {};
  if ("name" in body) patch.name = clean(body.name, 80);
  if ("niche" in body) patch.niche = clean(body.niche, 80);
  if ("bio" in body) patch.bio = clean(body.bio, 240);
  if ("instagram_handle" in body) patch.instagram_handle = cleanHandle(body.instagram_handle);
  if ("tiktok_handle" in body) patch.tiktok_handle = cleanHandle(body.tiktok_handle);
  if ("cidade_uf" in body) patch.cidade_uf = clean(body.cidade_uf, 80);
  if ("meta_mensal_brl" in body) {
    const v = body.meta_mensal_brl;
    if (v === null || v === "") {
      patch.meta_mensal_brl = null;
    } else if (typeof v === "number" && v >= 0) {
      patch.meta_mensal_brl = v;
    } else {
      return NextResponse.json({ error: "invalid_meta_mensal_brl" }, { status: 400 });
    }
  }
  if ("ranking_opt_in" in body) {
    patch.ranking_opt_in = !!body.ranking_opt_in;
  }
  if ("whatsapp" in body) {
    const raw = body.whatsapp;
    if (raw === null || raw === "") {
      patch.whatsapp = null;
    } else {
      const normalized = normalizeWhatsapp(raw);
      if (!normalized) {
        return NextResponse.json(
          { error: "invalid_whatsapp", message: "Telefone inválido. Use DDD + número, ex: (11) 99999-9999" },
          { status: 400 },
        );
      }
      patch.whatsapp = normalized;
    }
  }
  if ("whatsapp_opt_in" in body) {
    patch.whatsapp_opt_in = !!body.whatsapp_opt_in;
  }
  if ("language" in body) {
    if (!isLocale(body.language)) {
      return NextResponse.json({ error: "invalid_language" }, { status: 400 });
    }
    patch.language = body.language;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select(PROFILE_FIELDS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response = NextResponse.json({ profile: data });
  // Sincroniza cookie quando aluna muda idioma — efeito instantaneo no
  // proximo render (router.refresh() do client puxa SSR com novo locale)
  if (typeof patch.language === "string") {
    response.cookies.set(LOCALE_COOKIE, patch.language, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}
