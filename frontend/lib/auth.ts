"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "spark-session";
const ONBOARDED_COOKIE = "spark-onboarded";
const COOKIE_OPTS = {
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string | null) ?? "demo@spark.com";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeURIComponent(email), COOKIE_OPTS);

  const onboarded = cookieStore.get(ONBOARDED_COOKIE)?.value === "true";
  redirect(onboarded ? "/chat" : "/welcome");
}

export async function completeOnboardingAction() {
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDED_COOKIE, "true", COOKIE_OPTS);
  redirect("/chat");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ONBOARDED_COOKIE);
  redirect("/login");
}

export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  return raw ? decodeURIComponent(raw) : null;
}
