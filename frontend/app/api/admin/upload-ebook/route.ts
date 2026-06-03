import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Limite hard de 100MB — bate com o file_size_limit do bucket no SQL.
const MAX_BYTES = 100 * 1024 * 1024;

/**
 * POST /api/admin/upload-ebook  (multipart/form-data, field "file")
 *
 * Upload de ebook PDF pra aula tipo "ebook". Sobe pro bucket
 * lesson-ebooks e retorna a URL publica + metadata.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", max_mb: 100 },
      { status: 413 },
    );
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "invalid_mime", allowed: ["application/pdf"] },
      { status: 415 },
    );
  }

  // Sanitiza nome do arquivo pra path do storage. Mantemos o nome
  // original em file_name pro download bonito.
  const originalName = file.name || "ebook.pdf";
  const cleanBase = originalName
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    || "ebook";
  const path = `${cleanBase}-${randomUUID().slice(0, 8)}.pdf`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from("lesson-ebooks")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("lesson-ebooks").getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    path,
    file_name: originalName,
    file_size_bytes: file.size,
  });
}
