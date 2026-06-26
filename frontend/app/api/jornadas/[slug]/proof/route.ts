import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { analyzeProofImage, decideProofStatus } from "@/lib/journey/ocr";
import { XP_RULES } from "@/lib/journey/xp-rules";
import { evaluateBadgesForUser } from "@/lib/journey/badge-engine";
import { stageFromCompletedCount } from "@/lib/journey/character-stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE = {
  "cache-control": "no-store, no-cache, must-revalidate",
  pragma: "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status, headers: NO_CACHE });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/jornadas/[slug]/proof
 *
 * Aluna envia print do TikTok Shop. Sistema:
 * 1. Valida (MIME, size)
 * 2. Upload pro bucket privado journey-proofs
 * 3. Roda OCR (gpt-4o-mini Vision) — extrai sales_value + confidence
 * 4. Decide status: auto_approved se conf>=90 + sales>0, senao pending
 * 5. Insere journey_proofs
 * 6. Se auto_approved: marca journey_progress.completed + XP + badges
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const auth = await getSupabaseServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, { status: 401 });

  const { slug } = await ctx.params;
  const supabase = getServiceClient();

  // 1) Jornada existe?
  const { data: journey } = await supabase
    .from("journeys")
    .select("id, slug, is_admin_only")
    .eq("slug", slug)
    .maybeSingle();
  if (!journey) return json({ error: "not_found" }, { status: 404 });

  // 2) Ja tem prova approved/pending?
  const { data: existing } = await supabase
    .from("journey_proofs")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("journey_id", journey.id)
    .in("status", ["pending", "auto_approved", "approved"])
    .maybeSingle();
  if (existing) {
    return json(
      { error: "already_submitted", status: existing.status },
      { status: 409 },
    );
  }

  // 3) Form parse + validacao
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return json({ error: "invalid_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "too_large" }, { status: 413 });
  }

  const ext = EXT_MAP[file.type]!;
  const objectPath = `${user.id}/${slug}-${Date.now()}-${randomUUID().slice(0, 6)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // 4) Upload
  const { error: upErr } = await supabase.storage
    .from("journey-proofs")
    .upload(objectPath, buffer, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error("[proof] upload error:", upErr.message);
    return json({ error: upErr.message }, { status: 500 });
  }

  // 5) OCR
  let ocrText = "";
  let ocrConfidence = 0;
  let ocrSales: number | null = null;
  let status: "pending" | "auto_approved" = "pending";
  try {
    const analysis = await analyzeProofImage({
      imageBase64: buffer.toString("base64"),
      mimeType: file.type,
    });
    ocrText = analysis.text;
    ocrConfidence = analysis.confidence;
    ocrSales = analysis.sales_value;
    status = decideProofStatus(analysis);
  } catch (err) {
    console.warn("[proof] OCR error:", err);
  }

  // 6) Insert proof
  const { data: proof, error: insErr } = await supabase
    .from("journey_proofs")
    .insert({
      user_id: user.id,
      journey_id: journey.id,
      image_path: objectPath,
      file_name: file.name,
      file_size_bytes: file.size,
      ocr_text: ocrText,
      ocr_confidence: ocrConfidence,
      ocr_detected_sales: ocrSales,
      status,
    })
    .select("*")
    .single();
  if (insErr) {
    return json({ error: insErr.message }, { status: 500 });
  }

  let badgesAwarded: Awaited<ReturnType<typeof evaluateBadgesForUser>> = [];
  let characterStage = "bebe";

  // 7) Se auto_approved, completa journey + XP + badges
  if (status === "auto_approved") {
    await completeJourneyForUser(supabase, user.id, journey.id, proof.id);

    await supabase.from("journey_xp_events").insert({
      user_id: user.id,
      kind: "proof_approved",
      ref_id: proof.id,
      xp_amount: XP_RULES.proof_approved,
    });

    try {
      badgesAwarded = await evaluateBadgesForUser(supabase, {
        userId: user.id,
        eventKind: "proof_approved",
      });
    } catch (err) {
      console.warn("[proof] badge engine error:", err);
    }

    const { count } = await supabase
      .from("journey_progress")
      .select("journey_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");
    characterStage = stageFromCompletedCount(count ?? 0);
  }

  // 8) Notification (aluna)
  await supabase.from("journey_notifications").insert({
    user_id: user.id,
    kind: "proof_submitted",
    title:
      status === "auto_approved"
        ? "Prova aprovada! 🎉"
        : "Prova enviada — em análise",
    body:
      status === "auto_approved"
        ? "Sua prova foi aprovada automaticamente. Bora pra próxima jornada!"
        : "Em até 24h vamos revisar e te avisar aqui.",
    ref_url: `/jornadas/${slug}`,
  });

  return json({
    ok: true,
    proof,
    status,
    badges_awarded: badgesAwarded,
    character_stage: characterStage,
  });
}

/**
 * Marca journey_progress como completed + linka proof_id.
 */
async function completeJourneyForUser(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  journeyId: string,
  proofId: string,
) {
  const now = new Date().toISOString();
  await supabase
    .from("journey_progress")
    .upsert({
      user_id: userId,
      journey_id: journeyId,
      status: "completed",
      completed_at: now,
      proof_id: proofId,
    });

  // XP de journey_complete (one-off)
  await supabase.from("journey_xp_events").insert({
    user_id: userId,
    kind: "journey_complete",
    ref_id: journeyId,
    xp_amount: XP_RULES.journey_complete,
  });
}
