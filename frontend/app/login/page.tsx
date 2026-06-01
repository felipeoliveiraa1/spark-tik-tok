"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  Lock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { Sticker } from "@/components/atoms/sticker";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { loginAction } from "@/lib/auth";

// Botão separado pra poder usar useFormStatus (precisa estar dentro do <form>).
// React 19 trata server actions como transitions — useState nao reflete pending
// confiavelmente. useFormStatus e o jeito oficial.
function SubmitButton({ desktop }: { desktop: boolean }) {
  const { pending } = useFormStatus();
  return (
    <SButton
      type="submit"
      variant="primary"
      size={desktop ? "lg" : "lg"}
      full
      IconRight={ArrowRight}
      loading={pending}
    >
      {pending ? "Entrando..." : "Entrar"}
    </SButton>
  );
}

function LoginForm({ desktop = false }: { desktop?: boolean }) {
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit}>
      <div className="text-eyebrow text-spark-ink-50 mb-2">Email</div>
      <SInput
        name="email"
        placeholder="seu@email.com"
        Icon={Mail}
        type="email"
        autoComplete="email"
        inputMode="email"
        required
      />
      <div className="h-4" />
      <div className="flex items-center justify-between mb-2">
        <div className="text-eyebrow text-spark-ink-50">Senha</div>
        <Link
          href="/forgot-password"
          className="text-[12px] font-extrabold text-spark-brand hover:text-spark-brand-deep transition-colors"
        >
          Esqueci minha senha
        </Link>
      </div>
      <SInput
        name="password"
        placeholder="••••••••"
        Icon={Lock}
        type="password"
        autoComplete="current-password"
        required
      />
      {error && (
        <div className="mt-4 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 w-full font-extrabold">
          <AlertCircle size={14} strokeWidth={2.5} />
          {error}
        </div>
      )}
      <div className="h-5" />
      <SubmitButton desktop={desktop} />
    </form>
  );
}

// =================================================================
// MOBILE
// =================================================================

function LoginMobile() {
  return (
    <div className="flex flex-col flex-1 relative overflow-auto hero-radial">
      <HeroBlob color="rose" variant={1} className="-top-24 -left-32 w-[480px] h-[480px]" />
      <HeroBlob color="peach" variant={2} className="top-1/3 -right-32 w-[480px] h-[480px]" />
      <HeroBlob color="lilac" variant={3} className="-bottom-20 left-1/4 w-[420px] h-[420px]" />
      <SparkleField count={14} seed={123} className="opacity-55" />

      <div className="relative flex flex-col flex-1 px-6 pt-[72px] pb-10">
        {/* Logo + sticker rotativo no canto */}
        <div className="flex items-start justify-between">
          <SectionReveal direction="down" durationMs={500}>
            <SparkMark size={88} />
          </SectionReveal>
          <SectionReveal direction="down" delay={200} durationMs={600}>
            <div className="mt-1.5 opacity-90">
              <Sticker text="MÉTODO TTS · 2026 · " emoji="✨" size={84} />
            </div>
          </SectionReveal>
        </div>

        {/* Eyebrow + Tanker */}
        <SectionReveal direction="up" delay={250} durationMs={800}>
          <div className="mt-10 text-eyebrow text-spark-brand">✦ login</div>
          <h1
            className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{ fontSize: "clamp(2.75rem, 12vw, 3.75rem)" }}
          >
            tá em <span className="text-grad-brand">casa.</span>
          </h1>
        </SectionReveal>

        <SectionReveal direction="up" delay={400}>
          <p className="mt-4 text-fluid-lead text-spark-ink-70 max-w-[30ch] leading-snug font-semibold">
            Entra com email e senha. Seus roteiros, produtos e rotina te esperam.
          </p>
        </SectionReveal>

        {/* Form */}
        <SectionReveal direction="up" delay={550}>
          <div className="mt-8">
            <LoginForm />
          </div>
        </SectionReveal>

        {/* CTA secundário */}
        <SectionReveal direction="up" delay={700}>
          <Link
            href="/landing"
            className="group mt-8 flex items-center justify-between gap-3 p-5 rounded-spark-2xl glass border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium hover:-translate-y-0.5 shadow-rest hover:shadow-lift"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Sparkles size={16} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold text-spark-ink truncate">
                  Ainda não tem acesso?
                </div>
                <div className="text-[11.5px] text-spark-ink-50 mt-0.5 truncate">
                  Compra e recebe senha no email
                </div>
              </div>
            </div>
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              className="text-spark-brand-deep shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Link>
        </SectionReveal>

        <div className="flex-1" />

        {/* Footer */}
        <div className="pt-10 text-[10.5px] text-spark-ink-50 text-center flex justify-center gap-3 font-extrabold uppercase tracking-wider">
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

// =================================================================
// DESKTOP — split editorial
// =================================================================

function LoginDesktop() {
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      {/* LEFT — magazine cover */}
      <div className="flex-1 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between p-14">
        {/* Sparkles + blob on dark canvas */}
        <SparkleField count={20} seed={888} color="rgba(255,255,255,0.55)" className="opacity-70" />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(0.92 0.12 30 / 0.35), transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        {/* Top — wordmark */}
        <div className="relative flex items-start justify-between">
          <SparkWordmark size={36} white />
          <div className="hidden xl:block opacity-90">
            <Sticker text="MÉTODO TTS · LOGIN · 2026 · " emoji="✨" size={110} />
          </div>
        </div>

        {/* Middle — headline + stats */}
        <div className="relative max-w-[600px]">
          <SectionReveal direction="up" durationMs={700}>
            <div className="text-[12px] font-extrabold opacity-90 uppercase tracking-widest">
              ✦ método tts
            </div>
            <h1
              className="font-display lowercase tracking-tight leading-[0.88] mt-5"
              style={{ fontSize: "clamp(3.5rem, 5.5vw, 6rem)" }}
            >
              feito pra
              <br />
              criadoras
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, oklch(1 0 0), oklch(0.92 0.08 30))",
                }}
              >
                que vendem.
              </span>
            </h1>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <p className="mt-7 text-fluid-lead opacity-95 max-w-[460px] leading-snug font-semibold">
              IA pessoal que analisa produto, escreve roteiros completos e organiza sua rotina —
              tudo no celular.
            </p>
          </SectionReveal>

          {/* Stats inline */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-[480px]">
            {[
              { num: "5", label: "roteiros por produto" },
              { num: "24/7", label: "suporte tira-dúvida" },
              { num: "1", label: "clique pra começar" },
            ].map((s, i) => (
              <SectionReveal key={s.label} direction="up" delay={400 + i * 100}>
                <div>
                  <div
                    className="font-display lowercase leading-none tracking-tight"
                    style={{ fontSize: "clamp(2rem, 3vw, 3rem)" }}
                  >
                    {s.num}
                  </div>
                  <div className="mt-1.5 text-[10.5px] uppercase tracking-wider opacity-80 font-extrabold">
                    {s.label}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>

        {/* Bottom — copyright */}
        <div className="relative flex items-center justify-between">
          <div className="text-[11px] opacity-60 font-mono">
            © {new Date().getFullYear()} Método TTS
          </div>
          <div className="text-[11px] opacity-60 font-extrabold uppercase tracking-widest">
            premium edition
          </div>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="w-[520px] bg-spark-bg flex flex-col justify-center relative overflow-hidden">
        <HeroBlob color="rose" variant={1} className="-top-32 -right-40 w-[460px] h-[460px]" />
        <SparkleField count={8} seed={222} className="opacity-45" />

        <div className="relative px-14 py-12">
          <SectionReveal direction="down" durationMs={500}>
            <div className="text-eyebrow text-spark-brand">✦ entrar</div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={800}>
            <h2
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2.5rem, 3.5vw, 3.5rem)" }}
            >
              tá em <span className="text-grad-brand">casa.</span>
            </h2>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <p className="text-[14px] text-spark-ink-70 mt-4 font-semibold leading-snug max-w-[36ch]">
              Use o email e senha que você recebeu na compra. Tudo continua exatamente como você
              deixou.
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={400}>
            <div className="mt-10">
              <LoginForm desktop />
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={550}>
            <Link
              href="/landing"
              className="group mt-9 flex items-center justify-between gap-3 p-4 rounded-spark-2xl glass border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium hover:-translate-y-0.5 shadow-rest hover:shadow-lift"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                  <Sparkles size={16} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-extrabold text-spark-ink">
                    Ainda não tem acesso?
                  </div>
                  <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
                    Compra e recebe senha no email
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="text-spark-brand-deep shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </SectionReveal>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <ResponsiveShell mobile={<LoginMobile />} desktop={<LoginDesktop />} fullBleed />;
}
