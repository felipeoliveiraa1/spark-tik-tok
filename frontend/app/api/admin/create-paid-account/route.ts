import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { generateFriendlyPassword } from "@/lib/password-gen";
import { sendEmail } from "@/lib/resend";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/create-paid-account
 *   body: {
 *     email: string,
 *     name?: string,
 *     charge_amount_cents?: number,  // default 4900 (R$ 49)
 *     kiwify_fee_cents?: number,     // default 641 (taxa media)
 *     subscription_id?: string,
 *     next_payment_iso?: string,     // default +30 dias
 *   }
 *
 * Emula o que o webhook order_approved+paid faz, pra casos em que o
 * webhook nao chegou (Kiwify off, URL errada antes, etc):
 *   - Se profile existe: REATIVA (plan_active=true, status=active,
 *     limpa expires_at/canceled_at), envia "Plano reativado"
 *   - Se nao existe: cria auth user + profile, envia WELCOME com senha
 *     temporaria
 *   - Registra no kiwify_events com event_id sintetico pra evitar duplicar
 *     se o webhook chegar depois (mesmo order_id::event_type).
 */

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.metodotts.app";
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const firstName = name.split(/\s+/)[0] || "criadora";
  const whatsapp =
    typeof body.whatsapp === "string" ? body.whatsapp.trim().slice(0, 40) : null;
  const cpf = typeof body.cpf === "string" ? body.cpf.trim().slice(0, 20) : null;

  const chargeAmountCents =
    typeof body.charge_amount_cents === "number" && body.charge_amount_cents > 0
      ? body.charge_amount_cents
      : 4900;
  const kiwifyFeeCents =
    typeof body.kiwify_fee_cents === "number" && body.kiwify_fee_cents >= 0
      ? body.kiwify_fee_cents
      : 641;
  const subscriptionId =
    typeof body.subscription_id === "string" ? body.subscription_id : null;

  let nextPaymentIso =
    typeof body.next_payment_iso === "string" ? body.next_payment_iso : null;
  if (!nextPaymentIso) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 30);
    nextPaymentIso = d.toISOString();
  }

  const svc = getServiceClient();

  // Verifica se profile ja existe
  const { data: existingProfile } = await svc
    .from("profiles")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  // Payload sintetico pra registrar no kiwify_events (pra aparecer no
  // /admin/financeiro e ser idempotente vs webhook real futuro)
  const syntheticOrderId = `manual-${Date.now()}-${email.split("@")[0]}`;
  const eventType = existingProfile ? "subscription_renewed" : "order_approved";
  const eventId = `${syntheticOrderId}::${eventType}`;
  const syntheticPayload = {
    webhook_event_type: eventType,
    order_id: syntheticOrderId,
    order_status: "paid",
    Customer: {
      email,
      full_name: name || firstName,
      first_name: firstName,
      mobile: whatsapp,
      CPF: cpf,
    },
    Commissions: {
      charge_amount: chargeAmountCents,
      kiwify_fee: kiwifyFeeCents,
      my_commission: Math.max(0, chargeAmountCents - kiwifyFeeCents),
    },
    Subscription: {
      next_payment: nextPaymentIso,
      status: "active",
    },
    subscription_id: subscriptionId,
    __manual: true,
  };

  if (existingProfile) {
    // REATIVA
    const updatePatch: Record<string, unknown> = {
      plan_active: true,
      plan_status: "active",
      plan_expires_at: null,
      plan_canceled_at: null,
      plan_renewed_at: new Date().toISOString(),
      plan_next_payment: nextPaymentIso,
      kiwify_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    };
    if (whatsapp) updatePatch.whatsapp = whatsapp;
    if (cpf) updatePatch.kiwify_customer_id = cpf;

    const { error: updErr } = await svc
      .from("profiles")
      .update(updatePatch)
      .eq("id", existingProfile.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    await svc.from("kiwify_events").insert({
      event_id: eventId,
      event_type: eventType,
      order_id: syntheticOrderId,
      customer_email: email,
      payload: syntheticPayload,
    });

    const fname = existingProfile.name?.split(/\s+/)[0] || firstName;
    const loginUrl = `${siteUrl()}/login`;
    const sent = await sendEmail({
      to: email,
      subject: `Plano reativado, ${fname} 💕`,
      text: `Oi ${fname}, tudo bem? ✨\n\nSeu plano no Método TTS foi reativado. Você já pode entrar com a senha de sempre:\n\n${loginUrl}\n\nSe não lembra a senha, define uma nova em ${siteUrl()}/forgot-password\n\nBeijos,\nEquipe Método TTS 🌹`,
      tags: [{ name: "kind", value: "plan_reactivated_manual" }],
    });

    return NextResponse.json({
      ok: true,
      mode: "reactivated",
      profile_id: existingProfile.id,
      email_sent: sent.ok,
    });
  }

  // CRIA conta nova
  const password = generateFriendlyPassword();
  const { data: created, error: createErr } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, must_reset_password: true },
  });

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: `createUser failed: ${createErr?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  await svc
    .from("profiles")
    .update({
      name: name || null,
      whatsapp: whatsapp,
      kiwify_customer_id: cpf,
      plan_active: true,
      plan_status: "active",
      plan_renewed_at: new Date().toISOString(),
      plan_next_payment: nextPaymentIso,
      kiwify_subscription_id: subscriptionId,
      must_reset_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", created.user.id);

  await svc.from("kiwify_events").insert({
    event_id: eventId,
    event_type: eventType,
    order_id: syntheticOrderId,
    customer_email: email,
    payload: syntheticPayload,
  });

  const welcome = buildWelcomeEmail({
    firstName,
    email,
    temporaryPassword: password,
    loginUrl: `${siteUrl()}/login`,
  });
  const sent = await sendEmail({
    to: email,
    subject: welcome.subject,
    text: welcome.text,
    html: welcome.html,
    tags: [{ name: "kind", value: "welcome_manual" }],
  });

  return NextResponse.json({
    ok: true,
    mode: "created",
    user_id: created.user.id,
    email_sent: sent.ok,
    email_error: sent.ok ? null : sent.error,
  });
}
