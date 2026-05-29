"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { forgotPasswordAction } from "@/lib/auth";

function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await forgotPasswordAction(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-6 shadow-lift-brand">
        <div className="w-12 h-12 rounded-full bg-good text-white flex items-center justify-center shadow-lift">
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div className="mt-4 font-display lowercase text-spark-ink leading-tight text-[26px]">
          email enviado 💕
        </div>
        <p className="mt-2 text-[13.5px] text-spark-ink-70 leading-relaxed">
          Se esse email tiver uma conta no Método TTS, você recebe em alguns segundos com o link
          pra redefinir sua senha. Olha a caixa de entrada (e o spam, só por garantia).
        </p>
        <div className="mt-5">
          <Link href="/login" className="block">
            <SButton variant="ghost" size="md" full Icon={ArrowLeft}>
              Voltar pro login
            </SButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit}>
      <div className="text-eyebrow text-spark-ink-50 mb-2">Email da sua conta</div>
      <SInput
        name="email"
        placeholder="seu@email.com"
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
        disabled={pending}
      >
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </SButton>
      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-[12.5px] font-extrabold text-spark-ink-50 hover:text-spark-ink inline-flex items-center gap-1.5 transition-colors duration-300"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Voltar pro login
        </Link>
      </div>
    </form>
  );
}

function Mobile() {
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
            <div className="mt-8 text-eyebrow text-spark-brand">✦ recuperar acesso</div>
            <h1
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{ fontSize: "clamp(2.25rem, 9vw, 3rem)" }}
            >
              esqueceu a <span className="text-grad-brand">senha?</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={300}>
            <p className="mt-4 text-fluid-lead text-spark-ink-70 max-w-[28ch] leading-snug font-semibold">
              Sem stress. Coloca seu email aqui que mandamos um link pra você criar uma senha
              nova.
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={450}>
            <div className="mt-8">
              <ForgotPasswordForm />
            </div>
          </SectionReveal>
        </div>
        <div className="pb-10 pt-8 text-[11px] text-spark-ink-50 text-center flex justify-center gap-3.5 font-extrabold uppercase tracking-wider">
          <span>Termos</span>
          <span>·</span>
          <span>Privacidade</span>
          <span>·</span>
          <span>Suporte</span>
        </div>
      </div>
    </div>
  );
}

function Desktop() {
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
              ✦ recuperação
            </div>
            <h1
              className="font-display lowercase tracking-tight leading-[0.92] mt-4 max-w-[600px]"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
            >
              sem stress,
              <br />
              <span className="opacity-95">fofa.</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={200}>
            <p className="mt-6 text-fluid-lead opacity-90 max-w-[460px] leading-snug font-semibold">
              Em segundos você recebe um link no seu email pra criar uma senha nova e continuar
              criando seus roteiros que vendem.
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
            <div className="text-eyebrow text-spark-brand">✦ recuperar senha</div>
          </SectionReveal>
          <SectionReveal direction="up" delay={100} durationMs={700}>
            <h2
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
            >
              vamos criar <span className="text-grad-brand">uma nova.</span>
            </h2>
          </SectionReveal>
          <SectionReveal direction="up" delay={250}>
            <p className="text-[14px] text-spark-ink-70 mt-3 font-semibold leading-snug">
              Coloca o email da sua conta e te mandamos o link.
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
  return <ResponsiveShell mobile={<Mobile />} desktop={<Desktop />} fullBleed />;
}
