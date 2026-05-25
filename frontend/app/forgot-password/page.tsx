"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, Check, ArrowLeft } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
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
      <div className="rounded-2xl bg-spark-brand-soft border border-spark-brand/20 p-5">
        <div className="w-10 h-10 rounded-full bg-good text-white flex items-center justify-center">
          <Check size={20} strokeWidth={2.5} />
        </div>
        <div className="mt-3 text-[16px] font-extrabold text-spark-ink">
          Email enviado 💕
        </div>
        <p className="mt-1.5 text-[13.5px] text-spark-ink-70 leading-relaxed">
          Se esse email tiver uma conta no Método TTS, você recebe em alguns segundos com o link
          pra redefinir sua senha. Olha a caixa de entrada (e o spam, só por garantia).
        </p>
        <div className="mt-4">
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
      <div className="text-[12px] text-spark-ink-50 font-semibold mb-1.5 tracking-[0.04em] uppercase">
        Email da sua conta
      </div>
      <SInput
        name="email"
        placeholder="seu@email.com"
        Icon={Mail}
        type="email"
        autoComplete="email"
        required
      />
      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] inline-flex items-center gap-2 w-full">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}
      <div className="h-3" />
      <SButton
        type="submit"
        variant="primary"
        size="lg"
        full
        IconRight={ArrowRight}
        disabled={pending}
      >
        {pending ? "Enviando…" : "Enviar link de recuperação"}
      </SButton>
      <div className="mt-3 text-center">
        <Link
          href="/login"
          className="text-[13px] font-semibold text-spark-ink-50 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} strokeWidth={1.7} />
          Voltar pro login
        </Link>
      </div>
    </form>
  );
}

function Mobile() {
  return (
    <div className="flex flex-col flex-1 px-[22px] justify-between">
      <div className="pt-[90px]" />
      <div>
        <div className="mb-9">
          <SparkMark size={120} />
        </div>
        <h1 className="text-[34px] font-extrabold tracking-tight leading-[1.05] text-spark-ink">
          Esqueceu a senha? 🌹
        </h1>
        <p className="mt-3.5 text-[15px] leading-[1.5] text-spark-ink-50 max-w-[300px]">
          Sem stress. Coloca seu email aqui que mandamos um link pra você criar uma senha nova.
        </p>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
      <div className="pb-10 text-[11px] text-spark-ink-35 text-center flex justify-center gap-3.5">
        <span>Termos</span>
        <span>·</span>
        <span>Privacidade</span>
        <span>·</span>
        <span>Suporte</span>
      </div>
    </div>
  );
}

function Desktop() {
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      <div className="flex-1 p-14 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between">
        <SparkWordmark size={36} white />
        <div>
          <div className="text-[13px] font-bold opacity-85 uppercase tracking-[0.1em]">
            🌹 Recuperação de senha
          </div>
          <h1 className="text-[52px] font-extrabold tracking-[-0.03em] leading-[1.05] mt-3 max-w-[480px]">
            Sem stress, fofa. 💕
          </h1>
          <p className="mt-4 text-[17px] leading-[1.5] opacity-90 max-w-[440px]">
            Em segundos você recebe um link no seu email pra criar uma senha nova e continuar
            criando seus roteiros que vendem.
          </p>
        </div>
        <div className="text-[11px] opacity-55 font-mono">© {new Date().getFullYear()} Método TTS</div>
      </div>

      <div className="w-[480px] p-14 bg-spark-bg flex flex-col justify-center">
        <div className="text-[13px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">
          Recuperar senha
        </div>
        <h2 className="text-[32px] font-extrabold tracking-[-0.02em] mt-2 leading-[1.15]">
          Vamos criar uma nova. 🔒
        </h2>
        <p className="text-[14px] text-spark-ink-50 mt-2">
          Coloca o email da sua conta e te mandamos o link.
        </p>

        <div className="mt-7">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return <ResponsiveShell mobile={<Mobile />} desktop={<Desktop />} fullBleed />;
}
