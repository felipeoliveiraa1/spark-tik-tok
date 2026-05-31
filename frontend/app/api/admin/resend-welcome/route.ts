import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { generateFriendlyPassword } from "@/lib/password-gen";
import { sendEmail } from "@/lib/resend";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/admin/resend-welcome
 *   body: { email: string, regenerate_password?: boolean }
 *
 * Reenvia o email de boas-vindas pra uma aluna existente. Util quando:
 *   - Resend falhou silenciosamente no webhook Kiwify
 *   - Aluna deletou/perdeu o email original
 *
 * Se regenerate_password=true, gera nova senha temporaria e marca
 * must_reset_password=true. Senao, manda link pra /forgot-password.
 */
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
  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const regenerate = body.regenerate_password === true;

  const svc = getServiceClient();
  const { data: profile, error: profErr } = await svc
    .from("profiles")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
  const firstName = profile.name?.trim().split(/\s+/)[0] || "criadora";

  let passwordSent: string | null = null;
  if (regenerate) {
    const newPassword = generateFriendlyPassword();
    const { error: updateErr } = await svc.auth.admin.updateUserById(profile.id, {
      password: newPassword,
      user_metadata: { must_reset_password: true },
    });
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    await svc
      .from("profiles")
      .update({
        must_reset_password: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    passwordSent = newPassword;
  }

  if (passwordSent) {
    const tmpl = buildWelcomeEmail({
      firstName,
      email,
      temporaryPassword: passwordSent,
      loginUrl: `${siteUrl}/login`,
    });
    const sent = await sendEmail({
      to: email,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [{ name: "kind", value: "welcome_resent" }],
    });
    if (!sent.ok) {
      return NextResponse.json({ error: `resend_failed: ${sent.error}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "new_password", email_id: sent.id });
  }

  // Sem regenerate: manda mensagem curta com link /forgot-password
  const subject = `Acesso ao Método TTS, ${firstName} 💕`;
  const loginUrl = `${siteUrl}/login`;
  const forgotUrl = `${siteUrl}/forgot-password`;
  const text = [
    `Oi ${firstName}, tudo bem? ✨`,
    ``,
    `Reenviei o acesso ao Método TTS pra você.`,
    ``,
    `Entrar: ${loginUrl}`,
    ``,
    `Se não lembra a senha, define uma nova aqui:`,
    forgotUrl,
    ``,
    `Qualquer coisa é só responder esse email.`,
    ``,
    `Beijos,`,
    `Equipe Método TTS 🌹`,
  ].join("\n");

  const sent = await sendEmail({
    to: email,
    subject,
    text,
    tags: [{ name: "kind", value: "welcome_resent_link" }],
  });
  if (!sent.ok) {
    return NextResponse.json({ error: `resend_failed: ${sent.error}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, mode: "forgot_link", email_id: sent.id });
}
