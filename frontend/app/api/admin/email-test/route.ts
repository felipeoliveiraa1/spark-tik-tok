import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { sendEmail } from "@/lib/resend";
import { buildWelcomeEmail } from "@/lib/email-templates/welcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/email-test
 *   body: { to: string, kind?: "welcome" | "plain" }
 *
 * Dispara um email de teste pra confirmar que Resend + domínio + envs
 * estão funcionando. Só admin pode chamar.
 *
 * Exemplos:
 *   curl -X POST https://metodotts.app/api/admin/email-test \
 *     -H "content-type: application/json" \
 *     -H "cookie: <seu cookie de sessao>" \
 *     -d '{"to":"felipe@email.com"}'
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: { to?: string; kind?: "welcome" | "plain" };
  try {
    body = (await request.json()) as { to?: string; kind?: "welcome" | "plain" };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const to = body.to?.trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const kind = body.kind ?? "welcome";

  if (kind === "welcome") {
    const welcome = buildWelcomeEmail({
      firstName: "Felipe",
      email: to,
      temporaryPassword: "rosa-flor-7321",
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app"}/login`,
    });
    const sent = await sendEmail({
      to,
      subject: `[TESTE] ${welcome.subject}`,
      text: welcome.text,
      html: welcome.html,
      tags: [{ name: "kind", value: "email_test" }],
    });
    return NextResponse.json(sent);
  }

  // plain
  const sent = await sendEmail({
    to,
    subject: "[TESTE] Método TTS — Resend funcionando 💕",
    text: "Esse é um email de teste enviado pelo endpoint /api/admin/email-test.\n\nSe você está lendo isso, o Resend está configurado corretamente. 🌹",
    tags: [{ name: "kind", value: "email_test" }],
  });
  return NextResponse.json(sent);
}
