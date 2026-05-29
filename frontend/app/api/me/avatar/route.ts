import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/me/avatar
 * Multipart com field "file" (JPG/PNG/WebP até 2MB).
 * Upload pra storage avatars/{userId}/avatar.{ext}, atualiza profiles.avatar_url.
 *
 * DELETE /api/me/avatar
 * Remove arquivo + limpa avatar_url.
 */

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "invalid_type", message: "Aceita só JPG, PNG ou WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", message: "Imagem precisa ser menor que 2MB." },
      { status: 400 },
    );
  }

  const ext = extFromMime(file.type);
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Remove qualquer avatar antigo (pode ter outra extensão)
  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existing && existing.length > 0) {
    const oldPaths = existing
      .map((f) => `${user.id}/${f.name}`)
      .filter((p) => p !== path);
    if (oldPaths.length > 0) {
      await supabase.storage.from("avatars").remove(oldPaths);
    }
  }

  // Upload (upsert pra sobrescrever se mesmo path)
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // Pega URL pública + cache-bust com timestamp
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatar_url: avatarUrl });
}

export async function DELETE() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: existing } = await supabase.storage.from("avatars").list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
