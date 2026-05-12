"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "spark-session";
const ONBOARDED_COOKIE = "spark-onboarded";
const COOKIE_OPTS = {
  httpOnly: false, // só pra demo — em produção, true
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 dias
};

/** Mock login: any email gets you in. Sets session cookie and redirects. */
export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null) ?? "demo@spark.com";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeURIComponent(email), COOKIE_OPTS);

  // If user already finished onboarding before, go straight to home
  const onboarded = cookieStore.get(ONBOARDED_COOKIE)?.value === "true";
  redirect(onboarded ? "/" : "/welcome");
}

/** Mock onboarding completion. */
export async function completeOnboardingAction() {
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDED_COOKIE, "true", COOKIE_OPTS);
  redirect("/");
}

/** Logout — clears both cookies. */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ONBOARDED_COOKIE);
  redirect("/login");
}
