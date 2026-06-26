import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { XP_RULES } from "@/lib/journey/xp-rules";
import { evaluateBadgesForUser } from "@/lib/journey/badge-engine";

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

/**
 * PATCH /api/admin/jornadas/proofs/[id]
 * body: { action: "approve" | "reject", rejection_reason?: string }
 *
 * Approve: marca status='approved', completa journey_progress, soma XP,
 * roda badge engine, notifica aluna.
 * Reject: marca status='rejected' + reason, notifica aluna (poder tentar
 * de novo).
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const adminUserId = guard.user.id;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    rejection_reason?: string;
  };

  if (body.action !== "approve" && body.action !== "reject") {
    return json({ error: "invalid action" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: proof } = await supabase
    .from("journey_proofs")
    .select("id, user_id, journey_id, status, journeys!inner(slug, title)")
    .eq("id", id)
    .maybeSingle();
  if (!proof) return json({ error: "not_found" }, { status: 404 });

  const journeyRel = proof.journeys as unknown as { slug: string; title: string } | { slug: string; title: string }[];
  const journey = Array.isArray(journeyRel) ? journeyRel[0] : journeyRel;

  if (proof.status === "approved" || proof.status === "rejected") {
    return json({ error: "already_reviewed", current_status: proof.status }, { status: 409 });
  }

  const nowIso = new Date().toISOString();

  if (body.action === "approve") {
    // 1) Update proof
    const { error: updErr } = await supabase
      .from("journey_proofs")
      .update({
        status: "approved",
        reviewed_by: adminUserId,
        reviewed_at: nowIso,
      })
      .eq("id", id);
    if (updErr) return json({ error: updErr.message }, { status: 500 });

    // 2) Complete journey_progress
    await supabase
      .from("journey_progress")
      .upsert({
        user_id: proof.user_id,
        journey_id: proof.journey_id,
        status: "completed",
        completed_at: nowIso,
        proof_id: id,
      });

    // 3) XP de proof + journey_complete (se ainda nao tinha contado)
    await supabase.from("journey_xp_events").insert([
      {
        user_id: proof.user_id,
        kind: "proof_approved",
        ref_id: id,
        xp_amount: XP_RULES.proof_approved,
      },
      {
        user_id: proof.user_id,
        kind: "journey_complete",
        ref_id: proof.journey_id,
        xp_amount: XP_RULES.journey_complete,
      },
    ]);

    // 4) Badges
    let awardedBadges: Awaited<ReturnType<typeof evaluateBadgesForUser>> = [];
    try {
      awardedBadges = await evaluateBadgesForUser(supabase, {
        userId: proof.user_id,
        eventKind: "proof_approved",
      });
    } catch (err) {
      console.warn("[admin/proofs] badge engine error:", err);
    }

    // 5) Notification
    await supabase.from("journey_notifications").insert({
      user_id: proof.user_id,
      kind: "proof_approved",
      title: "Prova aprovada! 🎉",
      body: `Sua prova da "${journey?.title}" foi aprovada. Bora pra próxima jornada!`,
      ref_url: `/jornadas`,
    });

    return json({
      ok: true,
      action: "approve",
      badges_awarded: awardedBadges,
    });
  }

  // Reject
  const reason = (body.rejection_reason ?? "").trim().slice(0, 500) || null;
  const { error: updErr } = await supabase
    .from("journey_proofs")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: adminUserId,
      reviewed_at: nowIso,
    })
    .eq("id", id);
  if (updErr) return json({ error: updErr.message }, { status: 500 });

  await supabase.from("journey_notifications").insert({
    user_id: proof.user_id,
    kind: "proof_rejected",
    title: "Prova precisa de ajuste",
    body:
      reason ??
      `Sua prova da "${journey?.title}" precisa ser refeita. Manda outro print com vendas mais claras.`,
    ref_url: `/jornadas/${journey?.slug}/prova`,
  });

  return json({ ok: true, action: "reject" });
}
