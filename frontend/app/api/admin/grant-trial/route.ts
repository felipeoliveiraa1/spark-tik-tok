import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-admin";
import { generateFriendlyPassword } from "@/lib/password-gen";
import { sendEmail } from "@/lib/resend";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/grant-trial
 *   body: { emails: string[], days?: number }
 *
 * Cria contas em lote com plan_status='trial' e plan_expires_at = NOW + days.
 * Manda email de boas-vindas via Resend com a senha gerada.
 *
 * Quando o trial expira (plan_expires_at <= NOW), o hasActiveAccess() já
 * cuida de bloquear e a aluna cai em /plano-inativo → CTA pra Kiwify.
 * Se ela comprar depois, o webhook detecta email existente e REATIVA (não
 * cria conta nova).
 *
 * Retorna resumo: { created, skipped, errors }.
 */

type TrialResult =
  | { email: string; status: "created"; userId: string; emailSent: boolean }
  | { email: string; status: "exists"; userId: string }
  | { email: string; status: "error"; error: string };

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  // remove números, separa por . - _
  const parts = local.replace(/[0-9]/g, "").split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "amor";
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: { emails?: string[]; days?: number };
  try {
    body = (await request.json()) as { emails?: string[]; days?: number };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const emails = Array.isArray(body.emails)
    ? body.emails.map((e) => e.trim().toLowerCase()).filter(isValidEmail)
    : [];
  const days = typeof body.days === "number" && body.days > 0 ? Math.floor(body.days) : 30;

  if (emails.length === 0) {
    return NextResponse.json({ error: "no_valid_emails" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
  const loginUrl = `${siteUrl}/login`;

  const results: TrialResult[] = [];

  for (const email of emails) {
    try {
      // Verifica se já existe profile com esse email
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        // Já existe — só atualiza pra estender trial / reativar
        await supabase
          .from("profiles")
          .update({
            plan_active: true,
            plan_status: "trial",
            plan_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        results.push({ email, status: "exists", userId: existing.id });
        continue;
      }

      // Cria user novo
      const password = generateFriendlyPassword();
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          must_reset_password: true,
        },
      });

      if (createErr || !created.user) {
        results.push({
          email,
          status: "error",
          error: createErr?.message ?? "create_user_failed",
        });
        continue;
      }

      // Trigger on_auth_user_created já criou o profile. Atualiza com trial.
      await supabase
        .from("profiles")
        .update({
          plan_active: true,
          plan_status: "trial",
          plan_expires_at: expiresAt,
          must_reset_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", created.user.id);

      // Email welcome com aviso de trial
      const welcome = buildWelcomeEmail({
        firstName: firstNameFromEmail(email),
        email,
        temporaryPassword: password,
        loginUrl,
        trialDays: days,
      });
      const sent = await sendEmail({
        to: email,
        subject: welcome.subject,
        text: welcome.text,
        html: welcome.html,
        tags: [
          { name: "kind", value: "trial_welcome" },
          { name: "days", value: String(days) },
        ],
      });

      results.push({
        email,
        status: "created",
        userId: created.user.id,
        emailSent: sent.ok,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.push({ email, status: "error", error: msg });
    }
  }

  const summary = {
    total: emails.length,
    created: results.filter((r) => r.status === "created").length,
    exists: results.filter((r) => r.status === "exists").length,
    errors: results.filter((r) => r.status === "error").length,
    daysGranted: days,
    expiresAt,
    results,
  };

  return NextResponse.json(summary);
}
