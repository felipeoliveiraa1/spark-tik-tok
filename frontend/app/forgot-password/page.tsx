"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { LanguageFloatingSwitch } from "@/components/atoms/language-floating-switch";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { forgotPasswordAction } from "@/lib/auth";

const COOLDOWN_MS = 120_000; // 120s — bate com cooldown server-side
const COOLDOWN_KEY = "tts:lastPwdResetAt";

function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [remainingSec, setRemainingSec] = React.useState(0);

  // Se ja pediu reset ha menos de 120s (server-side tem mesmo cooldown),
  // ja mostra tela de sucesso — evita novo submit desnecessario.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const last = window.sessionStorage.getItem(COOLDOWN_KEY);
    if (!last) return;
    const elapsed = Date.now() - Number(last);
    if (elapsed < COOLDOWN_MS) {
      setSent(true);
      setRemainingSec(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
    }
  }, []);

  React.useEffect(() => {
    if (remainingSec <= 0) return;
    const id = window.setInterval(() => {
      setRemainingSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [remainingSec]);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await forgotPasswordAction(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    }
    setRemainingSec(Math.ceil(COOLDOWN_MS / 1000));
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-6 shadow-lift-brand">
        <div className="w-12 h-12 rounded-full bg-good text-white flex items-center justify-center shadow-lift">
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div className="mt-4 font-display lowercase text-spark-ink leading-tight text-[26px]">
          {t("successTitle")}
        </div>
        <p className="mt-2 text-[13.5px] text-spark-ink-70 leading-relaxed">
          {t("successBody")}
        </p>
        {remainingSec > 0 && (
          <p className="mt-3 text-[12.5px] text-spark-ink-50 leading-snug">
            Já disparamos o email. Pra pedir outro, aguarda{" "}
            <strong className="text-spark-ink-70 tabular-nums">
              {remainingSec}s
            </strong>
            . Confere sua caixa (e o spam) enquanto isso 💕
          </p>
        )}
        <div className="mt-5">
          <Link href="/login" className="block">
            <SButton variant="ghost" size="md" full Icon={ArrowLeft}>
              {t("back")}
            </SButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit}>
      <div className="text-eyebrow text-spark-ink-50 mb-2">{t("emailLabel")}</div>
      <SInput
        name="email"
        placeholder={t("emailPlaceholder")}
        Icon={Mail}
        type="email"
        autoComplete="email"
        inputMode="email"
        required
      />
      {error && (
        <div className="mt-4 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 w-full font-extrabold">
          <AlertCircle size={14} strokeWidth={2.5} />
          {error}
        </div>
      )}
      <div className="h-4" />
      <SButton
        type="submit"
        variant="primary"
        size="lg"
        full
        IconRight={ArrowRight}
        loading={pending}
      >
        {pending ? t("submitting") : t("submit")}
      </SButton>
      {pending && (
        <div className="mt-3 text-center text-[12.5px] text-spark-ink-50 font-semibold">
          {t("submittingHint")}
        </div>
      )}
      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-[12.5px] font-extrabold text-spark-ink-50 hover:text-spark-ink inline-flex items-center gap-1.5 transition-colors duration-300"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          {t("back")}
        </Link>
      </div>
    </form>
  );
}

function FooterLinks() {
  const t = useTranslations("auth.login.footer");
  return (
    <div className="pb-10 pt-8 text-[11px] text-spark-ink-50 text-center flex justify-center gap-3.5 font-extrabold uppercase tracking-wider">
      <span>{t("terms")}</span>
      <span>·</span>
      <span>{t("privacy")}</span>
      <span>·</span>
      <span>{t("support")}</span>
    </div>
  );
}

function Mobile() {
  const t = useTranslations("auth.forgot");
  return (
    <div className="flex flex-col flex-1 relative overflow-auto hero-radial">
      <HeroBlob color="rose" variant={1} className="-top-24 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-1/3 -right-32 w-[460px] h-[460px]" />
      <SparkleField count={12} seed={345} className="opacity-50" />

      <div className="relative flex flex-col flex-1 px-6 justify-between">
        <div className="pt-[80px]" />
        <div>
          <SectionReveal direction="down" durationMs={600}>
            <SparkMark size={100} />
          </SectionReveal>
          <SectionReveal direction="up" delay={150} durationMs={800}>
            <div className="mt-8 text-eyebrow text-spark-brand">{t("eyebrowMobile")}</div>
            <h1
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{ fontSize: "clamp(2.25rem, 9vw, 3rem)" }}
            >
              {t("headlineMobile1")} <span className="text-grad-brand">{t("headlineMobileHighlight")}</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={300}>
            <p className="mt-4 text-fluid-lead text-spark-ink-70 max-w-[28ch] leading-snug font-semibold">
              {t("subtitleMobile")}
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={450}>
            <div className="mt-8">
              <ForgotPasswordForm />
            </div>
          </SectionReveal>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

function Desktop() {
  const t = useTranslations("auth.forgot");
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      <div className="flex-1 p-14 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between">
        <SparkleField count={18} seed={777} color="rgba(255,255,255,0.55)" className="opacity-60" />
        <div className="relative">
          <SparkWordmark size={36} white />
        </div>
        <div className="relative">
          <SectionReveal direction="up" durationMs={700}>
            <div className="text-[12px] font-extrabold opacity-90 uppercase tracking-widest">
              {t("eyebrowSideLeft")}
            </div>
            <h1
              className="font-display lowercase tracking-tight leading-[0.92] mt-4 max-w-[600px]"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
            >
              {t("headlineSideLeft1")}
              <br />
              <span className="opacity-95">{t("headlineSideLeft2")}</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={200}>
            <p className="mt-6 text-fluid-lead opacity-90 max-w-[460px] leading-snug font-semibold">
              {t("subtitleSideLeft")}
            </p>
          </SectionReveal>
        </div>
        <div className="relative text-[11px] opacity-60 font-mono">
          © {new Date().getFullYear()} Método TTS
        </div>
      </div>

      <div className="w-[480px] p-14 bg-spark-bg flex flex-col justify-center relative overflow-hidden">
        <HeroBlob color="rose" variant={1} className="-top-32 -right-32 w-[400px] h-[400px]" />
        <SparkleField count={8} seed={333} className="opacity-50" />

        <div className="relative">
          <SectionReveal direction="down" durationMs={500}>
            <div className="text-eyebrow text-spark-brand">{t("eyebrowSideRight")}</div>
          </SectionReveal>
          <SectionReveal direction="up" delay={100} durationMs={700}>
            <h2
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
            >
              {t("headlineSideRight1")} <span className="text-grad-brand">{t("headlineSideRightHighlight")}</span>
            </h2>
          </SectionReveal>
          <SectionReveal direction="up" delay={250}>
            <p className="text-[14px] text-spark-ink-70 mt-3 font-semibold leading-snug">
              {t("subtitleSideRight")}
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={400}>
            <div className="mt-8">
              <ForgotPasswordForm />
            </div>
          </SectionReveal>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <LanguageFloatingSwitch />
      <ResponsiveShell mobile={<Mobile />} desktop={<Desktop />} fullBleed />
    </>
  );
}
