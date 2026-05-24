import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateFriendlyPassword } from "@/lib/password-gen";
import { sendEmail } from "@/lib/resend";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Kiwify — recebe POST quando um evento acontece (compra aprovada,
 * renovação, etc).
 *
 * Fluxo (somente `order_approved`):
 *   1. Valida token (env KIWIFY_WEBHOOK_TOKEN)
 *   2. Idempotência: se event_id já existe na tabela kiwify_events, retorna 200
 *      sem fazer nada (Kiwify pode reenviar — não duplicar conta).
 *   3. Lookup profile por email:
 *      - Existe: atualiza plan_active=true + kiwify_customer_id + subscription_id.
 *        Envia email "plano reativado".
 *      - NÃO existe: cria user em auth.users com senha temporária + metadata
 *        { name, must_reset_password: true }. O trigger on_auth_user_created
 *        cria o profile automaticamente. Atualiza profile com kiwify IDs +
 *        plan_active=true. Envia email de boas-vindas com a senha.
 *   4. Registra evento em kiwify_events pra auditoria.
 *
 * Eventos não tratados (refunded, canceled, etc): apenas loga e retorna 200.
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
    next_payment?: string;
  };
  subscription_id?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
};

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

export async function POST(request: Request) {
  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;
  if (!secret) {
    console.error("[kiwify webhook] KIWIFY_WEBHOOK_TOKEN não configurado");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  // Pegamos a signature da query string (Kiwify envia em `?signature=`).
  const url = new URL(request.url);
  const signature = url.searchParams.get("signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }

  // Validação HMAC SHA1 conforme doc oficial:
  //   signature = hmac_sha1(JSON.stringify(body), secret)
  // Lemos body como texto, parseamos, depois RE-stringificamos pra calcular
  // o HMAC. Isso replica o JSON.stringify(req.body) do exemplo da doc.
  const rawBody = await request.text();
  let payload: KiwifyPayload;
  try {
    payload = JSON.parse(rawBody) as KiwifyPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const calculatedSignature = createHmac("sha1", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  // timingSafeEqual previne timing attacks. Strings precisam ter mesmo tamanho.
  if (
    signature.length !== calculatedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature))
  ) {
    console.warn("[kiwify webhook] signature invalida", {
      provided: signature.slice(0, 8),
      expected: calculatedSignature.slice(0, 8),
    });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

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

  // === Idempotência ===
  // event_id único da Kiwify: usamos order_id + event_type pra evitar duplicar
  // se Kiwify reenviar o mesmo evento.
  const eventId = `${orderId}::${eventType}`;
  const { data: existing } = await supabase
    .from("kiwify_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existing) {
    console.log("[kiwify webhook] evento já processado, ignorando", { eventId });
    return NextResponse.json({ ok: true, status: "already_processed" });
  }

  // Por enquanto só tratamos order_approved + status=paid (doc oficial Kiwify
  // recomenda checar status pra liberar acesso a área de membros propria).
  if (eventType !== "order_approved" || payload.order_status !== "paid") {
    await supabase.from("kiwify_events").insert({
      event_id: eventId,
      event_type: eventType,
      order_id: orderId,
      customer_email: email,
      payload,
    });
    console.log("[kiwify webhook] evento ignorado", {
      eventType,
      orderStatus: payload.order_status,
      orderId,
    });
    return NextResponse.json({ ok: true, status: "ignored" });
  }

  const subscriptionId =
    payload.subscription_id ?? payload.Subscription?.subscription_id ?? payload.Subscription?.id ?? null;
  const name = fullName(customer);

  // === Verifica se profile já existe ===
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    // Reativa o plano da aluna existente. Não cria conta nova, não troca senha.
    await supabase
      .from("profiles")
      .update({
        plan_active: true,
        kiwify_customer_id: customer?.CPF ?? null,
        kiwify_subscription_id: subscriptionId,
        plan_renewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);

    await supabase.from("kiwify_events").insert({
      event_id: eventId,
      event_type: eventType,
      order_id: orderId,
      customer_email: email,
      payload,
    });

    // Email de reativação (texto simples)
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://spark-tik-tok-app.vercel.app"}/login`;
    const fname = (existingProfile.name?.split(/\s+/)[0] || firstName(customer)).trim();
    await sendEmail({
      to: email,
      subject: `Plano reativado, ${fname} 💕`,
      text: `Oi ${fname}, tudo bem? ✨\n\nSeu plano no Método TTS foi reativado. Você já pode entrar com a senha de sempre:\n\n${loginUrl}\n\nQualquer coisa é só responder esse email.\n\nBeijos,\nEquipe Método TTS 🌹`,
      tags: [{ name: "kind", value: "plan_renewed" }],
    });

    return NextResponse.json({
      ok: true,
      status: "plan_renewed",
      profile_id: existingProfile.id,
    });
  }

  // === Cria conta nova ===
  const password = generateFriendlyPassword();
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      must_reset_password: true,
    },
  });

  if (createErr || !created.user) {
    console.error("[kiwify webhook] falha ao criar user", createErr);
    return NextResponse.json(
      { error: "create_user_failed", detail: createErr?.message },
      { status: 500 },
    );
  }

  // O trigger on_auth_user_created cria o profile automaticamente.
  // Aqui só atualizamos os campos Kiwify-específicos + plan_active.
  await supabase
    .from("profiles")
    .update({
      name: name || null,
      plan_active: true,
      kiwify_customer_id: customer?.CPF ?? null,
      kiwify_subscription_id: subscriptionId,
      plan_renewed_at: new Date().toISOString(),
      must_reset_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", created.user.id);

  await supabase.from("kiwify_events").insert({
    event_id: eventId,
    event_type: eventType,
    order_id: orderId,
    customer_email: email,
    payload,
  });

  // === Email de boas-vindas com senha temporária ===
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://spark-tik-tok-app.vercel.app"}/login`;
  const welcome = buildWelcomeEmail({
    firstName: firstName(customer),
    email,
    temporaryPassword: password,
    loginUrl,
  });

  const sent = await sendEmail({
    to: email,
    subject: welcome.subject,
    text: welcome.text,
    html: welcome.html,
    tags: [{ name: "kind", value: "welcome" }],
  });

  if (!sent.ok) {
    // Logamos mas não retornamos erro — a conta foi criada. Felipe pode
    // reenviar manualmente pelo admin.
    console.error("[kiwify webhook] falha ao enviar email de boas-vindas", sent.error);
  }

  return NextResponse.json({
    ok: true,
    status: "account_created",
    user_id: created.user.id,
    email_sent: sent.ok,
  });
}
