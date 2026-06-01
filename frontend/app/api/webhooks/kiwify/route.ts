import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateFriendlyPassword } from "@/lib/password-gen";
import { sendEmail } from "@/lib/resend";
import { sendWhatsApp } from "@/lib/evolution";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";
import {
  buildPlanRenewedEmail,
  buildPlanLateEmail,
  buildPlanCanceledEmail,
  buildPlanRefundedEmail,
} from "@/lib/email-templates/plan";
import { buildWelcomeWhatsApp } from "@/lib/whatsapp-templates/welcome";
import { buildPlanReactivatedWhatsApp } from "@/lib/whatsapp-templates/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Kiwify — ciclo de vida da assinatura.
 *
 * Eventos tratados:
 *   order_approved/paid       → cria conta (1ª vez) OU reativa plano + welcome/reactivate email
 *   subscription_renewed      → atualiza next_payment + status=active (renovação mensal OK)
 *   subscription_late         → status=late + email warning (acesso continua)
 *   subscription_canceled     → status=canceled + expires_at=access_until + email (acesso vai até a data)
 *   order_refunded            → status=refunded + plan_active=false IMEDIATO + email
 *   chargeback                → status=chargeback + plan_active=false IMEDIATO
 *   outros                    → loga em kiwify_events e ignora
 *
 * Segurança: HMAC-SHA1(body, secret) na query string `?signature=`.
 * Idempotência: tabela kiwify_events com unique event_id (order_id::event_type).
 */

type KiwifyCustomer = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  mobile?: string;
  CPF?: string;
};

type KiwifyPayload = {
  webhook_event_type?: string;
  order_id?: string;
  order_status?: string;
  Customer?: KiwifyCustomer;
  Subscription?: {
    id?: string;
    subscription_id?: string;
    start_date?: string;
    next_payment?: string;
    status?: string;
    customer_access?: {
      has_access?: boolean;
      active_period?: boolean;
      access_until?: string;
    };
  };
  subscription_id?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  /** Kiwify pode envelopar tudo dentro de `order`. unwrapPayload normaliza. */
  order?: KiwifyPayload;
};

/**
 * Kiwify entrega payload em 2 formatos dependendo de canal/versao:
 *  A) flat:  { webhook_event_type, order_id, Customer, ... }
 *  B) wrap:  { url, signature, order: { webhook_event_type, ... } }
 * Sempre retorna o "interior" — campos no root.
 */
function unwrapPayload(raw: KiwifyPayload): KiwifyPayload {
  if (raw.order && typeof raw.order === "object" && raw.order.webhook_event_type) {
    return raw.order;
  }
  return raw;
}

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function firstName(customer: KiwifyCustomer | undefined): string {
  if (!customer) return "criadora";
  if (customer.first_name?.trim()) return customer.first_name.trim();
  if (customer.full_name?.trim()) return customer.full_name.trim().split(/\s+/)[0];
  return "criadora";
}

function fullName(customer: KiwifyCustomer | undefined): string {
  if (!customer) return "";
  if (customer.full_name?.trim()) return customer.full_name.trim();
  const parts = [customer.first_name, customer.last_name].filter(Boolean);
  return parts.join(" ").trim();
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
}

function subscriptionIdOf(payload: KiwifyPayload): string | null {
  return (
    payload.subscription_id ??
    payload.Subscription?.subscription_id ??
    payload.Subscription?.id ??
    null
  );
}

export async function POST(request: Request) {
  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;
  if (!secret) {
    console.error("[kiwify webhook] KIWIFY_WEBHOOK_TOKEN não configurado");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const signature = url.searchParams.get("signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  const rawBody = await request.text();
  let rawPayload: KiwifyPayload;
  try {
    rawPayload = JSON.parse(rawBody) as KiwifyPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Kiwify calcula HMAC-SHA1 do body exatamente como enviado. Tentamos 2
  // variantes pra cobrir os casos:
  //  - rawBody (o exato que recebemos — preferido)
  //  - JSON.stringify(rawPayload) (re-serializado, caso o body venha
  //    com format/espacos que o calc do Kiwify nao bate)
  const sigFromRaw = createHmac("sha1", secret).update(rawBody).digest("hex");
  const sigFromReserialized = createHmac("sha1", secret)
    .update(JSON.stringify(rawPayload))
    .digest("hex");

  const signatureMatches =
    (signature.length === sigFromRaw.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(sigFromRaw))) ||
    (signature.length === sigFromReserialized.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(sigFromReserialized)));

  if (!signatureMatches) {
    console.warn("[kiwify webhook] signature invalida", {
      received: signature,
      calculated_from_raw: sigFromRaw,
      calculated_from_reserialized: sigFromReserialized,
      body_length: rawBody.length,
    });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Normaliza payload — Kiwify as vezes envelopa em `{order: ...}`.
  const payload = unwrapPayload(rawPayload);

  const eventType = payload.webhook_event_type ?? "";
  const orderId = payload.order_id ?? "";
  const customer = payload.Customer;
  const email = customer?.email?.trim().toLowerCase();

  if (!eventType || !orderId) {
    return NextResponse.json({ error: "missing_event_fields" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "missing_customer_email" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    console.error("[kiwify webhook] supabase service role não configurado");
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  // Idempotência: event_id = order_id::event_type pra evitar reprocessar
  // (Kiwify reenvia até 5x se não receber 2xx em 40s).
  const eventId = `${orderId}::${eventType}`;
  const { data: existing } = await supabase
    .from("kiwify_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, status: "already_processed" });
  }

  // Sempre logamos o evento bruto pra auditoria (mesmo se for ignorado).
  const logEvent = async () => {
    await supabase.from("kiwify_events").insert({
      event_id: eventId,
      event_type: eventType,
      order_id: orderId,
      customer_email: email,
      payload,
    });
  };

  try {
    switch (eventType) {
      case "order_approved":
        if (payload.order_status === "paid") {
          const result = await handleOrderApproved({ supabase, payload, email, customer });
          await logEvent();
          return NextResponse.json(result);
        }
        await logEvent();
        return NextResponse.json({ ok: true, status: "ignored_not_paid" });

      case "subscription_renewed": {
        const result = await handleSubscriptionRenewed({ supabase, payload, email });
        await logEvent();
        return NextResponse.json(result);
      }

      case "subscription_late": {
        const result = await handleSubscriptionLate({ supabase, payload, email, customer });
        await logEvent();
        return NextResponse.json(result);
      }

      case "subscription_canceled": {
        const result = await handleSubscriptionCanceled({ supabase, payload, email, customer });
        await logEvent();
        return NextResponse.json(result);
      }

      case "order_refunded": {
        const result = await handleOrderRefunded({ supabase, payload, email, customer });
        await logEvent();
        return NextResponse.json(result);
      }

      case "chargeback": {
        const result = await handleChargeback({ supabase, payload, email });
        await logEvent();
        return NextResponse.json(result);
      }

      default:
        await logEvent();
        return NextResponse.json({ ok: true, status: "ignored", eventType });
    }
  } catch (err) {
    console.error("[kiwify webhook] erro processando evento", { eventType, orderId, err });
    // Logamos mesmo em erro pra auditoria
    try {
      await logEvent();
    } catch {
      /* noop */
    }
    return NextResponse.json(
      { error: "internal_error", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

// =================================================================
// Handlers de evento
// =================================================================

type HandlerArgs = {
  supabase: SupabaseClient;
  payload: KiwifyPayload;
  email: string;
  customer?: KiwifyCustomer;
};

/**
 * order_approved + paid = compra/renovação aprovada.
 * Se profile existe → reativa. Se não → cria conta com senha temporária.
 */
async function handleOrderApproved({
  supabase,
  payload,
  email,
  customer,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const subscriptionId = subscriptionIdOf(payload);
  const name = fullName(customer);
  const nextPayment = payload.Subscription?.next_payment ?? null;
  const mobile = customer?.mobile?.trim() || null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    // Reativa plano da aluna existente.
    const reactivatePatch: Record<string, unknown> = {
      plan_active: true,
      plan_status: "active",
      plan_expires_at: null,
      plan_canceled_at: null,
      plan_renewed_at: new Date().toISOString(),
      plan_next_payment: nextPayment,
      kiwify_customer_id: customer?.CPF ?? null,
      kiwify_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    };
    if (mobile) reactivatePatch.whatsapp = mobile;

    await supabase
      .from("profiles")
      .update(reactivatePatch)
      .eq("id", existingProfile.id);

    const fname = (existingProfile.name?.split(/\s+/)[0] || firstName(customer)).trim();
    const loginUrl = `${siteUrl()}/login`;
    const forgotUrl = `${siteUrl()}/forgot-password`;

    // Email + WhatsApp em paralelo (best-effort)
    const [emailResult, waResult] = await Promise.all([
      sendEmail({
        to: email,
        subject: `Plano reativado, ${fname} 💕`,
        text: `Oi ${fname}, tudo bem? ✨\n\nSeu plano no Método TTS foi reativado. Você já pode entrar com a senha de sempre:\n\n${loginUrl}\n\nBeijos,\nEquipe Método TTS 🌹`,
        tags: [{ name: "kind", value: "plan_reactivated" }],
      }),
      mobile
        ? sendWhatsApp({
            phone: mobile,
            text: buildPlanReactivatedWhatsApp({ firstName: fname, loginUrl, forgotUrl }).text,
          })
        : Promise.resolve({ ok: false, error: "no_mobile" } as const),
    ]);
    if (!emailResult.ok) console.error("[kiwify] falha email reativ", emailResult.error);
    if (!waResult.ok) console.warn("[kiwify] whatsapp reativ skip/falha", waResult.error);

    return {
      ok: true,
      status: "plan_reactivated",
      profile_id: existingProfile.id,
      email_sent: emailResult.ok,
      whatsapp_sent: waResult.ok,
    };
  }

  // Cria conta nova
  const password = generateFriendlyPassword();
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, must_reset_password: true },
  });

  if (createErr || !created.user) {
    throw new Error(`createUser failed: ${createErr?.message ?? "unknown"}`);
  }

  await supabase
    .from("profiles")
    .update({
      name: name || null,
      whatsapp: mobile,
      plan_active: true,
      plan_status: "active",
      plan_renewed_at: new Date().toISOString(),
      plan_next_payment: nextPayment,
      kiwify_customer_id: customer?.CPF ?? null,
      kiwify_subscription_id: subscriptionId,
      must_reset_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", created.user.id);

  const fname = firstName(customer);
  const loginUrl = `${siteUrl()}/login`;
  const welcomeEmail = buildWelcomeEmail({
    firstName: fname,
    email,
    temporaryPassword: password,
    loginUrl,
  });

  // Email + WhatsApp em paralelo (best-effort)
  const [sent, waResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      text: welcomeEmail.text,
      html: welcomeEmail.html,
      tags: [{ name: "kind", value: "welcome" }],
    }),
    mobile
      ? sendWhatsApp({
          phone: mobile,
          text: buildWelcomeWhatsApp({
            firstName: fname,
            email,
            temporaryPassword: password,
            loginUrl,
          }).text,
        })
      : Promise.resolve({ ok: false, error: "no_mobile" } as const),
  ]);
  if (!sent.ok) console.error("[kiwify] falha email welcome", sent.error);
  if (!waResult.ok) console.warn("[kiwify] whatsapp welcome skip/falha", waResult.error);

  return {
    ok: true,
    status: "account_created",
    user_id: created.user.id,
    email_sent: sent.ok,
    whatsapp_sent: waResult.ok,
  };
}

/**
 * subscription_renewed = renovação mensal aprovada. Apenas atualiza
 * datas + garante status=active. Email opcional (curto).
 */
async function handleSubscriptionRenewed({
  supabase,
  payload,
  email,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const subscriptionId = subscriptionIdOf(payload);
  const nextPayment = payload.Subscription?.next_payment ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    // Renovação sem profile? Estranho. Logamos e seguimos.
    console.warn("[kiwify webhook] subscription_renewed sem profile", { email });
    return { ok: true, status: "renewed_no_profile" };
  }

  await supabase
    .from("profiles")
    .update({
      plan_active: true,
      plan_status: "active",
      plan_expires_at: null,
      plan_canceled_at: null,
      plan_renewed_at: new Date().toISOString(),
      plan_next_payment: nextPayment,
      kiwify_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  // Email leve de confirmação
  const fname = profile.name?.split(/\s+/)[0] || "criadora";
  const tmpl = buildPlanRenewedEmail({ firstName: fname, nextPayment });
  await sendEmail({
    to: email,
    subject: tmpl.subject,
    text: tmpl.text,
    html: tmpl.html,
    tags: [{ name: "kind", value: "plan_renewed" }],
  });

  return { ok: true, status: "renewed", profile_id: profile.id };
}

/**
 * subscription_late = cobrança atrasada. Acesso CONTINUA. Marca status=late
 * pra app mostrar banner warning. Email com link pra atualizar pagamento.
 */
async function handleSubscriptionLate({
  supabase,
  payload,
  email,
  customer,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return { ok: true, status: "late_no_profile" };

  await supabase
    .from("profiles")
    .update({
      plan_active: true, // acesso continua
      plan_status: "late",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const fname = profile.name?.split(/\s+/)[0] || firstName(customer);
  const tmpl = buildPlanLateEmail({ firstName: fname });
  await sendEmail({
    to: email,
    subject: tmpl.subject,
    text: tmpl.text,
    html: tmpl.html,
    tags: [{ name: "kind", value: "plan_late" }],
  });

  return { ok: true, status: "marked_late", profile_id: profile.id };
}

/**
 * subscription_canceled = aluna cancelou. Acesso continua até access_until
 * (período já pago). Quando passar, hasActiveAccess() bloqueia automaticamente.
 */
async function handleSubscriptionCanceled({
  supabase,
  payload,
  email,
  customer,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const accessUntil = payload.Subscription?.customer_access?.access_until ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return { ok: true, status: "canceled_no_profile" };

  await supabase
    .from("profiles")
    .update({
      plan_active: true, // acesso continua até access_until
      plan_status: "canceled",
      plan_expires_at: accessUntil,
      plan_canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const fname = profile.name?.split(/\s+/)[0] || firstName(customer);
  const tmpl = buildPlanCanceledEmail({ firstName: fname, accessUntil });
  await sendEmail({
    to: email,
    subject: tmpl.subject,
    text: tmpl.text,
    html: tmpl.html,
    tags: [{ name: "kind", value: "plan_canceled" }],
  });

  return { ok: true, status: "canceled", profile_id: profile.id, access_until: accessUntil };
}

/**
 * order_refunded = reembolso. Acesso CORTADO imediato.
 */
async function handleOrderRefunded({
  supabase,
  email,
  customer,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return { ok: true, status: "refunded_no_profile" };

  await supabase
    .from("profiles")
    .update({
      plan_active: false,
      plan_status: "refunded",
      plan_expires_at: new Date().toISOString(),
      plan_canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  const fname = profile.name?.split(/\s+/)[0] || firstName(customer);
  const tmpl = buildPlanRefundedEmail({ firstName: fname });
  await sendEmail({
    to: email,
    subject: tmpl.subject,
    text: tmpl.text,
    html: tmpl.html,
    tags: [{ name: "kind", value: "plan_refunded" }],
  });

  return { ok: true, status: "refunded", profile_id: profile.id };
}

/**
 * chargeback = chargeback bancário. Acesso CORTADO imediato. Sem email
 * pra aluna (caso suspeito), só log pra Felipe acompanhar via admin.
 */
async function handleChargeback({
  supabase,
  email,
}: HandlerArgs): Promise<Record<string, unknown>> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return { ok: true, status: "chargeback_no_profile" };

  await supabase
    .from("profiles")
    .update({
      plan_active: false,
      plan_status: "chargeback",
      plan_expires_at: new Date().toISOString(),
      plan_canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  console.warn("[kiwify webhook] CHARGEBACK recebido — revisar caso", {
    email,
    profile_id: profile.id,
  });

  return { ok: true, status: "chargeback", profile_id: profile.id };
}
