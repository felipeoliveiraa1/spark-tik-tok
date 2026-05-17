import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB pra capas (imagens)
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/**
 * Upload de imagens (capas) usado pelo painel admin.
 * Aceita query ?bucket=news-covers (default news-covers).
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket") || "news-covers";
  if (!["news-covers", "product-images"].includes(bucket)) {
    return NextResponse.json({ error: "invalid_bucket" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large", max_mb: 8 }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "invalid_mime", allowed: Array.from(ALLOWED_MIME) },
      { status: 415 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `admin/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: publicUrl, path });
}
