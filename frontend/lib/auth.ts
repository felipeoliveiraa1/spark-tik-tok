"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer, getCurrentProfile } from "@/lib/supabase-server";

export type AuthError = { error: string };

export async function loginAction(formData: FormData): Promise<AuthError | void> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: friendlyError(error.message) };
  }

  const profile = await getCurrentProfile();
  // Atendentes CRM nao tem perfil de aluna (niche/etc) — vao direto pro CRM
  if (profile?.role === "crm_agent") {
    redirect("/crm-metodotts");
  }
  if (profile?.must_reset_password) {
    redirect("/conta?reset=1");
  }
  if (!profile?.name || !profile?.niche) {
    redirect("/welcome");
  }
  redirect("/");
}

export async function completeOnboardingAction(formData: FormData): Promise<AuthError | void> {
  const name = (formData.get("name") as string | null)?.trim();
  const niche = (formData.get("niche") as string | null)?.trim();

  if (!name) {
    return { error: "Coloca seu nome." };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      niche: niche || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.user!.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function resetPasswordAction(formData: FormData): Promise<AuthError | void> {
  const password = formData.get("password") as string | null;
  if (!password || password.length < 8) {
    return { error: "Senha precisa ter no mínimo 8 caracteres." };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("profiles")
    .update({ must_reset_password: false })
    .eq("id", userData.user!.id);

  redirect("/");
}

/**
 * Alteração de senha pra aluna que JÁ está logada e quer trocar (a partir da
 * /conta). Diferente do resetPasswordAction que redireciona pra home (caso
 * de senha temporária), aqui retorna ok e o front mostra toast — sem sair
 * da tela.
 */
export async function changePasswordAction(
  formData: FormData,
): Promise<AuthError | { ok: true }> {
  const password = formData.get("password") as string | null;
  if (!password || password.length < 8) {
    return { error: "Senha precisa ter no mínimo 8 caracteres." };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirou. Faz login de novo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("profiles")
    .update({ must_reset_password: false })
    .eq("id", userData.user.id);

  return { ok: true };
}

export async function logoutAction() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Esqueci minha senha — dispara o email do Supabase (com nosso template
 * custom). O link de recovery redireciona pra /reset-password onde a aluna
 * define a senha nova. Sempre retorna ok mesmo se o email não existe (anti
 * enumeration).
 */
export async function forgotPasswordAction(
  formData: FormData,
): Promise<{ ok: true } | AuthError> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email inválido." };
  }

  const supabase = await getSupabaseServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://metodotts.app";
  // Não checamos se o user existe — Supabase só envia se existir (anti
  // enumeration). Sempre retornamos { ok: true } pra não vazar info.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });
  return { ok: true };
}

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (lower.includes("email not confirmed")) return "Email ainda não confirmado.";
  return msg;
}
